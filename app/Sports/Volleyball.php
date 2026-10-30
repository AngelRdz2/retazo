<?php

namespace App\Sports;

use App\Enums\Sport;

/**
 * Scores are sets won; the points of each set are kept in games.sets.
 */
class Volleyball extends SportDefinition
{
    public function sport(): Sport
    {
        return Sport::Volleyball;
    }

    public function label(): string
    {
        return 'Vóley';
    }

    public function usesSets(): bool
    {
        return true;
    }

    public function defaultSettings(): array
    {
        return [
            'best_of' => 3,
            'points' => ['win' => 3, 'win_close' => 2, 'loss_close' => 1, 'loss' => 0],
        ];
    }

    public function pointLabels(): array
    {
        return [
            'win' => 'Victoria sin llegar al set decisivo',
            'win_close' => 'Victoria en el set decisivo',
            'loss_close' => 'Derrota en el set decisivo',
            'loss' => 'Derrota sin llegar al set decisivo',
        ];
    }

    /**
     * @param  array<string, mixed>  $settings
     */
    public static function setsToWin(array $settings): int
    {
        return intdiv($settings['best_of'] ?? 3, 2) + 1;
    }

    public function standingsPoints(int $scored, int $conceded, array $settings): int
    {
        $points = $settings['points'];
        // A "close" game went to the deciding set, e.g. 3-2 (best of 5) or 2-1 (best of 3).
        $close = min($scored, $conceded) === self::setsToWin($settings) - 1;

        if ($scored > $conceded) {
            return $close ? $points['win_close'] : $points['win'];
        }

        return $close ? $points['loss_close'] : $points['loss'];
    }

    public function standingsColumns(): array
    {
        return [
            'played' => 'PJ',
            'won' => 'G',
            'lost' => 'P',
            'for' => 'Sets+',
            'against' => 'Sets−',
            'points' => 'Pts',
        ];
    }

    public function scoreUnit(): string
    {
        return 'sets';
    }
}
