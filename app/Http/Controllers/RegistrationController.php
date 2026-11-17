<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Registration;
use App\Models\Ticket;
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
     * Register the authenticated attendee for the specified event.
     */
    public function store(Request $request, string $slug): RedirectResponse
    {
        $user = $request->user();

        return DB::transaction(function () use ($user, $slug) {
            // Lock event row for update to prevent race conditions during concurrent registrations
            $event = Event::where('slug', $slug)
                ->published()
                ->lockForUpdate()
                ->firstOrFail();

            // Check if already registered
            $existing = Registration::where('event_id', $event->id)
                ->where('user_id', $user->id)
                ->first();

            if ($existing) {
                if ($existing->status === Registration::STATUS_CONFIRMED) {
                    return back()->with('info', 'You are already registered for this event.');
                }

                // If previously cancelled, re-activate
                if (! $event->hasCapacity()) {
                    return back()->with('error', 'Event is sold out. Cannot reinstate registration.');
                }

                $existing->update([
                    'status' => Registration::STATUS_CONFIRMED,
                    'cancelled_at' => null,
                    'cancellation_reason' => null,
                ]);

                if ($existing->ticket) {
                    $existing->ticket->update(['status' => Ticket::STATUS_VALID]);
                }

                $event->increment('registered_count');

                return redirect()->route('attendee.tickets.show', $existing->ticket->ticket_code)
                    ->with('success', 'Your registration has been reinstated!');
            }

            // Check capacity
            if (! $event->hasCapacity()) {
                return back()->with('error', 'Sorry, this event has reached maximum capacity.');
            }

            // Check deadline
            if ($event->registration_deadline && now()->greaterThan($event->registration_deadline)) {
                return back()->with('error', 'The registration deadline for this event has passed.');
            }

            // Create Registration
            $registration = Registration::create([
                'event_id' => $event->id,
                'user_id' => $user->id,
                'status' => Registration::STATUS_CONFIRMED,
            ]);

            // Generate unique ticket code and signed QR token
            $ticketCode = $this->qrCodeService->generateTicketCode();
            while (Ticket::where('ticket_code', $ticketCode)->exists()) {
                $ticketCode = $this->qrCodeService->generateTicketCode();
            }

            $qrToken = $this->qrCodeService->generateToken($registration->id, $event->id);

            $ticket = Ticket::create([
                'registration_id' => $registration->id,
                'ticket_code' => $ticketCode,
                'qr_token' => $qrToken,
                'status' => Ticket::STATUS_VALID,
            ]);

            // Increment event counter
            $event->increment('registered_count');

            return redirect()->route('attendee.tickets.show', $ticket->ticket_code)
                ->with('success', 'Registration confirmed! Here is your digital QR ticket.');
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
            $registration->update([
                'status' => Registration::STATUS_CANCELLED,
                'cancelled_at' => now(),
                'cancellation_reason' => $request->input('reason', 'Cancelled by attendee'),
            ]);

            if ($registration->ticket) {
                $registration->ticket->update([
                    'status' => Ticket::STATUS_CANCELLED,
                ]);
            }

            // Release spot
            $registration->event()->decrement('registered_count');
        });

        return back()->with('success', 'Your registration has been cancelled.');
    }
}
