<?php

namespace App\Support;

use App\Models\Game;

/**
 * Shape of a game in the public "Team VS Team" cards (home and matches page).
 */
class MatchCard
{
    /**
     * @return array<string, mixed>
     */
    public static function from(Game $game): array
    {
        return [
            ...$game->only(['id', 'status', 'venue', 'home_score', 'away_score', 'home_penalties', 'away_penalties', 'winner_team_id']),
            'scheduled_at' => $game->scheduled_at?->format('Y-m-d\TH:i'),
            'home_team' => $game->homeTeam?->only(['id', 'name', 'color', 'logo_url']),
            'away_team' => $game->awayTeam?->only(['id', 'name', 'color', 'logo_url']),
            'tournament' => $game->tournament->only(['name', 'slug', 'sport', 'sport_label']),
        ];
    }
}
