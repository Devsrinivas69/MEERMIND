<?php

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

test('attendee cannot access organizer analytics dashboard', function () {
    $attendee = User::where('role', User::ROLE_ATTENDEE)->first();

    $this->actingAs($attendee)
        ->get(route('organizer.dashboard'))
        ->assertForbidden();
});

test('organizer can access dashboard with accurate aggregated metrics', function () {
    $organizer = User::where('role', User::ROLE_ORGANIZER)->first();

    $response = $this->actingAs($organizer)
        ->get(route('organizer.dashboard'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('organizer/dashboard')
            ->has('metrics')
            ->has('metrics.total_registrations')
            ->has('metrics.total_check_ins')
            ->has('metrics.overall_attendance_rate')
            ->has('eventPerformance')
            ->has('recentRegistrations')
            ->has('trends')
        );
});
