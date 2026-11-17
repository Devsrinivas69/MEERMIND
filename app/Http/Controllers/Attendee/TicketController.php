<?php

namespace App\Http\Controllers\Attendee;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Services\QrCodeService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    public function __construct(
        protected QrCodeService $qrCodeService,
    ) {}

    /**
     * Display a listing of attendee's registered events and tickets.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $registrations = $user->registrations()
            ->with(['event.category', 'ticket.checkIn'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('attendee/tickets/index', [
            'registrations' => $registrations,
        ]);
    }

    /**
     * Display the digital QR ticket view.
     */
    public function show(Request $request, string $ticketCode): Response
    {
        $ticket = Ticket::where('ticket_code', $ticketCode)
            ->with(['registration.user', 'registration.event.organizer', 'registration.event.category', 'checkIn'])
            ->firstOrFail();

        // Authorize view via TicketPolicy
        $this->authorize('view', $ticket);

        // Generate SVG string for the QR token
        $qrSvg = $this->qrCodeService->generateSvg($ticket->qr_token, 240);

        return Inertia::render('attendee/tickets/show', [
            'ticket' => $ticket,
            'qrSvg' => $qrSvg,
        ]);
    }
}
