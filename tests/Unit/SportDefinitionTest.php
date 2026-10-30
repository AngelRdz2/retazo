<?php

use App\Enums\Sport;

test('football awards 3-1-0 by default', function () {
    $football = Sport::Football->definition();
    $settings = $football->defaultSettings();

    expect($football->standingsPoints(2, 1, $settings))->toBe(3)
        ->and($football->standingsPoints(1, 1, $settings))->toBe(1)
        ->and($football->standingsPoints(0, 3, $settings))->toBe(0);
});

test('volleyball best of 5 rewards reaching the deciding set', function () {
    $volleyball = Sport::Volleyball->definition();
    $settings = [...$volleyball->defaultSettings(), 'best_of' => 5];

    expect($volleyball->standingsPoints(3, 0, $settings))->toBe(3)
        ->and($volleyball->standingsPoints(3, 1, $settings))->toBe(3)
        ->and($volleyball->standingsPoints(3, 2, $settings))->toBe(2)
        ->and($volleyball->standingsPoints(2, 3, $settings))->toBe(1)
        ->and($volleyball->standingsPoints(1, 3, $settings))->toBe(0)
        ->and($volleyball->standingsPoints(0, 3, $settings))->toBe(0);
});

test('volleyball best of 3 treats 2-1 as the deciding set', function () {
    $volleyball = Sport::Volleyball->definition();
    $settings = $volleyball->defaultSettings();

    expect($volleyball->standingsPoints(2, 0, $settings))->toBe(3)
        ->and($volleyball->standingsPoints(2, 1, $settings))->toBe(2)
        ->and($volleyball->standingsPoints(1, 2, $settings))->toBe(1)
        ->and($volleyball->standingsPoints(0, 2, $settings))->toBe(0);
});

test('basketball awards 2 for a win and 1 for a loss', function () {
    $basketball = Sport::Basketball->definition();
    $settings = $basketball->defaultSettings();

    expect($basketball->standingsPoints(80, 75, $settings))->toBe(2)
        ->and($basketball->standingsPoints(75, 80, $settings))->toBe(1)
        ->and($basketball->allowsDraw())->toBeFalse();
});
