<?php

namespace App\Notifications;

use App\Models\Registration;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RegistrationRejectedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Registration $registration,
        public ?string $reason = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $event = $this->registration->event;

        $mail = (new MailMessage)
            ->subject("Update Regarding Your Application for {$event->title}")
            ->greeting("Hello {$notifiable->name},")
            ->line("Thank you for your interest in attending **{$event->title}**.")
            ->line('After careful review, the event organizing team is unable to approve your application for this session at this time.');

        if (! empty($this->reason)) {
            $mail->line("**Organizer Note:** {$this->reason}");
        }

        return $mail
            ->line('Due to limited venue capacity and high volume, selections are competitive. We encourage you to explore other upcoming community events.')
            ->action('Explore Other Events', url('/events'))
            ->salutation('Best regards, The MeetMind AI Team');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'registration_id' => $this->registration->id,
            'event_id' => $this->registration->event_id,
            'event_title' => $this->registration->event->title,
            'reason' => $this->reason,
        ];
    }
}
