<?php

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('seeded demo accounts can authenticate with password "password"', function () {
    $this->seed(DatabaseSeeder::class);

    // 1. Organizer Sarah Lin
    $organizerResponse = $this->post(route('login.store'), [
        'email' => 'sarah@meetmind.ai',
        'password' => 'password',
    ]);
    $organizerResponse->assertRedirect(route('dashboard', absolute: false));
    $this->assertAuthenticated();

    // Logout
    $this->post(route('logout'));
    $this->assertGuest();

    // 2. Attendee Alex Rivera
    $attendeeResponse = $this->post(route('login.store'), [
        'email' => 'alex@example.com',
        'password' => 'password',
    ]);
    $attendeeResponse->assertRedirect(route('dashboard', absolute: false));
    $this->assertAuthenticated();

    // Logout
    $this->post(route('logout'));
    $this->assertGuest();

    // 3. Admin
    $adminResponse = $this->post(route('login.store'), [
        'email' => 'admin@meetmind.ai',
        'password' => 'password',
    ]);
    $adminResponse->assertRedirect(route('dashboard', absolute: false));
    $this->assertAuthenticated();
});

test('invalid password correctly fails authentication with error', function () {
    $this->seed(DatabaseSeeder::class);

    $response = $this->from(route('login'))->post(route('login.store'), [
        'email' => 'sarah@meetmind.ai',
        'password' => 'wrong-password',
    ]);

    $response->assertRedirect(route('login'));
    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});
