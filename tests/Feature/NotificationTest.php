<?php

use App\Models\Event;
use App\Models\Registration;
use App\Models\Ticket;
use App\Models\User;
use App\Notifications\CheckInConfirmedNotification;
use App\Notifications\TicketIssuedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

test('ticket issued notification is sent to attendee upon successful registration', function () {
    Notification::fake();

    $organizer = User::factory()->create(['role' => User::ROLE_ORGANIZER]);
    $attendee = User::factory()->create(['role' => User::ROLE_ATTENDEE]);

    $event = Event::factory()->create([
        'organizer_id' => $organizer->id,
        'title' => 'Autonomous Agents Summit',
        'status' => Event::STATUS_PUBLISHED,
        'capacity' => 100,
        'registered_count' => 0,
    ]);

    $response = $this->actingAs($attendee)
        ->post("/events/{$event->slug}/register");

    $response->assertRedirect();

    Notification::assertSentTo(
        $attendee,
        TicketIssuedNotification::class,
        function ($notification) use ($event) {
            $mail = $notification->toMail(User::factory()->make());
            expect($mail->subject)->toContain('Your Ticket for Autonomous Agents Summit')
                ->and($mail->introLines[0])->toContain('Autonomous Agents Summit');

            return $notification->ticket->registration->event_id === $event->id;
        }
    );
});

test('check in confirmed notification is sent to attendee when ticket is scanned', function () {
    Notification::fake();

    $organizer = User::factory()->create(['role' => User::ROLE_ORGANIZER]);
    $attendee = User::factory()->create(['role' => User::ROLE_ATTENDEE]);

    $event = Event::factory()->create([
        'organizer_id' => $organizer->id,
        'title' => 'Web3 & AI Nexus',
        'status' => Event::STATUS_PUBLISHED,
        'capacity' => 100,
    ]);

    $registration = Registration::create([
        'event_id' => $event->id,
        'user_id' => $attendee->id,
        'status' => Registration::STATUS_CONFIRMED,
    ]);

    $ticket = Ticket::create([
        'registration_id' => $registration->id,
        'ticket_code' => 'NEXUS-7788',
        'qr_token' => 'dummy-valid-token-7788',
        'status' => Ticket::STATUS_VALID,
    ]);

    $response = $this->actingAs($organizer)
        ->postJson(route('organizer.events.check-in.verify', $event->id), [
            'token' => $ticket->qr_token,
            'method' => 'qr_scan',
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'status' => 'checked_in',
        ]);

    Notification::assertSentTo(
        $attendee,
        CheckInConfirmedNotification::class,
        function ($notification) {
            $mail = $notification->toMail(User::factory()->make());
            expect($mail->subject)->toContain('Check-In Confirmed')
                ->and($mail->introLines[0])->toContain('Web3 & AI Nexus');

            return $notification->ticket->ticket_code === 'NEXUS-7788';
        }
    );
});
