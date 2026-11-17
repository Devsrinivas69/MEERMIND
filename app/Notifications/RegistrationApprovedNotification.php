<?php

namespace App\Notifications;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RegistrationApprovedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Ticket $ticket,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $event = $this->ticket->registration->event;
        $ticketUrl = url("/attendee/tickets/{$this->ticket->ticket_code}");
        $startsAt = $event->starts_at->format('l, F j, Y \a\t g:i A');

        return (new MailMessage)
            ->subject("Application Approved! Your Ticket for {$event->title} is Ready")
            ->greeting("Congratulations, {$notifiable->name}!")
            ->line("Great news! Your registration request for **{$event->title}** has been officially **approved** by the host committee.")
            ->line("**Ticket Pass Code:** `{$this->ticket->ticket_code}`")
            ->line("**Date & Time:** {$startsAt}")
            ->line('**Location:** '.($event->event_type === 'virtual' ? 'Virtual Online Gathering' : ($event->venue_name ?: 'Venue TBA')))
            ->action('Access Your Digital QR Pass', $ticketUrl)
            ->line('Your digital boarding pass with secure QR token is now ready for entrance check-in.')
            ->salutation('Warm regards, The MeetMind AI Team');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'ticket_id' => $this->ticket->id,
            'ticket_code' => $this->ticket->ticket_code,
            'event_id' => $this->ticket->registration->event_id,
            'event_title' => $this->ticket->registration->event->title,
        ];
    }
}
