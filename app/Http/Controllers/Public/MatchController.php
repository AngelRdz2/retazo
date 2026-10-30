<?php

namespace App\Http\Controllers\Public;

use App\Enums\GameStatus;
use App\Enums\Sport;
use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Support\MatchCard;
use App\Support\TournamentMeta;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Every public game: upcoming (live first) or results, filterable by sport.
 */
class MatchController extends Controller
{
    public function index(Request $request): Response
    {
        $view = $request->query('vista') === 'resultados' ? 'resultados' : 'proximos';
        $sport = Sport::tryFrom((string) $request->query('deporte'));

        $games = Game::query()->listed($sport)
            ->when($view === 'resultados', fn ($q) => $q->results(), fn ($q) => $q->upcoming())
            ->paginate(12)
            ->withQueryString()
            ->through(MatchCard::from(...));

        return Inertia::render('public/matches', [
            'games' => $games,
            'filters' => ['vista' => $view, 'deporte' => $sport?->value],
            'live' => Game::query()->listed($sport)->where('status', GameStatus::Live)->count(),
            'sports' => array_map(fn (Sport $s) => ['value' => $s->value, 'label' => $s->label()], Sport::cases()),
        ])->withViewData(['meta' => [
            ...TournamentMeta::site(),
            'title' => 'Partidos · Retazo',
            'url' => route('public.games.index'),
        ]]);
    }
}
