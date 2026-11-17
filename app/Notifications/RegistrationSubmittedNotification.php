<?php

namespace App\Notifications;

use App\Models\Registration;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RegistrationSubmittedNotification extends Notification
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
        $applicant = $this->registration->user;
        $reviewUrl = url("/organizer/events/{$event->id}/registrations");

        return (new MailMessage)
            ->subject("New Registration Request: {$applicant->name} — {$event->title}")
            ->greeting("Hello {$notifiable->name}!")
            ->line("A new attendee has submitted a registration application for **{$event->title}**.")
            ->line("**Applicant:** {$applicant->name} ({$applicant->email})")
            ->line('**Organization / Role:** '.($applicant->job_title ? "{$applicant->job_title} at " : '').($applicant->company ?: 'Independent'))
            ->line('**Application Date:** '.now()->format('F j, Y \a\t g:i A'))
            ->action('Review & Manage Applications', $reviewUrl)
            ->line('As the event organizer, you can review answers, approve, waitlist, or decline this application.')
            ->salutation('Best regards, The MeetMind AI Platform');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'registration_id' => $this->registration->id,
            'event_id' => $this->registration->event_id,
            'applicant_id' => $this->registration->user_id,
            'applicant_name' => $this->registration->user->name,
            'event_title' => $this->registration->event->title,
        ];
    }
}
