<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Feedback;
use App\Models\Registration;
use App\Services\EventAiService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FeedbackController extends Controller
{
    public function __construct(
        protected EventAiService $aiService,
    ) {}

    /**
     * Submit attendee feedback for an event.
     */
    public function store(Request $request, Event $event): RedirectResponse
    {
        $user = $request->user();

        // 1. Verify user is registered for this event
        $isRegistered = Registration::where('event_id', $event->id)
            ->where('user_id', $user->id)
            ->where('status', Registration::STATUS_CONFIRMED)
            ->exists();

        if (! $isRegistered) {
            return back()->with('error', 'Only confirmed attendees can submit event feedback.');
        }

        // 2. Prevent duplicate submission
        if (Feedback::where('event_id', $event->id)->where('user_id', $user->id)->exists()) {
            return back()->with('info', 'You have already submitted a review for this event. Thank you!');
        }

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'review_text' => ['required', 'string', 'min:5', 'max:2000'],
        ]);

        // Sentiment heuristic
        $rating = (int) $validated['rating'];
        $sentiment = $rating >= 4 ? 'positive' : ($rating === 3 ? 'neutral' : 'negative');
        $score = $rating === 5 ? 1.0 : ($rating === 4 ? 0.8 : ($rating === 3 ? 0.5 : 0.2));

        Feedback::create([
            'event_id' => $event->id,
            'user_id' => $user->id,
            'rating' => $rating,
            'review_text' => strip_tags($validated['review_text']),
            'sentiment' => $sentiment,
            'sentiment_score' => $score,
        ]);

        // Update AI executive insight in background / real-time
        $this->aiService->generateFeedbackSummary($event);

        return back()->with('success', 'Thank you! Your feedback has been received and analyzed.');
    }

    /**
     * Display the AI feedback intelligence report for event organizers.
     */
    public function organizerReport(Request $request, Event $event): Response
    {
        $this->authorize('update', $event);

        $feedbacks = Feedback::where('event_id', $event->id)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        // Fetch or generate insight
        $insight = $event->aiInsights()
            ->where('insight_type', 'feedback_summary')
            ->latest()
            ->first();

        if (! $insight && $feedbacks->total() > 0) {
            $insight = $this->aiService->generateFeedbackSummary($event);
        }

        return Inertia::render('organizer/events/feedback', [
            'event' => $event,
            'feedbacks' => $feedbacks,
            'insight' => $insight,
        ]);
    }
}
