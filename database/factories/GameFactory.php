<?php

namespace Database\Factories;

use App\Enums\GameStage;
use App\Enums\GameStatus;
use App\Models\Game;
use App\Models\Tournament;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Game>
 */
class GameFactory extends Factory
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
            'stage' => GameStage::League,
            'round' => 1,
            'status' => GameStatus::Scheduled,
            'home_score' => 0,
            'away_score' => 0,
        ];
    }

    public function finished(int $homeScore, int $awayScore): static
    {
        return $this->state(fn () => [
            'status' => GameStatus::Finished,
            'home_score' => $homeScore,
            'away_score' => $awayScore,
            'finished_at' => now(),
        ]);
    }
}
