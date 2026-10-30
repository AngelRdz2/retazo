<?php

namespace App\Sports;

use App\Enums\Sport;

class Football extends SportDefinition
{
    public function sport(): Sport
    {
        return Sport::Football;
    }

    public function label(): string
    {
        return 'Fútbol';
    }

    public function variants(): array
    {
        return [
            'f11' => 'Fútbol 11',
            'f7' => 'Fútbol 7',
            'f5' => 'Fútbol 5',
        ];
    }

    public function allowsDraw(): bool
    {
        return true;
    }

    public function decidesKnockoutTiesByPenalties(): bool
    {
        return true;
    }

    public function defaultSettings(): array
    {
        return [
            'points' => ['win' => 3, 'draw' => 1, 'loss' => 0],
        ];
    }

    public function pointLabels(): array
    {
        return [
            'win' => 'Victoria',
            'draw' => 'Empate',
            'loss' => 'Derrota',
        ];
    }

    public function standingsPoints(int $scored, int $conceded, array $settings): int
    {
        $points = $settings['points'];

        return match ($scored <=> $conceded) {
            1 => $points['win'],
            0 => $points['draw'],
            -1 => $points['loss'],
        };
    }

    public function standingsColumns(): array
    {
        return [
            'played' => 'PJ',
            'won' => 'G',
            'drawn' => 'E',
            'lost' => 'P',
            'for' => 'GF',
            'against' => 'GC',
            'difference' => 'DG',
            'points' => 'Pts',
        ];
    }

    public function scoreUnit(): string
    {
        return 'goles';
    }
}
