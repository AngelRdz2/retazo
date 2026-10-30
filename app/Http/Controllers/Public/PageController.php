<?php

namespace App\Http\Controllers\Public;

use App\Enums\Sport;
use App\Http\Controllers\Controller;
use App\Models\RuleTemplate;
use App\Support\TournamentMeta;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    /**
     * "Cómo funciona": the sports section comes from the real sport definitions and rules.
     */
    public function howItWorks(): Response
    {
        return Inertia::render('public/how-it-works', [
            'sports' => array_map(fn (Sport $sport) => [
                ...$sport->definition()->toArray(),
                'rules' => RuleTemplate::query()->forSport($sport)->pluck('text')
                    ->map(fn (string $text) => str_replace('{value}', '…', $text))
                    ->unique()
                    ->values(),
            ], Sport::cases()),
        ])->withViewData(['meta' => [
            ...TournamentMeta::site(),
            'title' => 'Cómo funciona · Retazo',
            'description' => 'Crea tu torneo, suma equipos, genera el calendario y anota los partidos en vivo desde el teléfono.',
            'url' => route('public.how-it-works'),
        ]]);
    }
}
