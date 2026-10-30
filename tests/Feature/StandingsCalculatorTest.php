<?php

namespace Tests\Feature;

use App\Enums\Sport;
use App\Enums\Tiebreaker;
use App\Models\Game;
use App\Models\Team;
use App\Models\Tournament;
use App\Services\StandingsCalculator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StandingsCalculatorTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @param  list<array{0: string, 1: int, 2: int, 3: string}>  $results  [home, home score, away score, away]
     * @return list<string> Team names in table order.
     */
    private function table(Tournament $tournament, array $teamNames, array $results, ?array &$rows = null): array
    {
        $teams = collect($teamNames)->mapWithKeys(fn (string $name) => [$name => Team::factory()->for($tournament)->create(['name' => $name])]);

        foreach ($results as [$home, $homeScore, $awayScore, $away]) {
            Game::factory()->for($tournament)->finished($homeScore, $awayScore)->create([
                'home_team_id' => $teams[$home]->id,
                'away_team_id' => $teams[$away]->id,
            ]);
        }

        $rows = (new StandingsCalculator)->calculate($tournament, $teams->values(), $tournament->games()->get());

        return array_map(fn (array $row) => $row['team']->name, $rows);
    }

    public function test_football_counts_wins_draws_losses_goals_and_points(): void
    {
        $tournament = Tournament::factory()->sport(Sport::Football)->create();

        $order = $this->table($tournament, ['A', 'B', 'C'], [
            ['A', 2, 0, 'B'],
            ['B', 1, 1, 'C'],
            ['C', 0, 3, 'A'],
        ], $rows);

        // B and C have 1 point each; B's goal difference (-2) beats C's (-3).
        expect($order)->toBe(['A', 'B', 'C']);
        expect($rows[0])->toMatchArray(['position' => 1, 'played' => 2, 'won' => 2, 'drawn' => 0, 'lost' => 0, 'for' => 5, 'against' => 0, 'difference' => 5, 'points' => 6]);
        expect($rows[1])->toMatchArray(['position' => 2, 'played' => 2, 'drawn' => 1, 'lost' => 1, 'for' => 1, 'against' => 3, 'difference' => -2, 'points' => 1]);
        expect($rows[2])->toMatchArray(['position' => 3, 'played' => 2, 'drawn' => 1, 'lost' => 1, 'for' => 1, 'against' => 4, 'difference' => -3, 'points' => 1]);
    }

    public function test_ties_on_points_go_to_goal_difference_then_goals_scored(): void
    {
        $tournament = Tournament::factory()->sport(Sport::Football)->create();

        // A, B and C all win once at home against D; D wins nothing.
        $order = $this->table($tournament, ['A', 'B', 'C', 'D'], [
            ['A', 1, 0, 'D'], // A: +1, scored 1
            ['B', 3, 1, 'D'], // B: +2, scored 3
            ['C', 2, 0, 'D'], // C: +2, scored 2
        ]);

        expect($order)->toBe(['B', 'C', 'A', 'D']);
    }

    public function test_head_to_head_breaks_a_tie_when_configured_before_difference(): void
    {
        $tournament = Tournament::factory()->sport(Sport::Football)->create([
            'tiebreakers' => [Tiebreaker::Points->value, Tiebreaker::HeadToHead->value, Tiebreaker::Difference->value],
        ]);

        // A and B both end with 4 points; B has the better difference but lost to A.
        // C and D (1 point each) never met, so their tie goes on to the difference.
        $order = $this->table($tournament, ['A', 'B', 'C', 'D'], self::TIED_RESULTS);

        expect($order)->toBe(['A', 'B', 'D', 'C']);
    }

    /**
     * @var list<array{0: string, 1: int, 2: int, 3: string}>
     */
    private const TIED_RESULTS = [
        ['A', 1, 0, 'B'],
        ['A', 0, 0, 'C'],
        ['B', 5, 0, 'C'],
        ['B', 0, 0, 'D'],
    ];

    public function test_the_tiebreaker_order_is_respected(): void
    {
        $tournament = Tournament::factory()->sport(Sport::Football)->create([
            'tiebreakers' => [Tiebreaker::Points->value, Tiebreaker::Difference->value, Tiebreaker::HeadToHead->value],
        ]);

        // Same results as above, but difference comes before head to head now.
        $order = $this->table($tournament, ['A', 'B', 'C', 'D'], self::TIED_RESULTS);

        expect($order)->toBe(['B', 'A', 'D', 'C']);
    }

    public function test_volleyball_awards_points_by_sets(): void
    {
        $tournament = Tournament::factory()->sport(Sport::Volleyball)->create([
            'settings' => ['best_of' => 5, 'points' => ['win' => 3, 'win_close' => 2, 'loss_close' => 1, 'loss' => 0]],
        ]);

        $this->table($tournament, ['A', 'B', 'C'], [
            ['A', 3, 2, 'B'], // A 2 pts, B 1 pt
            ['B', 3, 0, 'C'], // B 3 pts
            ['C', 3, 1, 'A'], // C 3 pts
        ], $rows);

        $points = collect($rows)->mapWithKeys(fn (array $row) => [$row['team']->name => $row['points']]);
        expect($points->all())->toBe(['B' => 4, 'C' => 3, 'A' => 2]);

        $b = collect($rows)->firstWhere('team.name', 'B');
        expect($b)->toMatchArray(['for' => 5, 'against' => 3, 'won' => 1, 'lost' => 1, 'drawn' => 0]);
    }

    public function test_basketball_gives_points_for_losing(): void
    {
        $tournament = Tournament::factory()->sport(Sport::Basketball)->create();

        $this->table($tournament, ['A', 'B'], [['A', 80, 75, 'B']], $rows);

        expect($rows[0])->toMatchArray(['points' => 2, 'difference' => 5])
            ->and($rows[1])->toMatchArray(['points' => 1, 'difference' => -5]);
    }

    public function test_unfinished_games_do_not_count(): void
    {
        $tournament = Tournament::factory()->create();
        [$a, $b] = Team::factory()->for($tournament)->count(2)->create();
        Game::factory()->for($tournament)->create(['home_team_id' => $a->id, 'away_team_id' => $b->id, 'home_score' => 3]);

        $rows = (new StandingsCalculator)->calculate($tournament, [$a, $b], $tournament->games()->get());

        expect(array_column($rows, 'played'))->toBe([0, 0]);
    }
}
