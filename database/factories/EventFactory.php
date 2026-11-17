<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    protected $model = Event::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->sentence(4);

        return [
            'organizer_id' => User::factory(),
            'category_id' => null,
            'title' => $title,
            'slug' => Str::slug($title).'-'.fake()->unique()->randomNumber(4),
            'summary' => fake()->paragraph(1),
            'description' => fake()->paragraphs(3, true),
            'cover_image' => null,
            'event_type' => fake()->randomElement([Event::TYPE_IN_PERSON, Event::TYPE_VIRTUAL, Event::TYPE_HYBRID]),
            'venue_name' => fake()->company().' Convention Center',
            'venue_address' => fake()->streetAddress(),
            'venue_city' => fake()->city(),
            'virtual_meeting_url' => null,
            'starts_at' => now()->addDays(rand(1, 30))->setTime(9, 0),
            'ends_at' => now()->addDays(rand(1, 30))->setTime(17, 0),
            'registration_deadline' => null,
            'capacity' => fake()->numberBetween(50, 500),
            'registered_count' => 0,
            'status' => Event::STATUS_PUBLISHED,
            'is_featured' => false,
            'ai_summary' => null,
            'ai_faqs' => [
                ['question' => 'Where is parking located?', 'answer' => 'Validated parking is provided in the adjacent garage.'],
            ],
        ];
    }
}
