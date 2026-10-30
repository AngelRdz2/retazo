<?php

namespace App\Http\Controllers;

use App\Enums\GameStage;
use App\Enums\GameStatus;
use App\Http\Requests\AdjustScoreRequest;
use App\Http\Requests\FinishGameRequest;
use App\Models\Game;
use App\Services\GameScoring;
use App\Services\KnockoutAdvancer;
use App\Sports\Volleyball;
use App\Support\GameData;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Scoring screen for the organizer and the scorers.
 */
class GameScoringController extends Controller
{
    public function __construct(private GameScoring $scoring) {}

    public function show(Request $request, Game $game, KnockoutAdvancer $advancer): Response
    {
        $game->load('tournament', 'homeTeam', 'awayTeam', 'group', 'nextGame');
        $tournament = $game->tournament;
        $sport = $tournament->sportDefinition();
        $knockoutRounds = (int) $tournament->games()->where('stage', GameStage::Knockout)->max('round');

        return Inertia::render('games/score', [
            'tournament' => $tournament->only(['id', 'name', 'slug', 'sport', 'sport_label', 'variant_label']),
            'game' => GameData::from($game, $knockoutRounds),
            'sport' => $sport->toArray(),
            'setsToWin' => $sport->usesSets() ? Volleyball::setsToWin($tournament->settings) : null,
            'setRule' => $sport->usesSets() ? $this->setRule($game) : null,
            'penaltiesOnTie' => $game->stage === GameStage::Knockout && $sport->decidesKnockoutTiesByPenalties(),
            'canReopen' => $game->status === GameStatus::Finished && $advancer->canRevert($game),
        ]);
    }

    public function start(Game $game): RedirectResponse
    {
        $this->scoring->start($game);

        return back();
    }

    public function adjust(AdjustScoreRequest $request, Game $game): RedirectResponse
    {
        $this->scoring->adjust($game, $request->side(), $request->integer('delta'));

        return back();
    }

    public function closeSet(Game $game): RedirectResponse
    {
        $this->scoring->closeSet($game);

        return back();
    }

    public function undoSet(Game $game): RedirectResponse
    {
        $this->scoring->undoSet($game);

        return back();
    }

    public function finish(FinishGameRequest $request, Game $game): RedirectResponse
    {
        $this->scoring->finish(
            $game,
            $request->filled('home_penalties') ? $request->integer('home_penalties') : null,
            $request->filled('away_penalties') ? $request->integer('away_penalties') : null,
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Partido finalizado.']);

        return back();
    }

    public function reopen(Game $game): RedirectResponse
    {
        $this->scoring->reopen($game);

        Inertia::flash('toast', ['type' => 'info', 'message' => 'Partido reabierto: corrige el marcador y vuelve a finalizarlo.']);

        return back();
    }

    /**
     * Points needed to win the current volleyball set and the minimum lead,
     * taken from the tournament's active rules.
     *
     * @return array{target: int, lead: int}|null
     */
    private function setRule(Game $game): ?array
    {
        $rules = $game->tournament->rules()->where('is_active', true)->pluck('value', 'template_key');
        $setNumber = count($game->sets ?? []);
        $deciding = $setNumber === (int) ($game->tournament->settings['best_of'] ?? 3);
        $target = $deciding ? ($rules['deciding_set_points'] ?? $rules['set_points'] ?? null) : ($rules['set_points'] ?? null);

        if (! is_numeric($target)) {
            return null;
        }

        return ['target' => (int) $target, 'lead' => is_numeric($rules['point_difference'] ?? null) ? (int) $rules['point_difference'] : 2];
    }
}
