<?php

namespace App\Enums;

enum TeamStatus: string
{
    case Approved = 'approved';
    case Pending = 'pending';

    public function label(): string
    {
        return match ($this) {
            self::Approved => 'Aprobado',
            self::Pending => 'Pendiente',
        };
    }
}
