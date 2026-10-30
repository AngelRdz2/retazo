<?php

namespace App\Services\Scheduling;

use App\Enums\GameStage;
use App\Enums\GameStatus;
use App\Enums\TeamStatus;
use App\Enums\TournamentFormat;
use App\Enums\TournamentStatus;
use App\Models\Game;
use App\Models\Team;
use App\Models\Tournament;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Creates the games of a tournament according to its format and gives them times and courts.
 */
class ScheduleGenerator
{
    public function __construct(
        private RoundRobinScheduler $roundRobin,
        private KnockoutBracketBuilder $bracket,
        private ScheduleSlotAssigner $slots,
        private GroupStage $groups,
    ) {}

    /**
     * Generate (or regenerate, while no game has started) the whole schedule.
     * For "groups + knockout" this is the group stage; the knockout comes later.
     */
    public function generate(Tournament $tournament, ScheduleOptions $options): void
    {
        $this->ensureNothingPlayed($tournament);
        $teamIds = $this->shuffledIds($tournament->teams()->where('status', TeamStatus::Approved)->get());

        if (count($teamIds) < 2) {
            $this->fail('Necesitas al menos 2 equipos aprobados para generar el calendario.');
        }

        DB::transaction(function () use ($tournament, $options, $teamIds) {
            $tournament->games()->delete();

            match ($tournament->format) {
                TournamentFormat::League => $this->schedule(
                    $this->createRoundRobin($tournament, GameStage::League, $teamIds, $tournament->double_round),
                    $options,
                ),
                TournamentFormat::Knockout => $this->schedule(
                    $this->bracket->build($tournament, $this->bracket->firstRound($teamIds)),
                    $options,
                    strictRounds: true,
                ),
                TournamentFormat::GroupsKnockout => $this->schedule($this->createGroupStage($tournament), $options),
            };

            $tournament->update(['status' => TournamentStatus::InProgress]);
        });
    }

    /**
     * Knockout stage of a "groups + knockout" tournament, once every group game is finished.
     */
    public function generateKnockoutFromGroups(Tournament $tournament, ScheduleOptions $options): void
    {
        $games = $tournament->games();

        if ((clone $games)->where('stage', GameStage::Knockout)->exists()) {
            $this->fail('La fase eliminatoria ya fue generada.');
        }
        if (! (clone $games)->where('stage', GameStage::Group)->exists()
            || (clone $games)->where('stage', GameStage::Group)->whereNot('status', GameStatus::Finished)->exists()) {
            $this->fail('Todos los partidos de la fase de grupos deben estar finalizados.');
        }

        DB::transaction(function () use ($tournament, $options) {
            $this->schedule(
                $this->bracket->build($tournament, $this->groups->knockoutPairs($tournament)),
                $options,
                strictRounds: true,
            );
        });
    }

    public function hasStarted(Tournament $tournament): bool
    {
        return $tournament->games()->whereNot('status', GameStatus::Scheduled)->exists();
    }

    /**
     * @param  list<int>  $teamIds
     * @return list<list<Game>>
     */
    private function createRoundRobin(Tournament $tournament, GameStage $stage, array $teamIds, bool $doubleRound, ?int $groupId = null): array
    {
        $rounds = [];

        foreach ($this->roundRobin->rounds($teamIds, $doubleRound) as $index => $pairs) {
            $rounds[] = array_map(fn (array $pair) => $tournament->games()->create([
                'stage' => $stage,
                'group_id' => $groupId,
                'round' => $index + 1,
                'home_team_id' => $pair[0],
                'away_team_id' => $pair[1],
            ]), $pairs);
        }

        return $rounds;
    }

    /**
     * Round robin inside each group; round N of every group is played on the same match day.
     *
     * @return list<list<Game>>
     */
    private function createGroupStage(Tournament $tournament): array
    {
        $groups = $tournament->groups()->with(['teams' => fn ($q) => $q->where('status', TeamStatus::Approved)])->get();
        $qualifiers = (int) ($tournament->settings['qualifiers_per_group'] ?? 2);
        $unassigned = $tournament->teams()->where('status', TeamStatus::Approved)->whereNull('group_id')->count();

        if ($groups->isEmpty() || $unassigned > 0) {
            $this->fail('Asigna todos los equipos aprobados a un grupo antes de generar el calendario.');
        }
        if ($groups->contains(fn ($group) => $group->teams->count() < max(2, $qualifiers))) {
            $this->fail('Cada grupo necesita al menos '.max(2, $qualifiers).' equipos.');
        }

        $rounds = [];
        foreach ($groups as $group) {
            $groupRounds = $this->createRoundRobin(
                $tournament, GameStage::Group, $this->shuffledIds($group->teams), false, $group->id,
            );

            foreach ($groupRounds as $index => $games) {
                $rounds[$index] = [...($rounds[$index] ?? []), ...$games];
            }
        }

        return array_values($rounds);
    }

    /**
     * Team ids in random order: the draw that decides who meets whom and when.
     *
     * @param  Collection<int, Team>  $teams
     * @return list<int>
     */
    private function shuffledIds(Collection $teams): array
    {
        return array_values($teams->shuffle()->map(fn (Team $team) => $team->id)->all());
    }

    /**
     * @param  list<list<Game>>  $rounds
     */
    private function schedule(array $rounds, ScheduleOptions $options, bool $strictRounds = false): void
    {
        $input = array_map(fn (array $games) => array_map(fn (Game $game) => [
            'id' => $game->id,
            'teams' => [$game->home_team_id, $game->away_team_id],
        ], $games), $rounds);

        $assigned = $this->slots->assign($input, $options, $strictRounds);

        foreach ($rounds as $games) {
            foreach ($games as $game) {
                $slot = $assigned[$game->id];
                $game->update([
                    'scheduled_at' => $slot['at'],
                    'venue' => $options->courtName($slot['court']),
                ]);
            }
        }
    }

    private function ensureNothingPlayed(Tournament $tournament): void
    {
        if ($this->hasStarted($tournament)) {
            $this->fail('El calendario no se puede volver a generar porque ya hay partidos iniciados o jugados.');
        }
    }

    private function fail(string $message): never
    {
        throw ValidationException::withMessages(['schedule' => $message]);
    }
}
