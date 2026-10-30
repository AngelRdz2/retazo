<?php

use App\Services\Scheduling\RoundRobinScheduler;

/**
 * @param  list<list<array{0: int, 1: int}>>  $rounds
 * @return array<string, int> "a-b" (sorted) => times played
 */
function pairCounts(array $rounds): array
{
    $counts = [];
    foreach ($rounds as $pairs) {
        foreach ($pairs as [$home, $away]) {
            $key = min($home, $away).'-'.max($home, $away);
            $counts[$key] = ($counts[$key] ?? 0) + 1;
        }
    }

    return $counts;
}

test('with an even number of teams everybody plays every round and meets everyone once', function () {
    $teams = [1, 2, 3, 4, 5, 6];
    $rounds = (new RoundRobinScheduler)->rounds($teams);

    expect($rounds)->toHaveCount(5);

    foreach ($rounds as $pairs) {
        $playing = array_merge(...$pairs);
        sort($playing);
        expect($playing)->toBe($teams);
    }

    $counts = pairCounts($rounds);
    expect($counts)->toHaveCount(15)
        ->and(array_values(array_unique($counts)))->toBe([1]);
});

test('with an odd number of teams each team rests exactly once', function () {
    $teams = [1, 2, 3, 4, 5];
    $rounds = (new RoundRobinScheduler)->rounds($teams);

    expect($rounds)->toHaveCount(5);

    $rests = array_fill_keys($teams, 0);
    foreach ($rounds as $pairs) {
        expect($pairs)->toHaveCount(2);
        $playing = array_merge(...$pairs);
        expect(array_unique($playing))->toHaveCount(4); // Nobody plays twice in a round.
        foreach (array_diff($teams, $playing) as $resting) {
            $rests[$resting]++;
        }
    }

    expect(array_values(array_unique($rests)))->toBe([1])
        ->and(pairCounts($rounds))->toHaveCount(10);
});

test('home and away games are balanced', function () {
    $rounds = (new RoundRobinScheduler)->rounds(range(1, 8));
    $home = array_fill_keys(range(1, 8), 0);
    foreach ($rounds as $pairs) {
        foreach ($pairs as [$h]) {
            $home[$h]++;
        }
    }

    // 7 games each: 3 or 4 at home.
    foreach ($home as $count) {
        expect($count)->toBeGreaterThanOrEqual(3)->toBeLessThanOrEqual(4);
    }
});

test('double round robin plays every pair twice with home and away swapped', function () {
    $rounds = (new RoundRobinScheduler)->rounds([1, 2, 3, 4], doubleRound: true);

    expect($rounds)->toHaveCount(6)
        ->and(array_values(array_unique(pairCounts($rounds))))->toBe([2]);

    $legs = array_merge(...$rounds);
    foreach ($legs as [$home, $away]) {
        expect($legs)->toContain([$away, $home]);
    }
});

test('fewer than two teams produce no games', function () {
    expect((new RoundRobinScheduler)->rounds([7]))->toBe([]);
});
