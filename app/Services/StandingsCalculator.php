<?php

namespace App\Services;

use App\Enums\GameStage;
use App\Enums\TeamStatus;
use App\Enums\Tiebreaker;
use App\Enums\TournamentFormat;
use App\Models\Game;
use App\Models\Group;
use App\Models\Team;
use App\Models\Tournament;
use App\Sports\SportDefinition;
use Illuminate\Support\Collection;

/**
 * Standings table: sport-specific points plus the tournament's tiebreakers, in order.
 *
 * @phpstan-type Row array{team: Team, position: int, played: int, won: int, drawn: int, lost: int, for: int, against: int, difference: int, points: int}
 */
class StandingsCalculator
{
    /**
     * Every table of a tournament: one for a league, one per group, none for a plain knockout.
     *
     * @param  Collection<int, Game>  $games  All the tournament games.
     * @return list<array{title: string|null, group_id: int|null, rows: list<Row>}>
     */
    public function tables(Tournament $tournament, Collection $games): array
    {
        $teams = $tournament->teams()->where('status', TeamStatus::Approved)->get();

        return match ($tournament->format) {
            TournamentFormat::League => [[
                'title' => null,
                'group_id' => null,
                'rows' => $this->calculate($tournament, $teams, $games->where('stage', GameStage::League)),
            ]],
            TournamentFormat::GroupsKnockout => array_values($tournament->groups()->get()->map(fn (Group $group) => [
                'title' => $group->name,
                'group_id' => $group->id,
                'rows' => $this->calculate(
                    $tournament,
                    $teams->where('group_id', $group->id),
                    $games->where('stage', GameStage::Group)->where('group_id', $group->id),
                ),
            ])->all()),
            TournamentFormat::Knockout => [],
        };
    }

    /**
     * @param  iterable<Team>  $teams
     * @param  iterable<Game>  $games  Only finished games between these teams count.
     * @return list<Row>
     */
    public function calculate(Tournament $tournament, iterable $teams, iterable $games): array
    {
        $definition = $tournament->sportDefinition();
        $settings = $tournament->settings;

        $rows = [];
        foreach ($teams as $team) {
            $rows[$team->id] = [
                'team' => $team, 'position' => 0, 'played' => 0, 'won' => 0, 'drawn' => 0, 'lost' => 0,
                'for' => 0, 'against' => 0, 'difference' => 0, 'points' => 0,
            ];
        }

        $finished = collect($games)->filter(
            fn (Game $game) => $game->isFinished() && isset($rows[$game->home_team_id], $rows[$game->away_team_id])
        )->values();

        foreach ($finished as $game) {
            $this->addResult($rows[$game->home_team_id], $game->home_score, $game->away_score, $definition, $settings);
            $this->addResult($rows[$game->away_team_id], $game->away_score, $game->home_score, $definition, $settings);
        }

        $sorted = $this->sort(array_values($rows), $tournament->tiebreakers, $finished, $definition, $settings);

        foreach ($sorted as $i => &$row) {
            $row['position'] = $i + 1;
        }

        return $sorted;
    }

    /**
     * @param  Row  $row
     * @param  array<string, mixed>  $settings
     */
    private function addResult(array &$row, int $scored, int $conceded, SportDefinition $definition, array $settings): void
    {
        $row['played']++;
        $row['for'] += $scored;
        $row['against'] += $conceded;
        $row['difference'] = $row['for'] - $row['against'];
        $row['points'] += $definition->standingsPoints($scored, $conceded, $settings);

        match ($scored <=> $conceded) {
            1 => $row['won']++,
            0 => $row['drawn']++,
            -1 => $row['lost']++,
        };
    }

    /**
     * Sort by the first criterion; teams still tied are sorted by the next one, and so on.
     *
     * @param  list<Row>  $rows
     * @param  list<string>  $criteria
     * @param  Collection<int, Game>  $games
     * @param  array<string, mixed>  $settings
     * @return list<Row>
     */
    private function sort(array $rows, array $criteria, Collection $games, SportDefinition $definition, array $settings): array
    {
        if (count($rows) < 2) {
            return $rows;
        }

        $criterion = Tiebreaker::tryFrom((string) array_shift($criteria));

        if ($criterion === null) {
            // Nothing left to break the tie: alphabetical, so the order is stable.
            if ($criteria === []) {
                usort($rows, fn (array $a, array $b) => strcasecmp($a['team']->name, $b['team']->name));

                return $rows;
            }

            return $this->sort($rows, $criteria, $games, $definition, $settings);
        }

        $headToHead = $criterion === Tiebreaker::HeadToHead
            ? $this->headToHeadPoints($rows, $games, $definition, $settings)
            : [];

        // Bucket the rows by the criterion value, highest first.
        $buckets = [];
        foreach ($rows as $row) {
            $value = match ($criterion) {
                Tiebreaker::Points => $row['points'],
                Tiebreaker::Difference => $row['difference'],
                Tiebreaker::ScoredFor => $row['for'],
                Tiebreaker::HeadToHead => $headToHead[$row['team']->id],
            };
            $buckets[$value][] = $row;
        }
        krsort($buckets);

        $sorted = [];
        foreach ($buckets as $tied) {
            array_push($sorted, ...$this->sort($tied, $criteria, $games, $definition, $settings));
        }

        return $sorted;
    }

    /**
     * Points each team earned in the games played only among the tied teams.
     *
     * @param  list<Row>  $rows
     * @param  Collection<int, Game>  $games
     * @param  array<string, mixed>  $settings
     * @return array<int, int>
     */
    private function headToHeadPoints(array $rows, Collection $games, SportDefinition $definition, array $settings): array
    {
        $ids = array_map(fn (array $row) => $row['team']->id, $rows);
        $points = array_fill_keys($ids, 0);

        foreach ($games as $game) {
            if (in_array($game->home_team_id, $ids, true) && in_array($game->away_team_id, $ids, true)) {
                $points[$game->home_team_id] += $definition->standingsPoints($game->home_score, $game->away_score, $settings);
                $points[$game->away_team_id] += $definition->standingsPoints($game->away_score, $game->home_score, $settings);
            }
        }

        return $points;
    }
}
