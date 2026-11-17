<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    /**
     * Determine whether the user can view the ticket.
     */
    public function view(User $user, Ticket $ticket): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        // Attendee who owns the registration
        if ($ticket->registration && $ticket->registration->user_id === $user->id) {
            return true;
        }

        // Event organizer
        if ($ticket->registration && $ticket->registration->event && $ticket->registration->event->organizer_id === $user->id) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can check in this ticket.
     */
    public function checkIn(User $user, Ticket $ticket): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        // Must be the organizer of the event
        return $ticket->registration
            && $ticket->registration->event
            && $ticket->registration->event->organizer_id === $user->id;
    }
}
