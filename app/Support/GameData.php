<?php

namespace App\Support;

use App\Models\Game;
use App\Models\Team;

/**
 * Shape of a game sent to the pages.
 */
class GameData
{
    /**
     * @return array<string, mixed>
     */
    public static function from(Game $game, int $knockoutRounds): array
    {
        return [
            ...$game->only([
                'id', 'stage', 'group_id', 'round', 'bracket_position', 'venue', 'status',
                'home_score', 'away_score', 'sets', 'home_penalties', 'away_penalties', 'winner_team_id',
                'home_team_id', 'away_team_id', 'next_game_id', 'next_slot',
            ]),
            'scheduled_at' => $game->scheduled_at?->format('Y-m-d\TH:i'),
            'status_label' => $game->status->label(),
            'round_label' => RoundLabel::for($game->stage, $game->round, $knockoutRounds),
            'group_name' => $game->group?->name,
            'home_team' => self::team($game->homeTeam),
            'away_team' => self::team($game->awayTeam),
        ];
    }

    /**
     * @return array{id: int, name: string, color: string|null, logo_url: string|null}|null
     */
    private static function team(?Team $team): ?array
    {
        return $team ? ['id' => $team->id, 'name' => $team->name, 'color' => $team->color, 'logo_url' => $team->logo_url] : null;
    }
}
