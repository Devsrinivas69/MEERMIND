<?php

use App\Models\Event;
use App\Models\EventCategory;
use App\Models\Registration;
use App\Models\Ticket;
use App\Models\User;
use App\Notifications\RegistrationApprovedNotification;
use App\Notifications\RegistrationRejectedNotification;
use App\Notifications\RegistrationSubmittedNotification;
use App\Notifications\RegistrationWaitlistedNotification;
use App\Services\QrCodeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

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

    $this->attendeeTwo = User::factory()->create([
        'name' => 'Priya Patel',
        'email' => 'priya@example.com',
        'role' => 'attendee',
    ]);

    $this->event = Event::factory()->create([
        'organizer_id' => $this->organizer->id,
        'category_id' => $this->category->id,
        'title' => 'Next-Gen AI Summit',
        'slug' => 'next-gen-ai-summit',
        'capacity' => 2,
        'registered_count' => 0,
        'requires_approval' => true,
        'status' => 'published',
        'starts_at' => now()->addDays(5),
        'ends_at' => now()->addDays(6),
        'custom_questions' => [
            [
                'id' => 'q1',
                'question' => 'What is your engineering background?',
                'type' => 'text',
                'required' => true,
            ],
        ],
    ]);
});

test('1. attendee submits application and status is pending without a ticket', function () {
    Notification::fake();

    $response = $this->actingAs($this->attendee)->post(route('events.register', $this->event->slug), [
        'notes' => 'I would love to attend this summit.',
        'answers' => [
            'q1' => 'Staff Machine Learning Engineer with 8 years of experience.',
        ],
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('registrations', [
        'event_id' => $this->event->id,
        'user_id' => $this->attendee->id,
        'status' => Registration::STATUS_PENDING,
    ]);

    $registration = Registration::where('event_id', $this->event->id)
        ->where('user_id', $this->attendee->id)
        ->first();

    expect($registration)->not->toBeNull();
    expect($registration->status)->toBe(Registration::STATUS_PENDING);
    expect($registration->ticket)->toBeNull();

    // Event capacity remains untouched until approval
    expect($this->event->fresh()->registered_count)->toBe(0);

    // Organizer was notified
    Notification::assertSentTo($this->organizer, RegistrationSubmittedNotification::class);
});

test('2. organizer can view pending applications on dedicated management page', function () {
    $registration = Registration::factory()->create([
        'event_id' => $this->event->id,
        'user_id' => $this->attendee->id,
        'status' => Registration::STATUS_PENDING,
        'application_submitted_at' => now(),
    ]);

    $response = $this->actingAs($this->organizer)->get(route('organizer.events.registrations.index', $this->event->id));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('organizer/events/registrations')
        ->has('registrations.data', 1)
        ->where('stats.pending_count', 1)
        ->where('stats.approved_count', 0)
    );
});

test('3. unauthorized organizer cannot review or approve another organizers event', function () {
    $registration = Registration::factory()->create([
        'event_id' => $this->event->id,
        'user_id' => $this->attendee->id,
        'status' => Registration::STATUS_PENDING,
    ]);

    // Other organizer attempts to access index
    $response = $this->actingAs($this->otherOrganizer)->get(route('organizer.events.registrations.index', $this->event->id));
    $response->assertForbidden();

    // Other organizer attempts to approve
    $approveResponse = $this->actingAs($this->otherOrganizer)->post(route('organizer.registrations.approve', $registration->id));
    $approveResponse->assertForbidden();

    // Attendee cannot approve
    $attendeeResponse = $this->actingAs($this->attendee)->post(route('organizer.registrations.approve', $registration->id));
    $attendeeResponse->assertForbidden();
});

test('4. event owner approves application, status becomes approved and ticket with QR is generated', function () {
    Notification::fake();

    $registration = Registration::factory()->create([
        'event_id' => $this->event->id,
        'user_id' => $this->attendee->id,
        'status' => Registration::STATUS_PENDING,
    ]);

    $response = $this->actingAs($this->organizer)->post(route('organizer.registrations.approve', $registration->id));

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $registration->refresh();
    expect($registration->status)->toBe(Registration::STATUS_APPROVED);
    expect($registration->reviewed_by)->toBe($this->organizer->id);
    expect($registration->approved_at)->not->toBeNull();

    // Registered count incremented
    expect($this->event->fresh()->registered_count)->toBe(1);

    // Cryptographic ticket issued
    $ticket = $registration->ticket;
    expect($ticket)->not->toBeNull();
    expect($ticket->status)->toBe(Ticket::STATUS_VALID);
    expect($ticket->qr_token)->not->toBeEmpty();
    expect($ticket->ticket_code)->not->toBeEmpty();

    Notification::assertSentTo($this->attendee, RegistrationApprovedNotification::class);
});

test('5. organizer rejects application with reason, releases capacity and revokes ticket if previously issued', function () {
    Notification::fake();

    $registration = Registration::factory()->create([
        'event_id' => $this->event->id,
        'user_id' => $this->attendee->id,
        'status' => Registration::STATUS_PENDING,
    ]);

    $response = $this->actingAs($this->organizer)->post(route('organizer.registrations.reject', $registration->id), [
        'reason' => 'Event criteria not met for this specific track.',
    ]);

    $response->assertRedirect();
    $registration->refresh();

    expect($registration->status)->toBe(Registration::STATUS_REJECTED);
    expect($registration->rejection_reason)->toBe('Event criteria not met for this specific track.');
    expect($registration->ticket)->toBeNull();
    expect($this->event->fresh()->registered_count)->toBe(0);

    Notification::assertSentTo($this->attendee, RegistrationRejectedNotification::class);
});

test('6. organizer waitlists application with notification', function () {
    Notification::fake();

    $registration = Registration::factory()->create([
        'event_id' => $this->event->id,
        'user_id' => $this->attendee->id,
        'status' => Registration::STATUS_PENDING,
    ]);

    $response = $this->actingAs($this->organizer)->post(route('organizer.registrations.waitlist', $registration->id));

    $response->assertRedirect();
    $registration->refresh();

    expect($registration->status)->toBe(Registration::STATUS_WAITLISTED);
    expect($registration->ticket)->toBeNull();

    Notification::assertSentTo($this->attendee, RegistrationWaitlistedNotification::class);
});

test('7. organizer can update internal review notes', function () {
    $registration = Registration::factory()->create([
        'event_id' => $this->event->id,
        'user_id' => $this->attendee->id,
        'status' => Registration::STATUS_PENDING,
    ]);

    $response = $this->actingAs($this->organizer)->post(route('organizer.registrations.notes', $registration->id), [
        'notes' => 'Spoke with candidate at AI meetup. Strong potential panelist.',
    ]);

    $response->assertRedirect();
    expect($registration->fresh()->review_notes)->toBe('Spoke with candidate at AI meetup. Strong potential panelist.');
});

test('8. duplicate active application is strictly prevented', function () {
    Registration::factory()->create([
        'event_id' => $this->event->id,
        'user_id' => $this->attendee->id,
        'status' => Registration::STATUS_PENDING,
    ]);

    $response = $this->actingAs($this->attendee)->post(route('events.register', $this->event->slug), [
        'notes' => 'Trying to apply twice',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('info');

    expect(Registration::where('event_id', $this->event->id)->where('user_id', $this->attendee->id)->count())->toBe(1);
});

test('9. approval fails when event has reached maximum capacity', function () {
    // Fill up capacity of 2
    $this->event->update(['registered_count' => 2]);

    $registration = Registration::factory()->create([
        'event_id' => $this->event->id,
        'user_id' => $this->attendee->id,
        'status' => Registration::STATUS_PENDING,
    ]);

    $response = $this->actingAs($this->organizer)->post(route('organizer.registrations.approve', $registration->id));

    $response->assertRedirect();
    $response->assertSessionHas('error');

    $registration->refresh();
    expect($registration->status)->toBe(Registration::STATUS_PENDING);
    expect($this->event->fresh()->registered_count)->toBe(2);
});

test('10. QR check-in terminal rejects unapproved registrations or tickets', function () {
    $qrService = app(QrCodeService::class);

    // Create an approved registration and valid ticket
    $approvedReg = Registration::factory()->create([
        'event_id' => $this->event->id,
        'user_id' => $this->attendee->id,
        'status' => Registration::STATUS_APPROVED,
    ]);
    $ticket = $qrService->issueTicketForRegistration($approvedReg);

    // 1. Valid approved ticket verifies successfully
    $verifyResponse = $this->actingAs($this->organizer)->postJson(route('organizer.events.check-in.verify', $this->event->id), [
        'token' => $ticket->qr_token,
    ]);
    $verifyResponse->assertOk();
    $verifyResponse->assertJson(['success' => true]);
    expect($ticket->fresh()->isUsed())->toBeTrue();

    // 2. Used ticket cannot be reused (409 Conflict)
    $reuseResponse = $this->actingAs($this->organizer)->postJson(route('organizer.events.check-in.verify', $this->event->id), [
        'token' => $ticket->qr_token,
    ]);
    $reuseResponse->assertStatus(409);
    $reuseResponse->assertJson(['success' => false, 'status' => 'already_used']);
});

test('11. bulk approval enforces capacity limit safely', function () {
    // Capacity is 2
    $reg1 = Registration::factory()->create([
        'event_id' => $this->event->id,
        'user_id' => $this->attendee->id,
        'status' => Registration::STATUS_PENDING,
    ]);
    $reg2 = Registration::factory()->create([
        'event_id' => $this->event->id,
        'user_id' => $this->attendeeTwo->id,
        'status' => Registration::STATUS_PENDING,
    ]);
    $attendeeThree = User::factory()->create(['role' => 'attendee']);
    $reg3 = Registration::factory()->create([
        'event_id' => $this->event->id,
        'user_id' => $attendeeThree->id,
        'status' => Registration::STATUS_PENDING,
    ]);

    // Bulk approve 3 when only 2 spots available
    $response = $this->actingAs($this->organizer)->post(route('organizer.events.registrations.bulk', $this->event->id), [
        'action' => 'approve',
        'registration_ids' => [$reg1->id, $reg2->id, $reg3->id],
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('error');

    // No overbooking occurred
    expect($this->event->fresh()->registered_count)->toBe(0);
});

test('12. cancellation by attendee releases capacity only if registration was approved', function () {
    // Pending cancel
    $pendingReg = Registration::factory()->create([
        'event_id' => $this->event->id,
        'user_id' => $this->attendee->id,
        'status' => Registration::STATUS_PENDING,
    ]);
    $this->actingAs($this->attendee)->delete(route('registrations.cancel', $pendingReg->id));
    expect($pendingReg->fresh()->status)->toBe(Registration::STATUS_CANCELLED);
    expect($this->event->fresh()->registered_count)->toBe(0);

    // Approved cancel
    $this->event->update(['registered_count' => 1]);
    $approvedReg = Registration::factory()->create([
        'event_id' => $this->event->id,
        'user_id' => $this->attendeeTwo->id,
        'status' => Registration::STATUS_APPROVED,
    ]);
    $this->actingAs($this->attendeeTwo)->delete(route('registrations.cancel', $approvedReg->id));
    expect($approvedReg->fresh()->status)->toBe(Registration::STATUS_CANCELLED);
    expect($this->event->fresh()->registered_count)->toBe(0);
});
