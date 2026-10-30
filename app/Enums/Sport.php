<?php

namespace App\Enums;

use App\Sports\Basketball;
use App\Sports\Football;
use App\Sports\SportDefinition;
use App\Sports\Volleyball;

/**
 * Supported sports. Sport-specific behavior lives in each SportDefinition class,
 * so adding a sport means adding a case here plus its definition and rule seeder.
 */
enum Sport: string
{
    case Football = 'football';
    case Volleyball = 'volleyball';
    case Basketball = 'basketball';

    public function definition(): SportDefinition
    {
        return match ($this) {
            self::Football => new Football,
            self::Volleyball => new Volleyball,
            self::Basketball => new Basketball,
        };
    }

    public function label(): string
    {
        return $this->definition()->label();
    }
}
