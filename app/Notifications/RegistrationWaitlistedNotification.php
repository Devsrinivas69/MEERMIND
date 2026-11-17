<?php

namespace App\Notifications;

use App\Models\Registration;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RegistrationWaitlistedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Registration $registration,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $event = $this->registration->event;

        return (new MailMessage)
            ->subject("You're on the Waitlist for {$event->title} — MeetMind AI")
            ->greeting("Hello {$notifiable->name}!")
            ->line("You have been placed on the official **Waitlist** for **{$event->title}**.")
            ->line('The event has currently reached capacity or is under tiered review. If seats become available or additional capacity is released, waitlisted applicants will be notified and promoted immediately.')
            ->action('View Application Status', url('/attendee/tickets'))
            ->line('No further action is required from you at this time.')
            ->salutation('Warm regards, The MeetMind AI Team');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'registration_id' => $this->registration->id,
            'event_id' => $this->registration->event_id,
            'event_title' => $this->registration->event->title,
        ];
    }
}
