<?php

namespace Database\Factories;

use App\Models\EventCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<EventCategory>
 */
class EventCategoryFactory extends Factory
{
    protected $model = EventCategory::class;

    public function definition(): array
    {
        $name = fake()->unique()->word();

        return [
            'name' => ucfirst($name),
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'icon' => 'sparkles',
            'color' => 'amber',
        ];
    }
}
