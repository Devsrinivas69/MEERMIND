<?php

use App\Models\CheckIn;
use App\Models\Event;
use App\Models\EventCategory;
use App\Models\Registration;
use App\Models\Ticket;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

test('user model has role checks', function () {
    $admin = User::where('role', User::ROLE_ADMIN)->first();
    $organizer = User::where('role', User::ROLE_ORGANIZER)->first();
    $attendee = User::where('role', User::ROLE_ATTENDEE)->first();

    expect($admin->isAdmin())->toBeTrue()
        ->and($admin->isOrganizer())->toBeTrue()
        ->and($organizer->isOrganizer())->toBeTrue()
        ->and($organizer->isAdmin())->toBeFalse()
        ->and($attendee->isAttendee())->toBeTrue()
        ->and($attendee->isOrganizer())->toBeFalse();
});

test('event relationships work correctly', function () {
    $event = Event::with(['organizer', 'category', 'registrations.ticket'])->first();

    expect($event)->not->toBeNull()
        ->and($event->organizer)->toBeInstanceOf(User::class)
        ->and($event->category)->toBeInstanceOf(EventCategory::class)
        ->and($event->registrations)->not->toBeEmpty();
});

test('prevent duplicate active registration for same user and event', function () {
    $event = Event::first();
    $user = User::where('role', User::ROLE_ATTENDEE)->first();

    // The user already has a registration from the seeder, attempting another should fail unique constraint
    expect(fn () => Registration::create([
        'event_id' => $event->id,
        'user_id' => $user->id,
        'status' => Registration::STATUS_CONFIRMED,
    ]))->toThrow(QueryException::class);
});

test('ticket check-in lifecycle validates and prevents duplicate check-in', function () {
    $ticket = Ticket::where('status', Ticket::STATUS_VALID)->first();
    expect($ticket->canCheckIn())->toBeTrue();

    // Check in the ticket
    $organizer = User::where('role', User::ROLE_ORGANIZER)->first();
    $checkIn = CheckIn::create([
        'ticket_id' => $ticket->id,
        'event_id' => $ticket->registration->event_id,
        'checked_in_by' => $organizer->id,
        'checked_in_at' => now(),
        'method' => CheckIn::METHOD_QR_SCAN,
    ]);

    $ticket->update([
        'status' => Ticket::STATUS_USED,
        'checked_in_at' => now(),
    ]);

    expect($ticket->fresh()->canCheckIn())->toBeFalse();

    // Attempting a second check-in for the same ticket should fail due to unique constraint on ticket_id
    expect(fn () => CheckIn::create([
        'ticket_id' => $ticket->id,
        'event_id' => $ticket->registration->event_id,
        'checked_in_by' => $organizer->id,
        'checked_in_at' => now(),
        'method' => CheckIn::METHOD_MANUAL_CODE,
    ]))->toThrow(QueryException::class);
});
