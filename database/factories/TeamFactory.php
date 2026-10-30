<?php

namespace Database\Factories;

use App\Enums\TeamStatus;
use App\Models\Team;
use App\Models\Tournament;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Team>
 */
class TeamFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tournament_id' => Tournament::factory(),
            'name' => fake()->unique()->lastName().' FC',
            'color' => fake()->hexColor(),
            'contact_name' => fake()->name(),
            'status' => TeamStatus::Approved,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => ['status' => TeamStatus::Pending]);
    }
}
