<?php

namespace App\Http\Controllers\Organizer;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Registration;
use App\Models\Ticket;
use App\Notifications\RegistrationApprovedNotification;
use App\Notifications\RegistrationRejectedNotification;
use App\Notifications\RegistrationWaitlistedNotification;
use App\Services\QrCodeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RegistrationManagementController extends Controller
{
    public function __construct(
        protected QrCodeService $qrCodeService,
    ) {}

    /**
     * Display the organizer registration review and applicant management dashboard.
     */
    public function index(Request $request, Event $event): Response
    {
        $this->authorize('update', $event);

        $status = $request->input('status', 'pending');
        $search = trim($request->input('search', ''));

        $query = $event->registrations()
            ->with(['user', 'ticket', 'reviewer'])
            ->orderBy('created_at', 'desc');

        if ($status !== 'all') {
            if ($status === 'approved') {
                $query->whereIn('status', [Registration::STATUS_APPROVED, 'confirmed']);
            } else {
                $query->where('status', $status);
            }
        }

        if (! empty($search)) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('company', 'like', "%{$search}%");
            });
        }

        $registrations = $query->paginate(15)->withQueryString();

        $stats = [
            'total_applications' => $event->registrations()->count(),
            'pending_count' => $event->registrations()->where('status', Registration::STATUS_PENDING)->count(),
            'approved_count' => $event->approvedRegistrations()->count(),
            'waitlisted_count' => $event->registrations()->where('status', Registration::STATUS_WAITLISTED)->count(),
            'rejected_count' => $event->registrations()->where('status', Registration::STATUS_REJECTED)->count(),
            'capacity' => $event->capacity,
            'remaining_capacity' => $event->remainingCapacity(),
        ];

        return Inertia::render('organizer/events/registrations', [
            'event' => $event,
            'registrations' => $registrations,
            'stats' => $stats,
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
        ]);
    }

    /**
     * Approve an attendee application safely inside a database transaction.
     */
    public function approve(Request $request, Registration $registration): RedirectResponse
    {
        $this->authorize('update', $registration->event);

        return DB::transaction(function () use ($registration, $request) {
            $event = Event::where('id', $registration->event_id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! $event->hasCapacity()) {
                return back()->with('error', 'Cannot approve: Event has reached maximum capacity. You can place this applicant on the waitlist.');
            }

            $alreadyApproved = $registration->isApproved();

            $registration->update([
                'status' => Registration::STATUS_APPROVED,
                'approved_at' => now(),
                'reviewed_at' => now(),
                'reviewed_by' => $request->user()->id,
                'rejection_reason' => null,
            ]);

            // Issue cryptographically signed ticket pass
            $ticket = $this->qrCodeService->issueTicketForRegistration($registration);

            // Increment capacity counter if not already approved
            if (! $alreadyApproved) {
                $event->increment('registered_count');
            }

            // Dispatch attendee approval notification with digital pass link
            try {
                $registration->user->notify(new RegistrationApprovedNotification($ticket));
            } catch (\Throwable $e) {
                report($e);
            }

            return back()->with('success', "Application for {$registration->user->name} approved! Ticket {$ticket->ticket_code} generated.");
        });
    }

    /**
     * Reject an attendee application with optional reason.
     */
    public function reject(Request $request, Registration $registration): RedirectResponse
    {
        $this->authorize('update', $registration->event);

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($registration, $validated, $request) {
            $wasApproved = $registration->isApproved();

            $registration->update([
                'status' => Registration::STATUS_REJECTED,
                'reviewed_at' => now(),
                'reviewed_by' => $request->user()->id,
                'rejection_reason' => $validated['reason'] ?? null,
            ]);

            if ($registration->ticket) {
                $registration->ticket->update([
                    'status' => Ticket::STATUS_REVOKED,
                    'revoked_at' => now(),
                    'revocation_reason' => $validated['reason'] ?? 'Application rejected by organizer',
                ]);
            }

            if ($wasApproved) {
                $registration->event()->decrement('registered_count');
            }

            try {
                $registration->user->notify(new RegistrationRejectedNotification($registration, $validated['reason'] ?? null));
            } catch (\Throwable $e) {
                report($e);
            }
        });

        return back()->with('success', "Application for {$registration->user->name} was rejected.");
    }

    /**
     * Move an applicant to the event waitlist.
     */
    public function waitlist(Request $request, Registration $registration): RedirectResponse
    {
        $this->authorize('update', $registration->event);

        DB::transaction(function () use ($registration, $request) {
            $wasApproved = $registration->isApproved();

            $registration->update([
                'status' => Registration::STATUS_WAITLISTED,
                'reviewed_at' => now(),
                'reviewed_by' => $request->user()->id,
            ]);

            if ($registration->ticket) {
                $registration->ticket->update([
                    'status' => Ticket::STATUS_REVOKED,
                    'revoked_at' => now(),
                    'revocation_reason' => 'Moved to waitlist',
                ]);
            }

            if ($wasApproved) {
                $registration->event()->decrement('registered_count');
            }

            try {
                $registration->user->notify(new RegistrationWaitlistedNotification($registration));
            } catch (\Throwable $e) {
                report($e);
            }
        });

        return back()->with('success', "Moved {$registration->user->name} to the waitlist.");
    }

    /**
     * Save internal organizer review notes.
     */
    public function updateNotes(Request $request, Registration $registration): RedirectResponse
    {
        $this->authorize('update', $registration->event);

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $registration->update([
            'review_notes' => $validated['notes'] ?? null,
        ]);

        return back()->with('success', 'Internal review notes updated.');
    }

    /**
     * Perform bulk approval or rejection on selected applications.
     */
    public function bulkAction(Request $request, Event $event): RedirectResponse
    {
        $this->authorize('update', $event);

        $validated = $request->validate([
            'action' => ['required', 'string', 'in:approve,reject,waitlist'],
            'registration_ids' => ['required', 'array', 'min:1'],
            'registration_ids.*' => ['integer', 'exists:registrations,id'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $action = $validated['action'];
        $ids = $validated['registration_ids'];
        $organizer = $request->user();
        $processedCount = 0;

        try {
            DB::transaction(function () use ($event, $action, $ids, $organizer, $validated, &$processedCount) {
                $registrations = Registration::where('event_id', $event->id)
                    ->whereIn('id', $ids)
                    ->get();

                if ($action === 'approve') {
                    $lockedEvent = Event::where('id', $event->id)->lockForUpdate()->firstOrFail();
                    $available = $lockedEvent->remainingCapacity();
                    $toApprove = $registrations->filter(fn ($r) => ! $r->isApproved());

                    if ($toApprove->count() > $available) {
                        throw new \DomainException("Cannot bulk approve {$toApprove->count()} applications. Only {$available} seat(s) remaining.");
                    }

                    foreach ($registrations as $reg) {
                        if ($reg->isApproved()) {
                            continue;
                        }

                        if ($available <= 0) {
                            break;
                        }

                        $reg->update([
                            'status' => Registration::STATUS_APPROVED,
                            'approved_at' => now(),
                            'reviewed_at' => now(),
                            'reviewed_by' => $organizer->id,
                            'rejection_reason' => null,
                        ]);

                        $ticket = $this->qrCodeService->issueTicketForRegistration($reg);
                        $lockedEvent->increment('registered_count');
                        $available--;
                        $processedCount++;

                        try {
                            $reg->user->notify(new RegistrationApprovedNotification($ticket));
                        } catch (\Throwable $e) {
                            report($e);
                        }
                    }
                } elseif ($action === 'reject') {
                    foreach ($registrations as $reg) {
                        $wasApproved = $reg->isApproved();

                        $reg->update([
                            'status' => Registration::STATUS_REJECTED,
                            'reviewed_at' => now(),
                            'reviewed_by' => $organizer->id,
                            'rejection_reason' => $validated['reason'] ?? null,
                        ]);

                        if ($reg->ticket) {
                            $reg->ticket->update([
                                'status' => Ticket::STATUS_REVOKED,
                                'revoked_at' => now(),
                                'revocation_reason' => $validated['reason'] ?? 'Bulk rejected by organizer',
                            ]);
                        }

                        if ($wasApproved) {
                            $event->decrement('registered_count');
                        }

                        $processedCount++;

                        try {
                            $reg->user->notify(new RegistrationRejectedNotification($reg, $validated['reason'] ?? null));
                        } catch (\Throwable $e) {
                            report($e);
                        }
                    }
                } elseif ($action === 'waitlist') {
                    foreach ($registrations as $reg) {
                        $wasApproved = $reg->isApproved();

                        $reg->update([
                            'status' => Registration::STATUS_WAITLISTED,
                            'reviewed_at' => now(),
                            'reviewed_by' => $organizer->id,
                        ]);

                        if ($reg->ticket) {
                            $reg->ticket->update([
                                'status' => Ticket::STATUS_REVOKED,
                                'revoked_at' => now(),
                            ]);
                        }

                        if ($wasApproved) {
                            $event->decrement('registered_count');
                        }

                        $processedCount++;

                        try {
                            $reg->user->notify(new RegistrationWaitlistedNotification($reg));
                        } catch (\Throwable $e) {
                            report($e);
                        }
                    }
                }
            });
        } catch (\DomainException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', "Bulk {$action} completed successfully for {$processedCount} applications.");
    }

    /**
     * Export attendees roster as a CSV download.
     */
    public function exportCsv(Request $request, Event $event): StreamedResponse
    {
        $this->authorize('update', $event);

        $status = $request->input('status');

        $query = $event->registrations()
            ->with(['user', 'ticket', 'reviewer'])
            ->orderBy('created_at', 'asc');

        if (! empty($status) && $status !== 'all') {
            $query->where('status', $status);
        }

        $registrations = $query->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="attendees-'.$event->slug.'-'.date('Y-m-d').'.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($registrations) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'Registration ID',
                'Applicant Name',
                'Applicant Email',
                'Company',
                'Job Title',
                'Status',
                'Ticket Code',
                'Applied At',
                'Reviewed At',
                'Reviewer',
                'Review Notes',
            ]);

            foreach ($registrations as $reg) {
                fputcsv($handle, [
                    $reg->id,
                    $reg->user?->name,
                    $reg->user?->email,
                    $reg->user?->company,
                    $reg->user?->job_title,
                    strtoupper($reg->status),
                    $reg->ticket?->ticket_code ?? 'N/A',
                    $reg->application_submitted_at?->toIso8601String() ?? $reg->created_at->toIso8601String(),
                    $reg->reviewed_at?->toIso8601String() ?? 'N/A',
                    $reg->reviewer?->name ?? 'N/A',
                    $reg->review_notes ?? '',
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }
}
