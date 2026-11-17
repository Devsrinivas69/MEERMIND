<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Registration>
 */
class RegistrationFactory extends Factory
{
    protected $model = Registration::class;

    public function definition(): array
    {
        return [
            'event_id' => Event::factory(),
            'user_id' => User::factory(),
            'status' => Registration::STATUS_PENDING,
            'notes' => fake()->sentence(),
            'answers' => [
                'background' => 'Senior Software Engineer',
            ],
            'application_submitted_at' => now(),
            'reviewed_at' => null,
            'reviewed_by' => null,
            'rejection_reason' => null,
            'review_notes' => null,
            'approved_at' => null,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Registration::STATUS_APPROVED,
            'approved_at' => now(),
            'reviewed_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Registration::STATUS_REJECTED,
            'reviewed_at' => now(),
            'rejection_reason' => 'Venue capacity reached.',
        ]);
    }

    public function waitlisted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Registration::STATUS_WAITLISTED,
            'reviewed_at' => now(),
        ]);
    }
}
