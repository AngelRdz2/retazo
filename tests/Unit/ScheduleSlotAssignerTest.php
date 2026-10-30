<?php

use App\Services\Scheduling\RoundRobinScheduler;
use App\Services\Scheduling\ScheduleOptions;
use App\Services\Scheduling\ScheduleSlotAssigner;
use Carbon\CarbonImmutable;

/**
 * @return list<list<array{id: string, teams: list<int>}>>
 */
function roundRobinInput(int $teams): array
{
    $rounds = (new RoundRobinScheduler)->rounds(range(1, $teams));

    return array_map(fn (array $pairs, int $r) => array_map(
        fn (array $pair, int $i) => ['id' => "{$r}-{$i}", 'teams' => $pair],
        $pairs,
        array_keys($pairs),
    ), $rounds, array_keys($rounds));
}

/**
 * @param  list<list<array{id: string, teams: list<int>}>>  $rounds
 * @param  array<string, array{at: CarbonImmutable, court: int}>  $slots
 * @return array<string, list<int>> start time => teams playing
 */
function teamsBySlot(array $rounds, array $slots): array
{
    $bySlot = [];
    foreach (array_merge(...$rounds) as $game) {
        $key = $slots[$game['id']]['at']->format('Y-m-d H:i');
        $bySlot[$key] = [...($bySlot[$key] ?? []), ...$game['teams']];
    }
    ksort($bySlot);

    return $bySlot;
}

test('one round per match day when days between rounds are set', function () {
    $rounds = roundRobinInput(4);
    $options = new ScheduleOptions(CarbonImmutable::parse('2026-11-07 09:00'), gameMinutes: 60, courts: 1, daysBetweenRounds: 7);

    $slots = (new ScheduleSlotAssigner)->assign($rounds, $options);

    expect($slots['0-0']['at']->format('Y-m-d H:i'))->toBe('2026-11-07 09:00')
        ->and($slots['0-1']['at']->format('Y-m-d H:i'))->toBe('2026-11-07 10:00')
        ->and($slots['1-0']['at']->format('Y-m-d H:i'))->toBe('2026-11-14 09:00')
        ->and($slots['2-1']['at']->format('Y-m-d H:i'))->toBe('2026-11-21 10:00');
});

test('parallel courts never put a team in two games at the same time', function () {
    $rounds = roundRobinInput(7);
    $options = new ScheduleOptions(CarbonImmutable::parse('2026-11-07 08:00'), gameMinutes: 40, courts: 3, daysBetweenRounds: 0);

    $slots = (new ScheduleSlotAssigner)->assign($rounds, $options);

    expect($slots)->toHaveCount(21);
    foreach (teamsBySlot($rounds, $slots) as $teams) {
        expect(count($teams))->toBe(count(array_unique($teams)))
            ->and(count($teams))->toBeLessThanOrEqual(6);
    }
});

test('on a single day teams rest between games whenever possible', function () {
    $rounds = roundRobinInput(6);
    $options = new ScheduleOptions(CarbonImmutable::parse('2026-11-07 08:00'), gameMinutes: 30, courts: 1, daysBetweenRounds: 0);

    $bySlot = array_values(teamsBySlot($rounds, (new ScheduleSlotAssigner)->assign($rounds, $options)));

    expect($bySlot)->toHaveCount(15)
        ->and(backToBack($bySlot))->toBe(0);
});

test('games are reordered to avoid back-to-back games', function () {
    // In plain order team 5 would play "5-6" and then "5-1" right after.
    $rounds = [
        [['id' => 'a1', 'teams' => [1, 2]], ['id' => 'a2', 'teams' => [3, 4]], ['id' => 'a3', 'teams' => [5, 6]]],
        [['id' => 'b1', 'teams' => [5, 1]], ['id' => 'b2', 'teams' => [2, 3]], ['id' => 'b3', 'teams' => [4, 6]]],
    ];
    $options = new ScheduleOptions(CarbonImmutable::parse('2026-11-07 08:00'), gameMinutes: 30, courts: 1, daysBetweenRounds: 0);

    $bySlot = array_values(teamsBySlot($rounds, (new ScheduleSlotAssigner)->assign($rounds, $options)));

    expect(backToBack($bySlot))->toBe(0)
        ->and(backToBack(array_merge(...array_map(fn ($games) => array_column($games, 'teams'), $rounds))))->toBe(1);
});

/**
 * @param  list<list<int>>  $slots  Teams playing in each consecutive slot.
 */
function backToBack(array $slots): int
{
    $count = 0;
    for ($i = 1; $i < count($slots); $i++) {
        $count += count(array_intersect($slots[$i], $slots[$i - 1]));
    }

    return $count;
}

test('knockout rounds do not overlap', function () {
    $rounds = [
        [['id' => 'q1', 'teams' => [1, 2]], ['id' => 'q2', 'teams' => [3, 4]], ['id' => 'q3', 'teams' => [5, 6]], ['id' => 'q4', 'teams' => [7, 8]]],
        [['id' => 's1', 'teams' => [null, null]], ['id' => 's2', 'teams' => [null, null]]],
        [['id' => 'f', 'teams' => [null, null]]],
    ];
    $options = new ScheduleOptions(CarbonImmutable::parse('2026-11-07 09:00'), gameMinutes: 60, courts: 3, daysBetweenRounds: 0);

    $slots = (new ScheduleSlotAssigner)->assign($rounds, $options, strictRounds: true);

    $lastQuarter = max(array_map(fn ($id) => $slots[$id]['at'], ['q1', 'q2', 'q3', 'q4']));
    expect($slots['s1']['at']->greaterThan($lastQuarter))->toBeTrue()
        ->and($slots['f']['at']->greaterThan($slots['s2']['at']))->toBeTrue()
        ->and($slots['q4']['court'])->toBe(0); // 4 quarters on 3 courts: the 4th waits for a free court.
});

test('courts get default names when there are several', function () {
    $options = new ScheduleOptions(CarbonImmutable::now(), courts: 2);
    $named = new ScheduleOptions(CarbonImmutable::now(), courts: 2, courtNames: ['Norte', 'Sur']);
    $single = new ScheduleOptions(CarbonImmutable::now(), courts: 1);

    expect($options->courtName(1))->toBe('Cancha 2')
        ->and($named->courtName(0))->toBe('Norte')
        ->and($single->courtName(0))->toBeNull();
});
