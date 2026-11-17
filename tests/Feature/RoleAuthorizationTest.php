<?php

use App\Models\Event;
use App\Models\Ticket;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

test('event creation policy requires organizer or admin role', function () {
    $attendee = User::where('role', User::ROLE_ATTENDEE)->first();
    $organizer = User::where('role', User::ROLE_ORGANIZER)->first();
    $admin = User::where('role', User::ROLE_ADMIN)->first();

    expect(Gate::forUser($attendee)->allows('create', Event::class))->toBeFalse()
        ->and(Gate::forUser($organizer)->allows('create', Event::class))->toBeTrue()
        ->and(Gate::forUser($admin)->allows('create', Event::class))->toBeTrue();
});

test('event update policy only allows owning organizer or admin', function () {
    $event = Event::first();
    $owner = $event->organizer;
    $otherOrganizer = User::where('role', User::ROLE_ORGANIZER)->where('id', '!=', $owner->id)->first();
    $admin = User::where('role', User::ROLE_ADMIN)->first();
    $attendee = User::where('role', User::ROLE_ATTENDEE)->first();

    expect(Gate::forUser($owner)->allows('update', $event))->toBeTrue()
        ->and(Gate::forUser($admin)->allows('update', $event))->toBeTrue()
        ->and(Gate::forUser($otherOrganizer)->allows('update', $event))->toBeFalse()
        ->and(Gate::forUser($attendee)->allows('update', $event))->toBeFalse();
});

test('ticket view policy allows attendee owner and organizer but blocks other attendees', function () {
    $ticket = Ticket::first();
    $owner = $ticket->registration->user;
    $eventOrganizer = $ticket->registration->event->organizer;
    $otherAttendee = User::where('role', User::ROLE_ATTENDEE)->where('id', '!=', $owner->id)->first();

    expect(Gate::forUser($owner)->allows('view', $ticket))->toBeTrue()
        ->and(Gate::forUser($eventOrganizer)->allows('view', $ticket))->toBeTrue()
        ->and(Gate::forUser($otherAttendee)->allows('view', $ticket))->toBeFalse();
});
