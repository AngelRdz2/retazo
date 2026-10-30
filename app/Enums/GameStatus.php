<?php

namespace App\Enums;

enum GameStatus: string
{
    case Scheduled = 'scheduled';
    case Live = 'live';
    case Finished = 'finished';

    public function label(): string
    {
        return match ($this) {
            self::Scheduled => 'Programado',
            self::Live => 'En vivo',
            self::Finished => 'Finalizado',
        };
    }
}
