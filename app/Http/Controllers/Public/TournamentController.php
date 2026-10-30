<?php

namespace App\Http\Controllers\Public;

use App\Enums\GameStage;
use App\Enums\Sport;
use App\Enums\TeamStatus;
use App\Enums\TournamentFormat;
use App\Enums\TournamentStatus;
use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\Tournament;
use App\Services\StandingsCalculator;
use App\Support\CoverImage;
use App\Support\GameData;
use App\Support\RoundLabel;
use App\Support\TournamentMeta;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class TournamentController extends Controller
{
    /**
     * Published tournaments, filterable by sport, status and name.
     */
    public function index(Request $request): Response
    {
        $sport = Sport::tryFrom((string) $request->query('deporte'));
        $status = TournamentStatus::tryFrom((string) $request->query('estado'));
        $search = trim((string) $request->query('q'));

        $tournaments = Tournament::query()
            ->whereNot('status', TournamentStatus::Draft)
            ->when($sport, fn ($q) => $q->where('sport', $sport))
            ->when($status && $status !== TournamentStatus::Draft, fn ($q) => $q->where('status', $status))
            ->when($search !== '', fn ($q) => $q->where('name', 'like', '%'.addcslashes($search, '%_').'%'))
            ->withCount(['teams' => fn ($q) => $q->where('status', TeamStatus::Approved)])
            // A few crests per card.
            ->with(['teams' => fn ($q) => $q->where('status', TeamStatus::Approved)->orderBy('id')->limit(4)])
            ->orderByRaw('status = ? desc', [TournamentStatus::InProgress->value])
            ->latest('start_date')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('public/tournaments', [
            'tournaments' => $tournaments,
            'filters' => ['deporte' => $sport?->value, 'estado' => $status?->value, 'q' => $search],
            'sports' => array_map(fn (Sport $s) => ['value' => $s->value, 'label' => $s->label()], Sport::cases()),
        ])->withViewData(['meta' => [...TournamentMeta::site(), 'title' => 'Torneos · Retazo', 'url' => route('public.tournaments.index')]]);
    }

    public function show(Request $request, Tournament $tournament, StandingsCalculator $standings): Response
    {
        abort_if($tournament->status === TournamentStatus::Draft, 404);

        $games = $tournament->games()->with(['homeTeam', 'awayTeam', 'group'])
            ->orderBy('scheduled_at')->orderBy('round')->orderBy('bracket_position')
            ->get();
        $knockoutRounds = (int) $games->where('stage', GameStage::Knockout)->max('round');
        $teams = $tournament->teams()->where('status', TeamStatus::Approved)->orderBy('name')->get();

        return Inertia::render('public/tournament', [
            'tournament' => $tournament,
            'tab' => $request->query('tab'),
            // Match shown in the header, e.g. when coming from a match card.
            'featuredGameId' => $request->integer('partido') ?: null,
            'teams' => $teams->map->only(['id', 'name', 'color', 'logo_url', 'group_id'])->values(),
            'groups' => $tournament->groups()->get(['id', 'name']),
            'rules' => $tournament->rules()->where('is_active', true)->get(),
            'registrationOpen' => $tournament->acceptsPublicRegistrations(),
            'games' => $games->map(fn (Game $game) => GameData::from($game, $knockoutRounds))->values(),
            'standings' => $this->tables($standings->tables($tournament, $games)),
            'columns' => $tournament->sportDefinition()->standingsColumns(),
            'qualifiers' => $tournament->format === TournamentFormat::GroupsKnockout
                ? (int) ($tournament->settings['qualifiers_per_group'] ?? 2)
                : null,
            'bracket' => $this->bracket($games, $knockoutRounds),
            'stadium' => CoverImage::find('estadio'),
        ])->withViewData(['meta' => TournamentMeta::for($tournament, $teams->count())]);
    }

    /**
     * Standings rows with the team reduced to what the page shows.
     *
     * @param  list<array{title: string|null, group_id: int|null, rows: list<array<string, mixed>>}>  $tables
     * @return list<array<string, mixed>>
     */
    private function tables(array $tables): array
    {
        return array_map(fn (array $table) => [
            ...$table,
            'rows' => array_map(fn (array $row) => [
                ...$row,
                'team' => $row['team']->only(['id', 'name', 'color', 'logo_url']),
            ], $table['rows']),
        ], $tables);
    }

    /**
     * Knockout games by round, for the bracket view.
     *
     * @param  Collection<int, Game>  $games
     * @return array{size: int, rounds: list<array<string, mixed>>}|null
     */
    private function bracket(Collection $games, int $rounds): ?array
    {
        $knockout = $games->where('stage', GameStage::Knockout);

        if ($knockout->isEmpty()) {
            return null;
        }

        return [
            'size' => 2 ** $rounds,
            'rounds' => array_map(fn (int $round) => [
                'round' => $round,
                'label' => RoundLabel::for(GameStage::Knockout, $round, $rounds),
                'games' => $knockout->where('round', $round)->sortBy('bracket_position')
                    ->map(fn (Game $game) => GameData::from($game, $rounds))->values()->all(),
            ], range(1, $rounds)),
        ];
    }
}
