<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Feedback;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Support\Facades\Http;

class OrganizerCopilotService
{
    /**
     * Ask the Organizer Copilot a query grounded in live event data.
     *
     * @return array{
     *     reply: string,
     *     actions: array<int, array{type: string, id?: int, label: string, description: string, url?: string, method?: string, data?: array}>,
     *     metrics: array<string, mixed>
     * }
     */
    public function ask(Event $event, User $organizer, string $query): array
    {
        // 1. Live Context Retrieval
        $stats = $this->gatherLiveEventContext($event);

        // 2. LLM or Grounded Synthesizer Generation
        $result = $this->generateResponse($event, $stats, $query);

        return $result;
    }

    /**
     * Gather real-time database state for the event.
     *
     * @return array<string, mixed>
     */
    public function gatherLiveEventContext(Event $event): array
    {
        $event->refresh();

        $pendingRegistrations = $event->registrations()
            ->with('user')
            ->where('status', Registration::STATUS_PENDING)
            ->latest('application_submitted_at')
            ->get();

        $approvedRegistrations = $event->registrations()
            ->with(['user', 'ticket'])
            ->where('status', Registration::STATUS_APPROVED)
            ->get();

        $waitlistedRegistrations = $event->registrations()
            ->with('user')
            ->where('status', Registration::STATUS_WAITLISTED)
            ->get();

        $rejectedRegistrations = $event->registrations()
            ->with('user')
            ->where('status', Registration::STATUS_REJECTED)
            ->get();

        $checkedInCount = $approvedRegistrations->filter(
            fn ($r) => $r->ticket && $r->ticket->isUsed()
        )->count();

        $approvedCount = $approvedRegistrations->count();
        $effectiveApproved = max($event->registered_count, $approvedCount);
        $remainingCapacity = max(0, $event->capacity - $effectiveApproved);
        $turnoutRate = $approvedCount > 0 ? round(($checkedInCount / $approvedCount) * 100, 1) : 0;

        // Feedback
        $feedbackItems = Feedback::where('event_id', $event->id)->get();
        $avgRating = $feedbackItems->avg('rating') ? round($feedbackItems->avg('rating'), 2) : null;

        return [
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'status' => $event->status,
                'capacity' => $event->capacity,
                'registered_count' => $approvedCount,
                'remaining_capacity' => $remainingCapacity,
                'checked_in_count' => $checkedInCount,
                'turnout_rate' => $turnoutRate,
                'starts_at' => $event->starts_at->toIso8601String(),
                'venue' => $event->venue_name ?? 'Virtual',
                'requires_approval' => (bool) $event->requires_approval,
            ],
            'pending' => $pendingRegistrations->map(fn ($r) => [
                'id' => $r->id,
                'user_id' => $r->user_id,
                'name' => $r->user?->name ?? 'Unknown',
                'email' => $r->user?->email ?? 'No email',
                'submitted_at' => $r->application_submitted_at?->diffForHumans() ?? $r->created_at->diffForHumans(),
                'answers' => $r->answers,
                'review_notes' => $r->review_notes,
            ])->values()->all(),
            'approved_count' => $approvedCount,
            'waitlisted_count' => $waitlistedRegistrations->count(),
            'rejected_count' => $rejectedRegistrations->count(),
            'feedback' => [
                'total_count' => $feedbackItems->count(),
                'average_rating' => $avgRating,
                'recent_comments' => $feedbackItems->whereNotNull('comments')->take(5)->pluck('comments')->all(),
            ],
        ];
    }

    /**
     * Generate grounded response and identify actionable suggestions.
     *
     * @param  array<string, mixed>  $stats
     * @return array{reply: string, actions: array, metrics: array}
     */
    protected function generateResponse(Event $event, array $stats, string $query): array
    {
        $openaiKey = config('services.openai.key');

        if ($openaiKey) {
            try {
                $contextJson = json_encode($stats, JSON_PRETTY_PRINT);
                $systemPrompt = <<<PROMPT
You are MeetMind AI's live Event Organizer Copilot for "{$event->title}".
Your primary duty is to help the organizer manage applications, capacity, attendance, and feedback.
CRITICAL RULES:
1. Base all facts, numbers, attendee names, and capacity counts STRICTLY on the live EVENT DATA provided below.
2. NEVER hallucinate or invent applicants, attendee names, or numbers.
3. If the user asks about pending applicants, summarize them faithfully.
4. Keep answers concise, executive, and actionable.
5. If recommending approval for specific pending applicants, specify their ID and full name.

LIVE EVENT DATA:
{$contextJson}
PROMPT;

                $response = Http::withToken($openaiKey)
                    ->timeout(10)
                    ->post('https://api.openai.com/v1/chat/completions', [
                        'model' => 'gpt-4o-mini',
                        'messages' => [
                            ['role' => 'system', 'content' => $systemPrompt],
                            ['role' => 'user', 'content' => $query],
                        ],
                        'temperature' => 0.2,
                        'max_tokens' => 600,
                    ]);

                if ($response->successful()) {
                    $json = $response->json();
                    $reply = $json['choices'][0]['message']['content'] ?? null;
                    if ($reply) {
                        $actions = $this->extractActionsFromContext($stats, $query, $reply);

                        return [
                            'reply' => $reply,
                            'actions' => $actions,
                            'metrics' => $stats['event'],
                        ];
                    }
                }
            } catch (\Throwable $e) {
                // Fall back to deterministic grounded engine
            }
        }

        return $this->deterministicGroundedEngine($event, $stats, $query);
    }

    /**
     * Deterministic, zero-hallucination intelligent copilot engine grounded in live data.
     *
     * @param  array<string, mixed>  $stats
     * @return array{reply: string, actions: array, metrics: array}
     */
    protected function deterministicGroundedEngine(Event $event, array $stats, string $query): array
    {
        $q = strtolower(trim($query));
        $actions = [];
        $ev = $stats['event'];
        $pending = $stats['pending'];
        $pendingCount = count($pending);
        $rem = $ev['remaining_capacity'];

        // 1. Pending Applications & Summaries
        if (str_contains($q, 'pending') || str_contains($q, 'applicant') || str_contains($q, 'who applied') || str_contains($q, 'applications')) {
            if ($pendingCount === 0) {
                $reply = "You currently have **0 pending applications** for \"{$event->title}\". All submitted applications have already been reviewed. There are **{$rem} seats remaining** out of the total capacity of {$ev['capacity']}.";
            } else {
                $reply = "You have **{$pendingCount} pending application(s)** awaiting review for \"{$event->title}\" (Remaining capacity: **{$rem} seats**):\n\n";
                foreach ($pending as $p) {
                    $reply .= "- **{$p['name']}** (`{$p['email']}`) — applied {$p['submitted_at']}\n";
                    if (! empty($p['answers'])) {
                        foreach ($p['answers'] as $qKey => $ans) {
                            $reply .= '  * _'.ucwords(str_replace('_', ' ', $qKey)).":_ {$ans}\n";
                        }
                    }
                    if (! empty($p['review_notes'])) {
                        $reply .= "  * _Internal note:_ {$p['review_notes']}\n";
                    }

                    if ($rem > 0) {
                        $actions[] = [
                            'type' => 'approve_registration',
                            'id' => $p['id'],
                            'label' => "Approve {$p['name']}",
                            'description' => "Confirm application #{$p['id']} and issue digital QR ticket to {$p['email']}.",
                            'method' => 'POST',
                            'url' => route('organizer.registrations.approve', $p['id']),
                        ];
                    }
                }

                if ($pendingCount > 1 && $rem >= $pendingCount) {
                    $actions[] = [
                        'type' => 'bulk_approve',
                        'label' => "Bulk Approve All ({$pendingCount} applicants)",
                        'description' => "Atomically approve all {$pendingCount} pending applications. Capacity will decrease from {$rem} to ".($rem - $pendingCount).'.',
                        'method' => 'POST',
                        'url' => route('organizer.events.registrations.bulk', $event->id),
                        'data' => [
                            'action' => 'approve',
                            'registration_ids' => array_column($pending, 'id'),
                        ],
                    ];
                }
            }

            return [
                'reply' => $reply,
                'actions' => $actions,
                'metrics' => $ev,
            ];
        }

        // 2. Capacity & Seats Status
        if (str_contains($q, 'capacity') || str_contains($q, 'seat') || str_contains($q, 'remaining') || str_contains($q, 'spots') || str_contains($q, 'space')) {
            $reply = "### Capacity & Registration Status for \"{$event->title}\"\n\n";
            $reply .= "- **Total Capacity:** {$ev['capacity']} seats\n";
            $reply .= "- **Approved Attendees:** {$ev['registered_count']} confirmed\n";
            $reply .= "- **Available Seats:** **{$rem} spots left**\n";
            $reply .= "- **Pending Review:** {$pendingCount} applications waiting\n";
            $reply .= "- **Waitlisted:** {$stats['waitlisted_count']}\n";
            $reply .= "- **Turnout Check-in:** {$ev['checked_in_count']} checked in ({$ev['turnout_rate']}% of approved)\n\n";

            if ($rem === 0) {
                $reply .= "> [!WARNING]\n> This event has reached maximum capacity! Any further approvals will be rejected unless you expand the event capacity in event settings.";
            } elseif ($pendingCount > 0) {
                $reply .= "You have {$pendingCount} applicants waiting for review. You can safely approve up to **{$rem}** without exceeding venue limits.";
            }

            return [
                'reply' => $reply,
                'actions' => $actions,
                'metrics' => $ev,
            ];
        }

        // 3. Senior Engineers, Roles, Founders
        if (str_contains($q, 'senior') || str_contains($q, 'founder') || str_contains($q, 'engineer') || str_contains($q, 'developer') || str_contains($q, 'background') || str_contains($q, 'role')) {
            $matches = [];
            foreach ($pending as $p) {
                $searchStr = strtolower($p['name'].' '.$p['email'].' '.json_encode($p['answers'] ?? []));
                if (str_contains($searchStr, 'senior') || str_contains($searchStr, 'founder') || str_contains($searchStr, 'engineer') || str_contains($searchStr, 'architect') || str_contains($searchStr, 'lead') || str_contains($searchStr, 'cto')) {
                    $matches[] = $p;
                }
            }

            if (empty($matches)) {
                $reply = "I analyzed all pending applications. None of the current pending applicants explicitly listed senior, founder, or engineering titles in their submitted responses. Total pending applicants: **{$pendingCount}**.";
            } else {
                $reply = 'Found **'.count($matches)." applicant(s)** with engineering, leadership, or founder backgrounds in pending applications:\n\n";
                foreach ($matches as $m) {
                    $reply .= "- **{$m['name']}** (`{$m['email']}`)\n";
                    if (! empty($m['answers'])) {
                        foreach ($m['answers'] as $k => $v) {
                            $reply .= "  * _{$k}:_ {$v}\n";
                        }
                    }

                    $actions[] = [
                        'type' => 'approve_registration',
                        'id' => $m['id'],
                        'label' => "Approve {$m['name']}",
                        'description' => "Prioritize and approve {$m['name']} (#{$m['id']}).",
                        'method' => 'POST',
                        'url' => route('organizer.registrations.approve', $m['id']),
                    ];
                }
            }

            return [
                'reply' => $reply,
                'actions' => $actions,
                'metrics' => $ev,
            ];
        }

        // 4. Feedback & Sentiment Summary
        if (str_contains($q, 'feedback') || str_contains($q, 'rating') || str_contains($q, 'sentiment') || str_contains($q, 'review') || str_contains($q, 'survey')) {
            $fb = $stats['feedback'];
            if ($fb['total_count'] === 0) {
                $reply = 'No attendee feedback has been submitted for this event yet. Feedback collection opens automatically for attendees after event conclusion.';
            } else {
                $reply = "### Feedback Intelligence for \"{$event->title}\"\n\n";
                $reply .= "- **Total Reviews:** {$fb['total_count']}\n";
                $reply .= "- **Average Rating:** **{$fb['average_rating']} / 5.0**\n\n";
                if (! empty($fb['recent_comments'])) {
                    $reply .= "**Recent Attendee Voices:**\n";
                    foreach ($fb['recent_comments'] as $c) {
                        $reply .= "- \"{$c}\"\n";
                    }
                }
            }

            return [
                'reply' => $reply,
                'actions' => $actions,
                'metrics' => $ev,
            ];
        }

        // 5. Draft Email / Announcement
        if (str_contains($q, 'draft') || str_contains($q, 'email') || str_contains($q, 'announcement') || str_contains($q, 'message')) {
            $target = str_contains($q, 'waitlist') ? 'Waitlisted Applicants' : 'Confirmed Attendees';
            $reply = "### Draft Announcement for {$target}\n\n";
            $reply .= "**Subject:** Important update regarding {$event->title}\n\n";
            $reply .= "Dear Attendee,\n\n";
            $reply .= "Thank you for your interest in **{$event->title}**. We are putting the final touches on an extraordinary gathering at {$ev['venue']}.\n\n";
            if (str_contains($q, 'waitlist')) {
                $reply .= "You are currently on our priority waitlist. As capacity opens up, applications will be approved in submission order. You will receive an immediate notification with your QR ticket as soon as a seat becomes available.\n\n";
            } else {
                $reply .= "Your cryptographic boarding pass is ready in your MeetMind account. Please have your unique QR code open on your device when arriving at registration.\n\n";
            }
            $reply .= "Best regards,\n**{$organizer->name}**\nMeetMind AI Event Team";

            return [
                'reply' => $reply,
                'actions' => $actions,
                'metrics' => $ev,
            ];
        }

        // Default General Summary
        $reply = "### Event Overview: \"{$event->title}\"\n\n";
        $reply .= '- **Current Status:** '.ucfirst($ev['status'])."\n";
        $reply .= "- **Capacity:** {$ev['registered_count']} / {$ev['capacity']} seats booked (**{$rem} remaining**)\n";
        $reply .= "- **Pending Applications:** **{$pendingCount} awaiting approval**\n";
        $reply .= "- **Turnout Check-in:** {$ev['checked_in_count']} checked in ({$ev['turnout_rate']}%)\n\n";
        $reply .= "You can ask me to:\n";
        $reply .= "- _\"Summarize all pending applications\"_\n";
        $reply .= "- _\"Are there any senior engineers or founders among applicants?\"_\n";
        $reply .= "- _\"What is our capacity and seat pacing?\"_\n";
        $reply .= "- _\"Summarize attendee feedback\"_\n";
        $reply .= '- _"Draft an announcement email to attendees"_';

        if ($pendingCount > 0 && $rem > 0) {
            $first = $pending[0];
            $actions[] = [
                'type' => 'approve_registration',
                'id' => $first['id'],
                'label' => "Review & Approve {$first['name']}",
                'description' => "Confirm application #{$first['id']} ({$first['email']}).",
                'method' => 'POST',
                'url' => route('organizer.registrations.approve', $first['id']),
            ];
        }

        return [
            'reply' => $reply,
            'actions' => $actions,
            'metrics' => $ev,
        ];
    }

    /**
     * Extract structured actionable buttons if the LLM mentioned specific pending applicant IDs.
     *
     * @param  array<string, mixed>  $stats
     * @return array<int, array<string, mixed>>
     */
    protected function extractActionsFromContext(array $stats, string $query, string $reply): array
    {
        $actions = [];
        $pending = $stats['pending'];
        $rem = $stats['event']['remaining_capacity'];

        if ($rem <= 0) {
            return $actions;
        }

        foreach ($pending as $p) {
            // Check if applicant is referenced by name or id in the answer
            if (stripos($reply, $p['name']) !== false || stripos($reply, "#{$p['id']}") !== false) {
                $actions[] = [
                    'type' => 'approve_registration',
                    'id' => $p['id'],
                    'label' => "Approve {$p['name']}",
                    'description' => "Confirm application #{$p['id']} and issue cryptographic QR ticket.",
                    'method' => 'POST',
                    'url' => route('organizer.registrations.approve', $p['id']),
                ];
            }
        }

        return $actions;
    }
}
