<?php

namespace App\Support;

use App\Enums\GameStage;

class RoundLabel
{
    /**
     * "Jornada 3" for league and group games; "Final", "Semifinal"… for knockout rounds.
     */
    public static function for(GameStage $stage, int $round, int $knockoutRounds): string
    {
        if ($stage !== GameStage::Knockout) {
            return "Jornada {$round}";
        }

        return match ($knockoutRounds - $round) {
            0 => 'Final',
            1 => 'Semifinal',
            2 => 'Cuartos de final',
            3 => 'Octavos de final',
            default => "Ronda {$round}",
        };
    }
}
