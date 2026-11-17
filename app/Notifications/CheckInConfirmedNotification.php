<?php

namespace App\Notifications;

use App\Models\CheckIn;
use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CheckInConfirmedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Ticket $ticket,
        public CheckIn $checkIn,
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
        $checkedInTime = $this->checkIn->checked_in_at->format('g:i A, F j, Y');

        return (new MailMessage)
            ->subject("Welcome to {$event->title}! Check-In Confirmed")
            ->greeting("Welcome {$notifiable->name}!")
            ->line("Your entrance check-in for **{$event->title}** was successfully validated at {$checkedInTime}.")
            ->line("**Ticket Code:** `{$this->ticket->ticket_code}`")
            ->line('Enjoy the sessions, network with fellow attendees, and remember to share your feedback following the presentations!')
            ->salutation('Warm regards, The MeetMind AI Team');
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
            'check_in_id' => $this->checkIn->id,
            'event_id' => $this->ticket->registration->event_id,
            'checked_in_at' => $this->checkIn->checked_in_at->toIso8601String(),
        ];
    }
}
