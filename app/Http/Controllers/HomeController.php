<?php

namespace App\Http\Controllers;

use App\Enums\GameStatus;
use App\Enums\TeamStatus;
use App\Enums\TournamentStatus;
use App\Models\Game;
use App\Models\Team;
use App\Models\Tournament;
use App\Support\CoverImage;
use App\Support\MatchCard;
use App\Support\TournamentMeta;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(): Response
    {
        $published = Tournament::query()->whereNot('status', TournamentStatus::Draft);
        $publishedIds = (clone $published)->select('id');

        return Inertia::render('welcome', [
            'tournaments' => (clone $published)
                ->withCount(['teams' => fn ($q) => $q->where('status', TeamStatus::Approved)])
                ->with(['teams' => fn ($q) => $q->where('status', TeamStatus::Approved)->orderBy('id')->limit(4)])
                ->orderByRaw('status = ? desc', [TournamentStatus::InProgress->value])
                ->latest()
                ->limit(6)
                ->get(),
            'stats' => [
                'tournaments' => (clone $published)->count(),
                'teams' => Team::whereIn('tournament_id', $publishedIds)->where('status', TeamStatus::Approved)->count(),
                'games' => Game::whereIn('tournament_id', $publishedIds)->where('status', GameStatus::Finished)->count(),
            ],
            'upcoming' => Game::query()->listed()->upcoming()->limit(6)->get()->map(MatchCard::from(...))->values(),
            'results' => Game::query()->listed()->results()->limit(6)->get()->map(MatchCard::from(...))->values(),
            // Teams shown as crests in the "about" section.
            'crests' => Team::whereIn('tournament_id', $publishedIds)
                ->where('status', TeamStatus::Approved)
                ->inRandomOrder()
                ->limit(10)
                ->get(['id', 'name', 'color', 'logo_path']),
            'images' => [
                'stadium' => CoverImage::find('estadio'),
                'player' => CoverImage::find('jugador'),
                'trophy' => CoverImage::find('copa'),
            ],
        ])->withViewData(['meta' => TournamentMeta::site()]);
    }
}
