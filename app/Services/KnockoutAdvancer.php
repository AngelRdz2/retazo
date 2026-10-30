<?php

namespace App\Services;

use App\Enums\GameStatus;
use App\Models\Game;
use Illuminate\Validation\ValidationException;

/**
 * Moves the winner of a knockout game into its slot of the next round.
 */
class KnockoutAdvancer
{
    public function advance(Game $game): void
    {
        if ($game->next_game_id === null || $game->winner_team_id === null) {
            return;
        }

        Game::whereKey($game->next_game_id)->update([
            $this->slotColumn($game) => $game->winner_team_id,
        ]);
    }

    /**
     * Take the team back out of the next game, used when a finished game is reopened.
     */
    public function revert(Game $game): void
    {
        if (! $this->canRevert($game)) {
            throw ValidationException::withMessages([
                'game' => 'No se puede reabrir: el siguiente partido del cuadro ya empezó.',
            ]);
        }

        $game->nextGame?->update([$this->slotColumn($game) => null]);
    }

    public function canRevert(Game $game): bool
    {
        return $game->nextGame === null || $game->nextGame->status === GameStatus::Scheduled;
    }

    private function slotColumn(Game $game): string
    {
        return $game->next_slot === 'away' ? 'away_team_id' : 'home_team_id';
    }
}
