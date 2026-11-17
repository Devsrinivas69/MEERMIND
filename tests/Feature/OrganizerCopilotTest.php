<?php

use App\Models\Event;
use App\Models\EventCategory;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->category = EventCategory::factory()->create(['name' => 'Technology', 'slug' => 'technology']);

    $this->organizer = User::factory()->create([
        'name' => 'Sarah Lin',
        'email' => 'sarah@meetmind.ai',
        'role' => 'organizer',
    ]);

    $this->otherOrganizer = User::factory()->create([
        'name' => 'Marcus Vance',
        'email' => 'marcus@cloudfoundry.dev',
        'role' => 'organizer',
    ]);

    $this->attendee = User::factory()->create([
        'name' => 'Alex Rivera',
        'email' => 'alex@example.com',
        'role' => 'attendee',
    ]);

    $this->event = Event::factory()->create([
        'organizer_id' => $this->organizer->id,
        'category_id' => $this->category->id,
        'title' => 'Autonomous Systems Summit',
        'slug' => 'autonomous-systems-summit',
        'capacity' => 50,
        'registered_count' => 10,
        'status' => 'published',
        'starts_at' => now()->addDays(3),
        'ends_at' => now()->addDays(4),
    ]);
});

test('organizer copilot responds to pending applicant query with grounded live data and action suggestion', function () {
    $reg = Registration::factory()->create([
        'event_id' => $this->event->id,
        'user_id' => $this->attendee->id,
        'status' => Registration::STATUS_PENDING,
        'answers' => ['role' => 'Senior Machine Learning Architect'],
    ]);

    $response = $this->actingAs($this->organizer)->postJson(route('organizer.events.copilot.query', $this->event->id), [
        'message' => 'Show me all pending applications and summarize them',
    ]);

    $response->assertOk();
    $response->assertJsonStructure([
        'success',
        'event_id',
        'reply',
        'actions',
        'metrics',
    ]);

    $data = $response->json();
    expect($data['reply'])->toContain('Alex Rivera');
    expect($data['reply'])->toContain('Senior Machine Learning Architect');
    expect($data['actions'])->toHaveCount(1);
    expect($data['actions'][0]['type'])->toBe('approve_registration');
    expect($data['actions'][0]['id'])->toBe($reg->id);
    expect($data['metrics']['remaining_capacity'])->toBe(40);
});

test('organizer copilot reports live capacity status without hallucination', function () {
    $response = $this->actingAs($this->organizer)->postJson(route('organizer.events.copilot.query', $this->event->id), [
        'message' => 'How many seats are remaining?',
    ]);

    $response->assertOk();
    $data = $response->json();
    expect($data['reply'])->toContain('50 seats');
    expect($data['reply'])->toContain('40 spots left');
});

test('unauthorized user cannot query copilot for an event they do not own', function () {
    $response = $this->actingAs($this->otherOrganizer)->postJson(route('organizer.events.copilot.query', $this->event->id), [
        'message' => 'Tell me secrets',
    ]);

    $response->assertForbidden();
});
