<?php

namespace App\Support;

use App\Models\Tournament;
use Illuminate\Support\Str;

/**
 * Open Graph tags so a shared link looks good on WhatsApp. They are rendered by
 * the Blade root view because link previews don't run JavaScript.
 */
class TournamentMeta
{
    private const MONTHS = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ];

    /**
     * @return array{title: string, description: string, url: string, image: string}
     */
    public static function for(Tournament $tournament, int $teams): array
    {
        $summary = collect([
            $tournament->variant_label ?? $tournament->sport_label,
            $tournament->format_label,
            "{$teams} ".($teams === 1 ? 'equipo' : 'equipos'),
            'inicia el '.$tournament->start_date->day.' de '.self::MONTHS[$tournament->start_date->month - 1],
            $tournament->location,
        ])->filter()->implode(' · ');

        return [
            'title' => "{$tournament->name} · Retazo",
            'description' => Str::limit($tournament->description ? "{$tournament->description} — {$summary}" : $summary, 200),
            'url' => route('public.tournaments.show', $tournament),
            'image' => asset('images/og-image.png'),
        ];
    }

    /**
     * @return array{title: string, description: string, url: string, image: string}
     */
    public static function site(): array
    {
        return [
            'title' => 'Retazo · Torneos deportivos amateur',
            'description' => 'Organiza torneos de fútbol, vóley y básquet: calendario, marcadores en vivo, tabla de posiciones y cuadro de eliminatoria desde tu teléfono.',
            'url' => url('/'),
            'image' => asset('images/og-image.png'),
        ];
    }
}
