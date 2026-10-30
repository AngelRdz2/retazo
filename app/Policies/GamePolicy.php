<?php

namespace App\Policies;

use App\Models\Game;
use App\Models\User;

class GamePolicy
{
    /**
     * Organizer and scorers of the tournament score its games.
     */
    public function score(User $user, Game $game): bool
    {
        return $user->can('score', $game->tournament);
    }
}
