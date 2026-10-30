<?php

namespace App\Services\Scheduling;

use Carbon\CarbonImmutable;

/**
 * When and where the generated games are played.
 */
final readonly class ScheduleOptions
{
    /**
     * @param  list<string>  $courtNames  One name per court; empty when there is a single unnamed court.
     */
    public function __construct(
        public CarbonImmutable $startsAt,
        public int $gameMinutes = 60,
        public int $courts = 1,
        public array $courtNames = [],
        public int $daysBetweenRounds = 7,
    ) {}

    public function courtName(int $court): ?string
    {
        if (isset($this->courtNames[$court])) {
            return $this->courtNames[$court];
        }

        return $this->courts > 1 ? 'Cancha '.($court + 1) : null;
    }
}
