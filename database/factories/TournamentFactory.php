<?php

namespace Database\Factories;

use App\Enums\Sport;
use App\Enums\Tiebreaker;
use App\Enums\TournamentFormat;
use App\Enums\TournamentStatus;
use App\Models\Tournament;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Tournament>
 */
class TournamentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = 'Torneo '.fake()->unique()->city();

        return [
            'user_id' => User::factory(),
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(4)),
            'sport' => Sport::Football,
            'variant' => 'f7',
            'description' => fake()->sentence(),
            'start_date' => now()->addWeek()->toDateString(),
            'location' => fake()->city(),
            'format' => TournamentFormat::League,
            'status' => TournamentStatus::Draft,
            'double_round' => false,
            'public_registration' => false,
            'max_teams' => null,
            'settings' => Sport::Football->definition()->defaultSettings(),
            'tiebreakers' => Tiebreaker::defaultOrder(),
        ];
    }

    public function sport(Sport $sport): static
    {
        return $this->state(fn () => [
            'sport' => $sport,
            'variant' => $sport === Sport::Football ? 'f7' : null,
            'settings' => $sport->definition()->defaultSettings(),
        ]);
    }

    public function format(TournamentFormat $format): static
    {
        return $this->state(fn () => ['format' => $format]);
    }

    public function status(TournamentStatus $status): static
    {
        return $this->state(fn () => ['status' => $status]);
    }
}
