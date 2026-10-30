<?php

namespace App\Services\Scheduling;

/**
 * All-play-all pairings using the circle method.
 * With an odd number of teams one team rests (bye) in every round.
 */
class RoundRobinScheduler
{
    /**
     * @param  list<int>  $teamIds
     * @return list<list<array{0: int, 1: int}>> Rounds of [home, away] pairs.
     */
    public function rounds(array $teamIds, bool $doubleRound = false): array
    {
        $teams = $teamIds;

        if (count($teams) < 2) {
            return [];
        }

        if (count($teams) % 2 === 1) {
            $teams[] = null; // Whoever faces null rests that round.
        }

        $n = count($teams);
        $homeGames = array_fill_keys(array_filter($teams), 0);
        $rounds = [];

        for ($round = 0; $round < $n - 1; $round++) {
            $pairs = [];

            for ($i = 0; $i < $n / 2; $i++) {
                $a = $teams[$i];
                $b = $teams[$n - 1 - $i];

                if ($a === null || $b === null) {
                    continue;
                }

                // Give home advantage to whoever has played fewer home games.
                [$home, $away] = $homeGames[$a] <= $homeGames[$b] ? [$a, $b] : [$b, $a];
                $homeGames[$home]++;
                $pairs[] = [$home, $away];
            }

            $rounds[] = $pairs;

            // Keep the first team fixed and rotate the rest one position.
            $last = array_pop($teams);
            array_splice($teams, 1, 0, [$last]);
        }

        if ($doubleRound) {
            foreach (array_slice($rounds, 0) as $pairs) {
                $rounds[] = array_map(fn (array $pair) => [$pair[1], $pair[0]], $pairs);
            }
        }

        return $rounds;
    }
}
