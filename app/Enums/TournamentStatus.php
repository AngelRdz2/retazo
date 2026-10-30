<?php

namespace App\Enums;

enum TournamentStatus: string
{
    case Draft = 'draft';
    case RegistrationOpen = 'registration_open';
    case InProgress = 'in_progress';
    case Finished = 'finished';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Borrador',
            self::RegistrationOpen => 'Inscripciones abiertas',
            self::InProgress => 'En curso',
            self::Finished => 'Finalizado',
        };
    }
}
