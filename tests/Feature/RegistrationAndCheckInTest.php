<?php

use App\Models\CheckIn;
use App\Models\Event;
use App\Models\Registration;
use App\Models\Ticket;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

test('guest is redirected to login when trying to register', function () {
    $event = Event::published()->first();

    $response = $this->post(route('events.register', $event->slug));

    $response->assertRedirect(route('login'));
});

test('attendee can register for an event and receives a digital ticket', function () {
    $event = Event::published()->first();
    $newUser = User::factory()->create(['role' => User::ROLE_ATTENDEE]);
    $initialCount = $event->registered_count;

    $response = $this->actingAs($newUser)
        ->post(route('events.register', $event->slug));

    $registration = Registration::where('event_id', $event->id)
        ->where('user_id', $newUser->id)
        ->first();

    expect($registration)->not->toBeNull()
        ->and($registration->status)->toBe(Registration::STATUS_CONFIRMED)
        ->and($registration->ticket)->not->toBeNull()
        ->and($event->fresh()->registered_count)->toBe($initialCount + 1);

    $response->assertRedirect(route('attendee.tickets.show', $registration->ticket->ticket_code));
});

test('duplicate registration attempt does not create multiple tickets', function () {
    $event = Event::published()->first();
    $existingReg = Registration::where('event_id', $event->id)->first();
    $attendee = $existingReg->user;
    $initialCount = $event->registered_count;

    $response = $this->actingAs($attendee)
        ->from(route('events.show', $event->slug))
        ->post(route('events.register', $event->slug));

    $response->assertRedirect(route('events.show', $event->slug));
    expect(Registration::where('event_id', $event->id)->where('user_id', $attendee->id)->count())->toBe(1)
        ->and($event->fresh()->registered_count)->toBe($initialCount);
});

test('cannot register when event capacity is reached', function () {
    $event = Event::published()->first();
    $event->update([
        'capacity' => 10,
        'registered_count' => 10,
    ]);

    $newUser = User::factory()->create(['role' => User::ROLE_ATTENDEE]);

    $response = $this->actingAs($newUser)
        ->from(route('events.show', $event->slug))
        ->post(route('events.register', $event->slug));

    $response->assertRedirect(route('events.show', $event->slug));
    expect(Registration::where('event_id', $event->id)->where('user_id', $newUser->id)->exists())->toBeFalse();
});

test('attendee can cancel registration and capacity is released', function () {
    $event = Event::published()->first();
    $registration = Registration::where('event_id', $event->id)
        ->where('status', Registration::STATUS_CONFIRMED)
        ->first();
    $attendee = $registration->user;
    $initialCount = $event->registered_count;

    $response = $this->actingAs($attendee)
        ->from(route('attendee.tickets.index'))
        ->post(route('registrations.cancel', $registration->id));

    $response->assertRedirect(route('attendee.tickets.index'));
    expect($registration->fresh()->status)->toBe(Registration::STATUS_CANCELLED)
        ->and($registration->ticket->fresh()->status)->toBe(Ticket::STATUS_CANCELLED)
        ->and($event->fresh()->registered_count)->toBe($initialCount - 1);
});

test('attendee can view their ticket with SVG QR code', function () {
    $ticket = Ticket::where('status', Ticket::STATUS_VALID)->first();
    $attendee = $ticket->registration->user;

    $response = $this->actingAs($attendee)
        ->get(route('attendee.tickets.show', $ticket->ticket_code));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('attendee/tickets/show')
            ->where('ticket.id', $ticket->id)
            ->has('qrSvg')
        );
});

test('organizer can check in attendee using valid QR token', function () {
    $ticket = Ticket::where('status', Ticket::STATUS_VALID)->first();
    $event = $ticket->registration->event;
    $organizer = $event->organizer;

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

    expect($ticket->fresh()->status)->toBe(Ticket::STATUS_USED)
        ->and($ticket->fresh()->checked_in_at)->not->toBeNull()
        ->and(CheckIn::where('ticket_id', $ticket->id)->exists())->toBeTrue();
});

test('duplicate check-in attempt is rejected with 409 status', function () {
    // Ticket that is already used
    $usedTicket = Ticket::where('status', Ticket::STATUS_USED)->first();
    $event = $usedTicket->registration->event;
    $organizer = $event->organizer;

    $response = $this->actingAs($organizer)
        ->postJson(route('organizer.events.check-in.verify', $event->id), [
            'token' => $usedTicket->qr_token,
        ]);

    $response->assertStatus(409)
        ->assertJson([
            'success' => false,
            'status' => 'already_used',
        ]);
});

test('ticket from wrong event is rejected with 422 status', function () {
    $ticket = Ticket::first();
    $differentEvent = Event::where('id', '!=', $ticket->registration->event_id)->first();
    $organizer = $differentEvent->organizer;

    $response = $this->actingAs($organizer)
        ->postJson(route('organizer.events.check-in.verify', $differentEvent->id), [
            'token' => $ticket->qr_token,
        ]);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'status' => 'wrong_event',
        ]);
});

test('nonexistent ticket token returns 404', function () {
    $event = Event::first();
    $organizer = $event->organizer;

    $response = $this->actingAs($organizer)
        ->postJson(route('organizer.events.check-in.verify', $event->id), [
            'token' => 'invalid-nonexistent-token-123456',
        ]);

    $response->assertStatus(404)
        ->assertJson([
            'success' => false,
            'status' => 'not_found',
        ]);
});
