<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Registration;
use App\Models\Ticket;
use App\Notifications\RegistrationSubmittedNotification;
use App\Services\QrCodeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RegistrationController extends Controller
{
    public function __construct(
        protected QrCodeService $qrCodeService,
    ) {}

    /**
     * Submit an attendee registration application for the specified event.
     */
    public function store(Request $request, string $slug): RedirectResponse
    {
        $user = $request->user();

        // Validate optional custom question responses & application notes
        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
            'answers' => ['nullable', 'array'],
            'answers.*' => ['nullable', 'string', 'max:1000'],
        ]);

        return DB::transaction(function () use ($user, $slug, $validated) {
            $event = Event::where('slug', $slug)
                ->published()
                ->lockForUpdate()
                ->firstOrFail();

            // 1. Check existing registration
            $existing = Registration::where('event_id', $event->id)
                ->where('user_id', $user->id)
                ->first();

            if ($existing) {
                if ($existing->isApproved()) {
                    return back()->with('info', 'You are already registered and approved for this event.');
                }

                if ($existing->isPending()) {
                    return back()->with('info', 'Your registration application is already submitted and pending organizer approval.');
                }

                if ($existing->isWaitlisted()) {
                    return back()->with('info', 'You are currently on the waitlist for this event.');
                }

                if ($existing->isRejected()) {
                    return back()->with('error', 'Your previous application for this event was not approved.');
                }

                // If previously cancelled, re-apply as pending
                $existing->update([
                    'status' => Registration::STATUS_PENDING,
                    'application_submitted_at' => now(),
                    'cancelled_at' => null,
                    'cancellation_reason' => null,
                    'notes' => $validated['notes'] ?? null,
                    'answers' => $validated['answers'] ?? null,
                ]);

                // Notify organizer
                try {
                    $event->organizer?->notify(new RegistrationSubmittedNotification($existing));
                } catch (\Throwable $e) {
                    report($e);
                }

                return back()->with('success', 'Your registration request has been submitted. Waiting for organizer approval.');
            }

            // 2. Check registration deadline
            if ($event->registration_deadline && now()->greaterThan($event->registration_deadline)) {
                return back()->with('error', 'The registration deadline for this event has passed.');
            }

            // 3. Create PENDING Registration (No ticket is generated until approved)
            $registration = Registration::create([
                'event_id' => $event->id,
                'user_id' => $user->id,
                'status' => Registration::STATUS_PENDING,
                'application_submitted_at' => now(),
                'notes' => $validated['notes'] ?? null,
                'answers' => $validated['answers'] ?? null,
            ]);

            // 4. Notify the relevant organizer
            try {
                $event->organizer?->notify(new RegistrationSubmittedNotification($registration));
            } catch (\Throwable $e) {
                report($e);
            }

            return back()->with('success', 'Your registration request has been submitted. Waiting for organizer approval.');
        });
    }

    /**
     * Cancel an attendee registration.
     */
    public function cancel(Request $request, Registration $registration): RedirectResponse
    {
        $user = $request->user();

        // Must be the owner or admin
        if ($registration->user_id !== $user->id && ! $user->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        if ($registration->status === Registration::STATUS_CANCELLED) {
            return back()->with('info', 'This registration is already cancelled.');
        }

        DB::transaction(function () use ($registration, $request) {
            $wasApproved = $registration->isApproved();

            $registration->update([
                'status' => Registration::STATUS_CANCELLED,
                'cancelled_at' => now(),
                'cancellation_reason' => $request->input('reason', 'Cancelled by attendee'),
            ]);

            if ($registration->ticket) {
                $registration->ticket->update([
                    'status' => Ticket::STATUS_CANCELLED,
                    'revoked_at' => now(),
                    'revocation_reason' => 'Registration cancelled by attendee',
                ]);
            }

            // Release reserved capacity ONLY if this registration was approved
            if ($wasApproved) {
                $registration->event()->decrement('registered_count');
            }
        });

        return back()->with('success', 'Your registration application has been cancelled.');
    }
}
