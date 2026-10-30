<?php

namespace App\Services\Scheduling;

use App\Enums\GameStage;
use App\Models\Game;
use App\Models\Tournament;

/**
 * Single-elimination bracket. When the number of teams is not a power of two,
 * the best seeds get a bye and go straight to the second round.
 */
class KnockoutBracketBuilder
{
    /**
     * Seed numbers in bracket order, e.g. 8 → [1, 8, 4, 5, 2, 7, 3, 6],
     * so the two best seeds can only meet in the final.
     *
     * @return list<int>
     */
    public static function seedOrder(int $size): array
    {
        $order = [1];

        for ($n = 2; $n <= $size; $n *= 2) {
            $order = array_merge(...array_map(fn (int $seed) => [$seed, $n + 1 - $seed], $order));
        }

        return $order;
    }

    /**
     * First-round pairs by bracket position; null means a bye.
     *
     * @param  list<int>  $seeds  Team ids, best seed first.
     * @return list<array{0: int|null, 1: int|null}>
     */
    public function firstRound(array $seeds): array
    {
        $size = 2 ** (int) ceil(log(max(count($seeds), 2), 2));
        $order = self::seedOrder($size);

        return array_map(
            fn (array $pair) => [$seeds[$pair[0] - 1] ?? null, $seeds[$pair[1] - 1] ?? null],
            array_chunk($order, 2),
        );
    }

    /**
     * Create every game of the bracket, linking each one to the game its winner plays next.
     * Bye teams are placed directly in their second-round game.
     *
     * @param  list<array{0: int|null, 1: int|null}>  $pairs  First round, as returned by firstRound().
     * @return list<list<Game>> Games per round (first round without byes).
     */
    public function build(Tournament $tournament, array $pairs): array
    {
        $size = count($pairs) * 2;
        $totalRounds = (int) log($size, 2);
        $games = [];

        // Build from the final backwards so every game already knows its next game.
        for ($round = $totalRounds; $round >= 1; $round--) {
            $games[$round] = [];

            for ($position = 0; $position < $size / 2 ** $round; $position++) {
                $next = $games[$round + 1][intdiv($position, 2)] ?? null;
                $slot = $position % 2 === 0 ? 'home' : 'away';
                [$home, $away] = $round === 1 ? $pairs[$position] : [null, null];

                if ($round === 1 && ($home === null || $away === null)) {
                    $next?->update(["{$slot}_team_id" => $home ?? $away]);

                    continue;
                }

                $games[$round][$position] = $tournament->games()->create([
                    'stage' => GameStage::Knockout,
                    'round' => $round,
                    'bracket_position' => $position,
                    'home_team_id' => $home,
                    'away_team_id' => $away,
                    'next_game_id' => $next?->id,
                    'next_slot' => $next ? $slot : null,
                ]);
            }
        }

        ksort($games);

        return array_values(array_map(fn (array $round) => array_values($round), $games));
    }
}
