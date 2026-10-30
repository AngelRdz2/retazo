<?php

namespace App\Enums;

enum TournamentFormat: string
{
    case League = 'league';
    case Knockout = 'knockout';
    case GroupsKnockout = 'groups_knockout';

    public function label(): string
    {
        return match ($this) {
            self::League => 'Todos contra todos (liga)',
            self::Knockout => 'Eliminatoria directa',
            self::GroupsKnockout => 'Grupos + eliminatoria',
        };
    }
}
