<?php

namespace App\Notifications;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketIssuedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Ticket $ticket,
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $event = $this->ticket->registration->event;
        $ticketUrl = url("/attendee/tickets/{$this->ticket->ticket_code}");

        $startsAt = $event->starts_at->format('l, F j, Y \a\t g:i A');
        $location = $event->event_type === 'virtual'
            ? 'Virtual Online Gathering'
            : ($event->venue_name ? "{$event->venue_name} ({$event->venue_city})" : 'Venue TBA');

        return (new MailMessage)
            ->subject("Your Ticket for {$event->title} — MeetMind AI")
            ->greeting("Hello {$notifiable->name}!")
            ->line("You are officially registered for **{$event->title}**.")
            ->line("**Ticket Pass Code:** `{$this->ticket->ticket_code}`")
            ->line("**Date & Time:** {$startsAt}")
            ->line("**Location:** {$location}")
            ->action('View Your Digital QR Ticket', $ticketUrl)
            ->line('Present your digital QR code at the entrance for rapid scanner validation.')
            ->salutation('Best regards, The MeetMind AI Team');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
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
