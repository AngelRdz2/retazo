<?php

namespace App\Support;

use App\Enums\Sport;
use App\Enums\Tiebreaker;
use App\Enums\TournamentFormat;
use App\Enums\TournamentStatus;

/**
 * Choices shown in the tournament form, built from the enums so the UI never hardcodes them.
 */
class TournamentOptions
{
    /**
     * @return array<string, mixed>
     */
    public static function all(): array
    {
        return [
            'sports' => array_map(fn (Sport $s) => $s->definition()->toArray(), Sport::cases()),
            'formats' => self::labels(TournamentFormat::cases()),
            'statuses' => self::labels(TournamentStatus::cases()),
            'tiebreakers' => self::labels(Tiebreaker::cases()),
        ];
    }

    /**
     * @param  list<TournamentFormat|TournamentStatus|Tiebreaker>  $cases
     * @return list<array{value: string, label: string}>
     */
    private static function labels(array $cases): array
    {
        return array_map(fn ($case) => ['value' => $case->value, 'label' => $case->label()], $cases);
    }
}
