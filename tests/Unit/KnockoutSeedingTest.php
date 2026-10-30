<?php

use App\Services\Scheduling\KnockoutBracketBuilder;

test('seed order keeps the best seeds apart until the final', function () {
    expect(KnockoutBracketBuilder::seedOrder(2))->toBe([1, 2])
        ->and(KnockoutBracketBuilder::seedOrder(4))->toBe([1, 4, 2, 3])
        ->and(KnockoutBracketBuilder::seedOrder(8))->toBe([1, 8, 4, 5, 2, 7, 3, 6]);
});

test('a full bracket pairs best against worst', function () {
    $pairs = (new KnockoutBracketBuilder)->firstRound([10, 20, 30, 40, 50, 60, 70, 80]);

    expect($pairs)->toBe([[10, 80], [40, 50], [20, 70], [30, 60]]);
});

test('missing teams become byes for the best seeds', function () {
    $pairs = (new KnockoutBracketBuilder)->firstRound([10, 20, 30, 40, 50, 60]);

    // Bracket of 8 with 2 byes: seeds 1 and 2 skip the first round.
    expect($pairs)->toBe([[10, null], [40, 50], [20, null], [30, 60]]);
});

test('two teams play the final directly', function () {
    expect((new KnockoutBracketBuilder)->firstRound([5, 9]))->toBe([[5, 9]]);
});
