<?php

namespace App\Enums;

/**
 * Standings tiebreak criteria, applied in the order configured by the organizer.
 */
enum Tiebreaker: string
{
    case Points = 'points';
    case Difference = 'difference';
    case ScoredFor = 'scored_for';
    case HeadToHead = 'head_to_head';

    public function label(): string
    {
        return match ($this) {
            self::Points => 'Puntos',
            self::Difference => 'Diferencia',
            self::ScoredFor => 'A favor',
            self::HeadToHead => 'Enfrentamiento directo',
        };
    }

    /**
     * @return list<string>
     */
    public static function defaultOrder(): array
    {
        return array_map(fn (self $t) => $t->value, self::cases());
    }
}
