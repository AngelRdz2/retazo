<?php

namespace App\Policies;

use App\Models\Tournament;
use App\Models\User;

class TournamentPolicy
{
    /**
     * Open the private tournament page (organizer and scorers).
     */
    public function view(User $user, Tournament $tournament): bool
    {
        return $tournament->isOrganizer($user) || $tournament->isScorer($user);
    }

    /**
     * Edit settings, teams, rules and scorers: organizer only.
     */
    public function update(User $user, Tournament $tournament): bool
    {
        return $tournament->isOrganizer($user);
    }

    public function delete(User $user, Tournament $tournament): bool
    {
        return $tournament->isOrganizer($user);
    }

    /**
     * Start, score and finish games.
     */
    public function score(User $user, Tournament $tournament): bool
    {
        return $tournament->isOrganizer($user) || $tournament->isScorer($user);
    }
}
