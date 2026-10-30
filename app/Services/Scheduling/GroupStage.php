<?php

namespace App\Services\Scheduling;

use App\Enums\GameStage;
use App\Enums\TeamStatus;
use App\Models\Group;
use App\Models\Tournament;
use App\Services\StandingsCalculator;
use Illuminate\Support\Facades\DB;

/**
 * Groups of a "groups + knockout" tournament: draw, manual assignment and qualifiers.
 */
class GroupStage
{
    public function __construct(
        private StandingsCalculator $standings,
        private KnockoutBracketBuilder $bracket,
    ) {}

    /**
     * Random draw of the approved teams into the configured number of groups.
     */
    public function draw(Tournament $tournament): void
    {
        DB::transaction(function () use ($tournament) {
            $groups = $this->recreateGroups($tournament);
            $teams = $tournament->teams()->where('status', TeamStatus::Approved)->get()->shuffle();

            foreach ($teams->values() as $i => $team) {
                $team->update(['group_id' => $groups[$i % count($groups)]->id]);
            }
        });
    }

    /**
     * Empty groups so the organizer assigns the teams by hand.
     */
    public function createEmpty(Tournament $tournament): void
    {
        DB::transaction(fn () => $this->recreateGroups($tournament));
    }

    /**
     * @param  array<int, int|null>  $assignments  team id => group id
     */
    public function assign(Tournament $tournament, array $assignments): void
    {
        $groupIds = $tournament->groups()->pluck('id')->all();

        DB::transaction(function () use ($tournament, $assignments, $groupIds) {
            foreach ($tournament->teams()->get() as $team) {
                if (array_key_exists($team->id, $assignments)) {
                    $groupId = $assignments[$team->id];
                    $team->update(['group_id' => in_array($groupId, $groupIds, true) ? $groupId : null]);
                }
            }
        });
    }

    /**
     * First-round knockout pairs from the group standings: group winners face
     * runners-up of another group, avoiding teams of the same group when possible.
     *
     * @return list<array{0: int|null, 1: int|null}>
     */
    public function knockoutPairs(Tournament $tournament): array
    {
        $qualifiers = (int) ($tournament->settings['qualifiers_per_group'] ?? 2);
        $byPlace = [];
        $groupOf = [];

        foreach ($tournament->groups()->with('teams', 'games')->get() as $group) {
            $teams = $group->teams->where('status', TeamStatus::Approved);
            $table = $this->standings->calculate($tournament, $teams, $group->games->where('stage', GameStage::Group));

            foreach (array_slice($table, 0, $qualifiers) as $place => $row) {
                $byPlace[$place][] = $row['team']->id;
                $groupOf[$row['team']->id] = $group->id;
            }
        }

        // Seeds: every group winner first, then every runner-up, and so on.
        $seeds = array_merge(...$byPlace);
        $pairs = $this->bracket->firstRound($seeds);

        return $this->separateGroupMates($pairs, $groupOf);
    }

    /**
     * Swap the second team of two pairs when that splits teams from the same group.
     *
     * @param  list<array{0: int|null, 1: int|null}>  $pairs
     * @param  array<int, int>  $groupOf
     * @return list<array{0: int|null, 1: int|null}>
     */
    private function separateGroupMates(array $pairs, array $groupOf): array
    {
        $clash = fn (array $pair) => $pair[0] !== null && $pair[1] !== null && $groupOf[$pair[0]] === $groupOf[$pair[1]];

        foreach ($pairs as $i => $pair) {
            if (! $clash($pair)) {
                continue;
            }

            foreach ($pairs as $j => $other) {
                if ($i === $j || $other[1] === null) {
                    continue;
                }

                $a = [$pair[0], $other[1]];
                $b = [$other[0], $pair[1]];

                if (! $clash($a) && ! $clash($b)) {
                    $pairs[$i] = $a;
                    $pairs[$j] = $b;
                    break;
                }
            }
        }

        return $pairs;
    }

    /**
     * @return list<Group>
     */
    private function recreateGroups(Tournament $tournament): array
    {
        $tournament->groups()->delete();
        $count = (int) ($tournament->settings['groups_count'] ?? 2);

        $groups = [];
        for ($i = 0; $i < $count; $i++) {
            $groups[] = $tournament->groups()->create(['name' => 'Grupo '.chr(65 + $i), 'sort_order' => $i]);
        }

        return $groups;
    }
}
