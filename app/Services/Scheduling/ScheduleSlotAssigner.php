<?php

namespace App\Services\Scheduling;

use Carbon\CarbonImmutable;

/**
 * Gives each game a start time and a court.
 *
 * - A team never plays two games in the same time slot.
 * - When several rounds are played on the same day, teams that just played
 *   are left to rest for a slot whenever another game can be played instead.
 */
class ScheduleSlotAssigner
{
    /**
     * @param  list<list<array{id: int|string, teams: list<int|null>}>>  $rounds  Games grouped by round, in play order.
     * @param  bool  $strictRounds  Every game of a round ends before the next round starts (knockout).
     * @return array<int|string, array{at: CarbonImmutable, court: int}>
     */
    public function assign(array $rounds, ScheduleOptions $options, bool $strictRounds = false): array
    {
        $result = [];

        if ($options->daysBetweenRounds > 0) {
            // One round per match day.
            foreach ($rounds as $index => $games) {
                $start = $options->startsAt->addDays($index * $options->daysBetweenRounds);
                $this->fill([$games], $start, $options, true, $result);
            }

            return $result;
        }

        $this->fill($rounds, $options->startsAt, $options, $strictRounds, $result);

        return $result;
    }

    /**
     * @param  list<list<array{id: int|string, teams: list<int|null>}>>  $rounds
     * @param  array<int|string, array{at: CarbonImmutable, court: int}>  $result
     */
    private function fill(array $rounds, CarbonImmutable $start, ScheduleOptions $options, bool $strictRounds, array &$result): void
    {
        $pending = [];
        foreach ($rounds as $round => $games) {
            foreach ($games as $game) {
                $pending[] = ['round' => $round, 'id' => $game['id'], 'teams' => array_values(array_filter($game['teams']))];
            }
        }

        $slot = 0;
        $justPlayed = [];

        while ($pending !== []) {
            // Stay close to the round order: at most one round ahead (none for knockout).
            $firstRound = min(array_column($pending, 'round'));
            $lastRound = $strictRounds ? $firstRound : $firstRound + 1;
            $candidates = array_filter($pending, fn (array $game) => $game['round'] <= $lastRound);

            $chosen = [];
            $busy = [];

            foreach ([true, false] as $onlyRested) {
                // Back-to-back games only when nothing else can be played in this slot.
                if (! $onlyRested && $chosen !== []) {
                    break;
                }

                foreach ($candidates as $key => $game) {
                    if (count($chosen) >= $options->courts) {
                        break;
                    }
                    if (isset($chosen[$key]) || array_intersect($game['teams'], $busy)) {
                        continue;
                    }
                    if ($onlyRested && array_intersect($game['teams'], $justPlayed)) {
                        continue;
                    }

                    $chosen[$key] = $game;
                    $busy = [...$busy, ...$game['teams']];
                }
            }

            $court = 0;
            foreach ($chosen as $key => $game) {
                $result[$game['id']] = ['at' => $start->addMinutes($slot * $options->gameMinutes), 'court' => $court++];
                unset($pending[$key]);
            }

            $justPlayed = $busy;
            $slot++;
        }
    }
}
