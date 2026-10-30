<?php

namespace App\Services;

use App\Enums\GameStage;
use App\Enums\GameStatus;
use App\Enums\TournamentFormat;
use App\Enums\TournamentStatus;
use App\Models\Game;
use App\Models\Tournament;
use App\Sports\SportDefinition;
use App\Sports\Volleyball;
use Closure;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Live scoring of a game: start, adjust the score, close volleyball sets, finish and reopen.
 * Every change runs on a locked row so two scorers tapping at once don't overwrite each other.
 */
class GameScoring
{
    public function __construct(private KnockoutAdvancer $advancer) {}

    public function start(Game $game): void
    {
        $this->locked($game, function (Game $game) {
            $this->expectStatus($game, GameStatus::Scheduled, 'El partido ya empezó.');

            if ($game->home_team_id === null || $game->away_team_id === null) {
                $this->fail('Todavía no se conocen los dos equipos de este partido.');
            }

            $game->fill([
                'status' => GameStatus::Live,
                'started_at' => now(),
                'home_score' => 0,
                'away_score' => 0,
                'sets' => $this->sport($game)->usesSets() ? [['home' => 0, 'away' => 0]] : null,
            ])->save();
        });
    }

    /**
     * Add (or take away) points for one team. In volleyball it changes the current set.
     *
     * @param  'home'|'away'  $side
     */
    public function adjust(Game $game, string $side, int $delta): void
    {
        $this->locked($game, function (Game $game) use ($side, $delta) {
            $this->expectStatus($game, GameStatus::Live, 'El partido no está en vivo.');
            $sport = $this->sport($game);

            if ($delta !== -1 && ! in_array($delta, $sport->scoreIncrements(), true)) {
                $this->fail('Ese valor no se puede sumar en este deporte.');
            }

            if ($sport->usesSets()) {
                $sets = $this->sets($game);
                $current = array_pop($sets);
                $current[$side] = max(0, $current[$side] + $delta);
                $sets[] = $current;
                $game->sets = $sets;
            } elseif ($side === 'home') {
                $game->home_score = max(0, $game->home_score + $delta);
            } else {
                $game->away_score = max(0, $game->away_score + $delta);
            }

            $game->save();
        });
    }

    /**
     * Volleyball: the current set goes to whoever has more points.
     * The game ends as soon as a team wins the sets it needs.
     */
    public function closeSet(Game $game): void
    {
        $this->locked($game, function (Game $game) {
            $this->expectStatus($game, GameStatus::Live, 'El partido no está en vivo.');
            $sets = $this->sets($game);
            $current = $sets[array_key_last($sets)];

            if ($current['home'] === $current['away']) {
                $this->fail('El set no puede cerrarse empatado.');
            }

            $homeWon = $current['home'] > $current['away'];
            $homeWon ? $game->home_score++ : $game->away_score++;

            if (max($game->home_score, $game->away_score) >= Volleyball::setsToWin($game->tournament->settings)) {
                $this->complete($game, $homeWon ? $game->home_team_id : $game->away_team_id);

                return;
            }

            $sets[] = ['home' => 0, 'away' => 0];
            $game->sets = $sets;
            $game->save();
        });
    }

    /**
     * Volleyball: undo the last "close set" while the new set is still 0-0.
     */
    public function undoSet(Game $game): void
    {
        $this->locked($game, function (Game $game) {
            $this->expectStatus($game, GameStatus::Live, 'El partido no está en vivo.');
            $sets = $this->sets($game);
            $current = array_pop($sets);

            if ($sets === [] || $current['home'] + $current['away'] > 0) {
                $this->fail('Solo puedes deshacer el cierre mientras el set actual sigue 0-0.');
            }

            $this->takeBackSet($game, $sets[array_key_last($sets)]);
            $game->sets = $sets;
            $game->save();
        });
    }

    /**
     * Football and basketball. A tie in a knockout needs the penalty shoot-out
     * (football); a sport without draws keeps playing overtime (basketball).
     */
    public function finish(Game $game, ?int $homePenalties = null, ?int $awayPenalties = null): void
    {
        $this->locked($game, function (Game $game) use ($homePenalties, $awayPenalties) {
            $this->expectStatus($game, GameStatus::Live, 'El partido no está en vivo.');
            $sport = $this->sport($game);

            if ($sport->usesSets()) {
                $this->fail('En vóley el partido termina al cerrar el último set.');
            }

            if ($game->home_score !== $game->away_score) {
                $this->complete($game, $game->home_score > $game->away_score ? $game->home_team_id : $game->away_team_id);

                return;
            }

            if ($game->stage === GameStage::Knockout && $sport->decidesKnockoutTiesByPenalties()) {
                if ($homePenalties === null || $awayPenalties === null || $homePenalties === $awayPenalties) {
                    throw ValidationException::withMessages([
                        'penalties' => 'Hubo empate: ingresa el resultado de los penales (no puede quedar empatado).',
                    ]);
                }

                $game->home_penalties = $homePenalties;
                $game->away_penalties = $awayPenalties;
                $this->complete($game, $homePenalties > $awayPenalties ? $game->home_team_id : $game->away_team_id);

                return;
            }

            if (! $sport->allowsDraw() || $game->stage === GameStage::Knockout) {
                $this->fail('El partido está empatado: se juega tiempo extra y se sigue sumando al marcador.');
            }

            $this->complete($game, null);
        });
    }

    /**
     * Back to live to fix a mistake, as long as the next knockout game hasn't started.
     */
    public function reopen(Game $game): void
    {
        $this->locked($game, function (Game $game) {
            $this->expectStatus($game, GameStatus::Finished, 'El partido no está finalizado.');
            $this->advancer->revert($game);

            if ($this->sport($game)->usesSets()) {
                // The last set becomes the current set again.
                $sets = $this->sets($game);
                $this->takeBackSet($game, $sets[array_key_last($sets)]);
            }

            $game->fill([
                'status' => GameStatus::Live,
                'winner_team_id' => null,
                'finished_at' => null,
                'home_penalties' => null,
                'away_penalties' => null,
            ])->save();

            $this->refreshTournamentStatus($game->tournament);
        });
    }

    private function complete(Game $game, ?int $winnerId): void
    {
        $game->fill([
            'status' => GameStatus::Finished,
            'winner_team_id' => $winnerId,
            'finished_at' => now(),
        ])->save();

        if ($game->stage === GameStage::Knockout) {
            $this->advancer->advance($game);
        }

        $this->refreshTournamentStatus($game->tournament);
    }

    /**
     * The tournament is over when every game is finished (and, with groups, the knockout exists).
     */
    private function refreshTournamentStatus(Tournament $tournament): void
    {
        $pending = $tournament->games()->whereNot('status', GameStatus::Finished)->exists();
        $waitingForKnockout = $tournament->format === TournamentFormat::GroupsKnockout
            && ! $tournament->games()->where('stage', GameStage::Knockout)->exists();

        $tournament->update([
            'status' => $pending || $waitingForKnockout ? TournamentStatus::InProgress : TournamentStatus::Finished,
        ]);
    }

    /**
     * @param  array{home: int, away: int}  $set
     */
    private function takeBackSet(Game $game, array $set): void
    {
        $set['home'] > $set['away'] ? $game->home_score-- : $game->away_score--;
    }

    /**
     * @return non-empty-list<array{home: int, away: int}>
     */
    private function sets(Game $game): array
    {
        if (! $this->sport($game)->usesSets()) {
            $this->fail('Este deporte no se juega por sets.');
        }

        return $game->sets ?: [['home' => 0, 'away' => 0]];
    }

    private function sport(Game $game): SportDefinition
    {
        return $game->tournament->sportDefinition();
    }

    private function expectStatus(Game $game, GameStatus $status, string $message): void
    {
        if ($game->status !== $status) {
            $this->fail($message);
        }
    }

    /**
     * @param  Closure(Game): void  $callback
     */
    private function locked(Game $game, Closure $callback): void
    {
        DB::transaction(function () use ($game, $callback) {
            $callback(Game::with('tournament')->lockForUpdate()->findOrFail($game->id));
        });
    }

    private function fail(string $message): never
    {
        throw ValidationException::withMessages(['game' => $message]);
    }
}
