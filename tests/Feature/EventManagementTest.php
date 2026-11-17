<?php

use App\Models\Event;
use App\Models\EventCategory;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

test('public events catalog is accessible to guests and lists published events', function () {
    $response = $this->get(route('events.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('events/index')
            ->has('events.data')
            ->has('categories')
            ->has('filters')
        );
});

test('public event detail page is viewable by slug', function () {
    $event = Event::published()->first();

    $response = $this->get(route('events.show', $event->slug));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('events/show')
            ->where('event.id', $event->id)
            ->has('isRegistered')
        );
});

test('attendee cannot access organizer event management', function () {
    $attendee = User::where('role', User::ROLE_ATTENDEE)->first();

    $this->actingAs($attendee)
        ->get(route('organizer.events.index'))
        ->assertForbidden();

    $this->actingAs($attendee)
        ->get(route('organizer.events.create'))
        ->assertForbidden();
});

test('organizer can access event management and create an event', function () {
    $organizer = User::where('role', User::ROLE_ORGANIZER)->first();
    $category = EventCategory::first();

    $this->actingAs($organizer)
        ->get(route('organizer.events.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('organizer/events/index'));

    $eventData = [
        'title' => 'AI Architecture Hackathon 2026',
        'category_id' => $category->id,
        'summary' => 'A premier 24-hour sprint building reactive AI agents.',
        'description' => 'Hands on hack sprint building multi-agent systems with Laravel and React 19.',
        'event_type' => Event::TYPE_HYBRID,
        'venue_name' => 'Tech Dome',
        'venue_city' => 'Austin, TX',
        'starts_at' => now()->addDays(20)->toDateTimeString(),
        'ends_at' => now()->addDays(21)->toDateTimeString(),
        'capacity' => 150,
        'status' => Event::STATUS_PUBLISHED,
        'is_featured' => true,
    ];

    $response = $this->actingAs($organizer)
        ->post(route('organizer.events.store'), $eventData);

    $response->assertRedirect(route('organizer.events.index'));

    $this->assertDatabaseHas('events', [
        'title' => 'AI Architecture Hackathon 2026',
        'organizer_id' => $organizer->id,
        'slug' => 'ai-architecture-hackathon-2026',
    ]);
});

test('organizer cannot edit an event belonging to another organizer', function () {
    $event = Event::first();
    $otherOrganizer = User::where('role', User::ROLE_ORGANIZER)
        ->where('id', '!=', $event->organizer_id)
        ->first();

    $this->actingAs($otherOrganizer)
        ->get(route('organizer.events.edit', $event->id))
        ->assertForbidden();

    $this->actingAs($otherOrganizer)
        ->put(route('organizer.events.update', $event->id), [
            'title' => 'Hijacked Title',
            'description' => 'Malicious update',
            'event_type' => 'in-person',
            'starts_at' => now()->addDays(1)->toDateTimeString(),
            'ends_at' => now()->addDays(2)->toDateTimeString(),
            'capacity' => 50,
            'status' => 'published',
        ])
        ->assertForbidden();
});

test('organizer can toggle publication status of their event', function () {
    $event = Event::where('status', Event::STATUS_PUBLISHED)->first();
    $owner = $event->organizer;

    $this->actingAs($owner)
        ->from(route('organizer.events.index'))
        ->post(route('organizer.events.toggle-publish', $event->id))
        ->assertRedirect(route('organizer.events.index'));

    expect($event->fresh()->status)->toBe(Event::STATUS_DRAFT);

    $this->actingAs($owner)
        ->from(route('organizer.events.index'))
        ->post(route('organizer.events.toggle-publish', $event->id))
        ->assertRedirect(route('organizer.events.index'));

    expect($event->fresh()->status)->toBe(Event::STATUS_PUBLISHED);
});
