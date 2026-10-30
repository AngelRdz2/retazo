<?php

namespace App\Sports;

use App\Enums\Sport;

/**
 * No draws: a tie goes to overtime and points keep adding to the same score.
 */
class Basketball extends SportDefinition
{
    public function sport(): Sport
    {
        return Sport::Basketball;
    }

    public function label(): string
    {
        return 'Básquet';
    }

    public function defaultSettings(): array
    {
        return [
            'points' => ['win' => 2, 'loss' => 1],
        ];
    }

    public function pointLabels(): array
    {
        return [
            'win' => 'Victoria',
            'loss' => 'Derrota',
        ];
    }

    public function scoreIncrements(): array
    {
        return [1, 2, 3];
    }

    public function standingsPoints(int $scored, int $conceded, array $settings): int
    {
        return $scored > $conceded ? $settings['points']['win'] : $settings['points']['loss'];
    }

    public function standingsColumns(): array
    {
        return [
            'played' => 'PJ',
            'won' => 'G',
            'lost' => 'P',
            'for' => 'PF',
            'against' => 'PC',
            'difference' => 'DP',
            'points' => 'Pts',
        ];
    }

    public function scoreUnit(): string
    {
        return 'puntos';
    }
}
