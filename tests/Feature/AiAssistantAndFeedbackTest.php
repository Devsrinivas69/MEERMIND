<?php

use App\Models\AiEventInsight;
use App\Models\Event;
use App\Models\Feedback;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('public attendees can ask grounded questions to the ai event assistant', function () {
    $organizer = User::factory()->create(['role' => User::ROLE_ORGANIZER]);

    $event = Event::create([
        'organizer_id' => $organizer->id,
        'title' => 'Global AI Summit 2026',
        'slug' => 'global-ai-summit-2026',
        'summary' => 'The premier worldwide conference on autonomous agents and LLMs.',
        'description' => 'Comprehensive deep-dive event with world leaders in artificial intelligence.',
        'event_type' => 'in-person',
        'venue_name' => 'Moscone Center West',
        'venue_address' => '800 Howard St',
        'venue_city' => 'San Francisco',
        'starts_at' => now()->addDays(7)->setTime(9, 0),
        'ends_at' => now()->addDays(7)->setTime(18, 0),
        'capacity' => 500,
        'registered_count' => 120,
        'status' => Event::STATUS_PUBLISHED,
        'ai_faqs' => [
            ['question' => 'Where can attendees park?', 'answer' => 'Validated attendee parking is available at the 5th & Mission garage.'],
        ],
    ]);

    // Question matching FAQ
    $response = $this->postJson("/events/{$event->slug}/ask", [
        'message' => 'Where can attendees park for the event?',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
        ]);

    expect($response->json('reply'))->toContain('Validated attendee parking');

    // General schedule question
    $scheduleResponse = $this->postJson("/events/{$event->slug}/ask", [
        'message' => 'What time does the summit start?',
    ]);

    $scheduleResponse->assertOk()
        ->assertJson(['success' => true]);

    expect($scheduleResponse->json('reply'))->toContain('starts on');
});

test('ai assistant validates question input', function () {
    $organizer = User::factory()->create(['role' => User::ROLE_ORGANIZER]);
    $event = Event::factory()->create([
        'organizer_id' => $organizer->id,
        'status' => Event::STATUS_PUBLISHED,
    ]);

    $response = $this->postJson("/events/{$event->slug}/ask", [
        'message' => '',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['message']);
});

test('confirmed attendee can submit verified event feedback', function () {
    $organizer = User::factory()->create(['role' => User::ROLE_ORGANIZER]);
    $attendee = User::factory()->create(['role' => User::ROLE_ATTENDEE]);

    $event = Event::factory()->create([
        'organizer_id' => $organizer->id,
        'status' => Event::STATUS_PUBLISHED,
    ]);

    // Create confirmed registration
    Registration::create([
        'event_id' => $event->id,
        'user_id' => $attendee->id,
        'status' => Registration::STATUS_CONFIRMED,
    ]);

    $response = $this->actingAs($attendee)
        ->post("/events/{$event->id}/feedback", [
            'rating' => 5,
            'review_text' => 'The technical sessions on autonomous agents were groundbreaking. Highly recommend!',
        ]);

    $response->assertSessionHas('success');

    $this->assertDatabaseHas('feedbacks', [
        'event_id' => $event->id,
        'user_id' => $attendee->id,
        'rating' => 5,
        'sentiment' => 'positive',
    ]);

    // Verify AI insight was generated
    $this->assertDatabaseHas('ai_event_insights', [
        'event_id' => $event->id,
        'insight_type' => AiEventInsight::TYPE_FEEDBACK_SUMMARY,
    ]);
});

test('non-registered user cannot submit event feedback', function () {
    $organizer = User::factory()->create(['role' => User::ROLE_ORGANIZER]);
    $stranger = User::factory()->create(['role' => User::ROLE_ATTENDEE]);

    $event = Event::factory()->create([
        'organizer_id' => $organizer->id,
        'status' => Event::STATUS_PUBLISHED,
    ]);

    $response = $this->actingAs($stranger)
        ->post("/events/{$event->id}/feedback", [
            'rating' => 4,
            'review_text' => 'Trying to submit without attending.',
        ]);

    $response->assertSessionHas('error');
    $this->assertDatabaseMissing('feedbacks', [
        'event_id' => $event->id,
        'user_id' => $stranger->id,
    ]);
});

test('attendee cannot submit duplicate feedback for the same event', function () {
    $organizer = User::factory()->create(['role' => User::ROLE_ORGANIZER]);
    $attendee = User::factory()->create(['role' => User::ROLE_ATTENDEE]);

    $event = Event::factory()->create([
        'organizer_id' => $organizer->id,
        'status' => Event::STATUS_PUBLISHED,
    ]);

    Registration::create([
        'event_id' => $event->id,
        'user_id' => $attendee->id,
        'status' => Registration::STATUS_CONFIRMED,
    ]);

    Feedback::create([
        'event_id' => $event->id,
        'user_id' => $attendee->id,
        'rating' => 5,
        'review_text' => 'First review submitted.',
        'sentiment' => 'positive',
    ]);

    $response = $this->actingAs($attendee)
        ->post("/events/{$event->id}/feedback", [
            'rating' => 4,
            'review_text' => 'Attempting a second review.',
        ]);

    $response->assertSessionHas('info');
    expect(Feedback::where('event_id', $event->id)->where('user_id', $attendee->id)->count())->toBe(1);
});

test('organizer can view ai feedback intelligence report for their event', function () {
    $organizer = User::factory()->create(['role' => User::ROLE_ORGANIZER]);
    $event = Event::factory()->create([
        'organizer_id' => $organizer->id,
        'status' => Event::STATUS_PUBLISHED,
    ]);

    $response = $this->actingAs($organizer)
        ->get("/organizer/events/{$event->id}/feedback");

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('organizer/events/feedback')
            ->has('event')
            ->has('feedbacks')
        );
});

test('unauthorized user cannot view organizer feedback report', function () {
    $organizer1 = User::factory()->create(['role' => User::ROLE_ORGANIZER]);
    $organizer2 = User::factory()->create(['role' => User::ROLE_ORGANIZER]);
    $attendee = User::factory()->create(['role' => User::ROLE_ATTENDEE]);

    $event = Event::factory()->create([
        'organizer_id' => $organizer1->id,
        'status' => Event::STATUS_PUBLISHED,
    ]);

    // Another organizer is forbidden
    $this->actingAs($organizer2)
        ->get("/organizer/events/{$event->id}/feedback")
        ->assertForbidden();

    // Attendee is redirected by role middleware
    $this->actingAs($attendee)
        ->get("/organizer/events/{$event->id}/feedback")
        ->assertForbidden();
});
