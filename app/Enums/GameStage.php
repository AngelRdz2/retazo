<?php

namespace App\Enums;

enum GameStage: string
{
    case League = 'league';
    case Group = 'group';
    case Knockout = 'knockout';

    public function label(): string
    {
        return match ($this) {
            self::League => 'Liga',
            self::Group => 'Fase de grupos',
            self::Knockout => 'Eliminatoria',
        };
    }
}
