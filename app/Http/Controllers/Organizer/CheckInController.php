<?php

namespace App\Http\Controllers\Organizer;

use App\Http\Controllers\Controller;
use App\Models\CheckIn;
use App\Models\Event;
use App\Models\Ticket;
use App\Notifications\CheckInConfirmedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CheckInController extends Controller
{
    /**
     * Display the QR scanner and check-in terminal for the specified event.
     */
    public function show(Request $request, Event $event): Response
    {
        $this->authorize('checkIn', $event);

        $event->load(['category']);

        $recentCheckIns = $event->checkIns()
            ->with(['ticket.registration.user', 'organizer'])
            ->orderBy('checked_in_at', 'desc')
            ->take(15)
            ->get();

        $stats = [
            'total_registered' => $event->registered_count,
            'total_checked_in' => $event->checkIns()->count(),
            'capacity' => $event->capacity,
        ];

        return Inertia::render('organizer/events/check-in', [
            'event' => $event,
            'recentCheckIns' => $recentCheckIns,
            'stats' => $stats,
        ]);
    }

    /**
     * Validate and process a check-in via QR token or manual ticket code.
     */
    public function verify(Request $request, Event $event): JsonResponse
    {
        $this->authorize('checkIn', $event);

        $token = trim($request->input('token') ?? $request->input('qr_payload') ?? '');
        $code = trim($request->input('code', ''));
        $method = $request->input('method', CheckIn::METHOD_QR_SCAN);

        if (empty($token) && empty($code)) {
            return response()->json([
                'success' => false,
                'status' => 'invalid_request',
                'message' => 'Please provide a QR token or ticket code to verify.',
            ], 422);
        }

        // Query ticket with relationships
        $ticketQuery = Ticket::with(['registration.user', 'registration.event', 'checkIn.organizer']);

        if (! empty($token)) {
            $ticket = $ticketQuery->where('qr_token', $token)->first();
        } else {
            $ticket = $ticketQuery->where('ticket_code', strtoupper($code))->first();
        }

        // 1. Ticket existence check
        if (! $ticket) {
            return response()->json([
                'success' => false,
                'status' => 'not_found',
                'message' => 'Invalid ticket: No matching registration record found in system.',
            ], 404);
        }

        // 2. Event association check
        if ($ticket->registration->event_id !== $event->id) {
            $otherEventTitle = $ticket->registration->event->title ?? 'another event';

            return response()->json([
                'success' => false,
                'status' => 'wrong_event',
                'message' => "Wrong Event! This ticket was issued for \"{$otherEventTitle}\", not this event.",
                'attendee_name' => $ticket->registration->user->name ?? 'Unknown',
            ], 422);
        }

        // 3. Registration approval status check
        if (! $ticket->registration->isApproved()) {
            return response()->json([
                'success' => false,
                'status' => 'not_approved',
                'message' => "Entrance Denied: Registration is {$ticket->registration->status}. Only approved attendees can check in.",
                'attendee_name' => $ticket->registration->user->name ?? 'Unknown',
            ], 422);
        }

        // 4. Ticket revocation or expiration check
        if ($ticket->status === Ticket::STATUS_REVOKED || $ticket->status === Ticket::STATUS_EXPIRED || $ticket->status === Ticket::STATUS_CANCELLED) {
            return response()->json([
                'success' => false,
                'status' => 'revoked',
                'message' => "Ticket {$ticket->ticket_code} is revoked or cancelled. Entrance denied.",
                'attendee_name' => $ticket->registration->user->name ?? 'Unknown',
            ], 422);
        }

        // 4. Duplicate check-in check
        if ($ticket->status === Ticket::STATUS_USED || $ticket->checked_in_at !== null) {
            $checkedInAt = $ticket->checked_in_at
                ? $ticket->checked_in_at->format('M j, Y - g:i A')
                : 'earlier today';
            $checkedInBy = $ticket->checkIn?->organizer?->name ?? 'Staff';

            return response()->json([
                'success' => false,
                'status' => 'already_used',
                'message' => "Duplicate Check-In! This ticket was already verified at {$checkedInAt} by {$checkedInBy}.",
                'attendee' => [
                    'name' => $ticket->registration->user->name,
                    'email' => $ticket->registration->user->email,
                    'ticket_code' => $ticket->ticket_code,
                    'checked_in_at' => $checkedInAt,
                ],
            ], 409);
        }

        // 5. Successful check-in transaction
        $checkIn = DB::transaction(function () use ($ticket, $event, $request, $method) {
            $now = now();

            $ticket->update([
                'status' => Ticket::STATUS_USED,
                'checked_in_at' => $now,
            ]);

            return CheckIn::create([
                'ticket_id' => $ticket->id,
                'event_id' => $event->id,
                'checked_in_by' => $request->user()->id,
                'checked_in_at' => $now,
                'method' => $method,
                'device_info' => $request->userAgent(),
                'notes' => $request->input('notes'),
            ]);
        });

        $attendee = $ticket->registration->user;

        // Dispatch Check-In confirmation notification to attendee
        try {
            $attendee->notify(new CheckInConfirmedNotification($ticket, $checkIn));
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json([
            'success' => true,
            'status' => 'checked_in',
            'message' => "Welcome, {$attendee->name}! Check-in verified successfully.",
            'attendee' => [
                'id' => $attendee->id,
                'name' => $attendee->name,
                'email' => $attendee->email,
                'company' => $attendee->company,
                'job_title' => $attendee->job_title,
                'ticket_code' => $ticket->ticket_code,
                'checked_in_at' => $checkIn->checked_in_at->format('g:i:s A'),
                'method' => $checkIn->method,
            ],
            'updated_stats' => [
                'total_registered' => $event->registered_count,
                'total_checked_in' => $event->checkIns()->count(),
                'capacity' => $event->capacity,
            ],
        ]);
    }
}
