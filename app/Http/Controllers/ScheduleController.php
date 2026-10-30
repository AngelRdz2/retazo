<?php

namespace App\Http\Controllers;

use App\Enums\GameStage;
use App\Enums\GameStatus;
use App\Enums\TeamStatus;
use App\Enums\TournamentFormat;
use App\Http\Requests\GenerateScheduleRequest;
use App\Models\Game;
use App\Models\Team;
use App\Models\Tournament;
use App\Services\Scheduling\ScheduleGenerator;
use App\Support\GameData;
use App\Support\RoundLabel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    public function show(Request $request, Tournament $tournament, ScheduleGenerator $generator): Response
    {
        $games = $tournament->games()
            ->with(['homeTeam', 'awayTeam', 'group'])
            ->orderBy('round')->orderBy('scheduled_at')->orderBy('bracket_position')
            ->get();
        $teams = $tournament->teams()->where('status', TeamStatus::Approved)->orderBy('name')->get();
        $knockoutRounds = (int) $games->where('stage', GameStage::Knockout)->max('round');
        $groupGames = $games->where('stage', GameStage::Group);
        $defaults = [
            'starts_at' => $tournament->start_date->format('Y-m-d').'T09:00',
            'game_minutes' => 60,
            'courts' => 1,
            'court_names' => '',
            'days_between_rounds' => 7,
        ];
        $lastGroupGame = $groupGames->max('scheduled_at');

        return Inertia::render('tournaments/schedule', [
            'tournament' => $tournament,
            'canManage' => $request->user()->can('update', $tournament),
            'canScore' => $request->user()->can('score', $tournament),
            'stages' => $this->stages($games, $teams, $knockoutRounds),
            'teams' => $teams->map->only(['id', 'name', 'color', 'logo_url', 'group_id'])->values(),
            'groups' => $tournament->groups()->get(['id', 'name']),
            'pendingTeams' => $tournament->teams()->where('status', TeamStatus::Pending)->count(),
            'hasStarted' => $generator->hasStarted($tournament),
            'canGenerateKnockout' => $tournament->format === TournamentFormat::GroupsKnockout
                && $groupGames->isNotEmpty()
                && $groupGames->every(fn (Game $game) => $game->status === GameStatus::Finished)
                && $knockoutRounds === 0,
            'defaults' => $defaults,
            // The knockout starts a week after the last group game.
            'knockoutDefaults' => [
                ...$defaults,
                'starts_at' => $lastGroupGame ? $lastGroupGame->addWeek()->format('Y-m-d').'T09:00' : $defaults['starts_at'],
            ],
        ]);
    }

    public function store(GenerateScheduleRequest $request, Tournament $tournament, ScheduleGenerator $generator): RedirectResponse
    {
        $generator->generate($tournament, $request->options());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Calendario generado.']);

        return to_route('tournaments.schedule.show', $tournament);
    }

    public function knockout(GenerateScheduleRequest $request, Tournament $tournament, ScheduleGenerator $generator): RedirectResponse
    {
        $generator->generateKnockoutFromGroups($tournament, $request->options());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Fase eliminatoria generada con los clasificados.']);

        return to_route('tournaments.schedule.show', $tournament);
    }

    /**
     * Games grouped by stage and round, with the teams that rest in each round.
     *
     * @param  Collection<int, Game>  $games
     * @param  Collection<int, Team>  $teams
     * @return list<array<string, mixed>>
     */
    private function stages(Collection $games, Collection $teams, int $knockoutRounds): array
    {
        $stages = [];

        foreach (GameStage::cases() as $stage) {
            $stageGames = $games->where('stage', $stage);

            if ($stageGames->isEmpty()) {
                continue;
            }

            $stages[] = [
                'stage' => $stage->value,
                'title' => $stage->label(),
                'rounds' => $stageGames->groupBy('round')->map(fn (Collection $roundGames, int $round) => [
                    'round' => $round,
                    'label' => RoundLabel::for($stage, $round, $knockoutRounds),
                    'games' => $roundGames->sortBy(fn (Game $game) => $game->scheduled_at?->timestamp)
                        ->map(fn (Game $game) => GameData::from($game, $knockoutRounds))->values(),
                    'resting' => $stage === GameStage::Knockout ? [] : $this->resting($roundGames, $teams, $stage),
                ])->values(),
            ];
        }

        return $stages;
    }

    /**
     * Teams that don't play in a league or group round (odd number of teams).
     *
     * @param  Collection<int, Game>  $roundGames
     * @param  Collection<int, Team>  $teams
     * @return list<string>
     */
    private function resting(Collection $roundGames, Collection $teams, GameStage $stage): array
    {
        $playing = $roundGames->flatMap(fn (Game $game) => [$game->home_team_id, $game->away_team_id]);
        $groupIds = $roundGames->pluck('group_id')->unique();

        return array_values($teams
            ->filter(fn (Team $team) => $stage === GameStage::League || $groupIds->contains($team->group_id))
            ->reject(fn (Team $team) => $playing->contains($team->id))
            ->map(fn (Team $team) => $team->name)
            ->all());
    }
}
