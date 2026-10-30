<?php

namespace Tests\Feature;

use App\Enums\GameStage;
use App\Enums\GameStatus;
use App\Enums\TournamentFormat;
use App\Enums\TournamentStatus;
use App\Models\Game;
use App\Models\Team;
use App\Models\Tournament;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Tests\TestCase;

class ScheduleGenerationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @var array<string, int|string>
     */
    private array $options = [
        'starts_at' => '2026-11-07T09:00',
        'game_minutes' => 60,
        'courts' => 2,
        'court_names' => '',
        'days_between_rounds' => 7,
    ];

    private function tournamentWithTeams(TournamentFormat $format, int $teams, array $attributes = []): Tournament
    {
        $tournament = Tournament::factory()->format($format)->status(TournamentStatus::RegistrationOpen)->create($attributes);
        Team::factory()->for($tournament)->count($teams)->create();

        return $tournament;
    }

    private function generate(Tournament $tournament, array $options = []): void
    {
        $this->actingAs($tournament->organizer)
            ->post(route('tournaments.schedule.store', $tournament), [...$this->options, ...$options])
            ->assertSessionHasNoErrors();
    }

    /**
     * @param  Collection<int, Game>  $games
     */
    private function assertNoTeamPlaysTwiceAtOnce(Collection $games): void
    {
        foreach ($games->groupBy(fn (Game $game) => $game->scheduled_at->toDateTimeString()) as $slot) {
            $teams = $slot->flatMap(fn (Game $game) => array_filter([$game->home_team_id, $game->away_team_id]));
            $this->assertSame($teams->count(), $teams->unique()->count());
        }
    }

    public function test_a_league_with_an_odd_number_of_teams(): void
    {
        $tournament = $this->tournamentWithTeams(TournamentFormat::League, 5);
        Team::factory()->for($tournament)->pending()->create();

        $this->generate($tournament);

        $games = $tournament->games()->get();
        $this->assertCount(10, $games); // Pending teams are left out: 5 teams → 10 games.
        $this->assertSame(5, $games->max('round'));
        $this->assertTrue($games->every(fn (Game $game) => $game->stage === GameStage::League));
        $this->assertSame(TournamentStatus::InProgress, $tournament->fresh()->status);

        // Round 2 is a week after round 1, and every round has one team resting.
        $this->assertSame('2026-11-14 09:00', $games->firstWhere('round', 2)->scheduled_at->format('Y-m-d H:i'));
        foreach ($games->groupBy('round') as $round) {
            $this->assertCount(2, $round);
        }
        $this->assertNoTeamPlaysTwiceAtOnce($games);
    }

    public function test_a_double_round_league_on_a_single_day_with_named_courts(): void
    {
        $tournament = $this->tournamentWithTeams(TournamentFormat::League, 4, ['double_round' => true]);

        $this->generate($tournament, ['days_between_rounds' => 0, 'court_names' => 'Norte, Sur']);

        $games = $tournament->games()->get();
        $this->assertCount(12, $games);
        $this->assertEqualsCanonicalizing(['Norte', 'Sur'], $games->pluck('venue')->unique()->values()->all());
        $this->assertSame('2026-11-07', $games->max('scheduled_at')->format('Y-m-d'));
        $this->assertNoTeamPlaysTwiceAtOnce($games);
    }

    public function test_a_knockout_with_byes_links_every_game_to_the_next(): void
    {
        $tournament = $this->tournamentWithTeams(TournamentFormat::Knockout, 6);

        $this->generate($tournament, ['days_between_rounds' => 0]);

        $games = $tournament->games()->get();
        $byRound = $games->groupBy('round');

        // 6 teams → bracket of 8: 2 first-round games, 2 semifinals, 1 final.
        $this->assertSame([1 => 2, 2 => 2, 3 => 1], $byRound->map->count()->all());
        $this->assertTrue($byRound[1]->every(fn (Game $game) => $game->home_team_id && $game->away_team_id));

        // The two bye teams are already waiting in the semifinals.
        $waiting = $byRound[2]->flatMap(fn (Game $game) => array_filter([$game->home_team_id, $game->away_team_id]));
        $this->assertCount(2, $waiting);

        $final = $byRound[3]->sole();
        $this->assertNull($final->next_game_id);
        foreach ($byRound[1]->merge($byRound[2]) as $game) {
            $this->assertNotNull($game->nextGame);
            $this->assertContains($game->next_slot, ['home', 'away']);
        }

        // Each round starts once the previous one is over.
        $this->assertTrue($byRound[2]->min('scheduled_at')->greaterThan($byRound[1]->max('scheduled_at')));
        $this->assertTrue($final->scheduled_at->greaterThan($byRound[2]->max('scheduled_at')));
    }

    public function test_groups_are_drawn_and_play_a_round_robin_each(): void
    {
        $tournament = $this->tournamentWithTeams(TournamentFormat::GroupsKnockout, 7, [
            'settings' => ['points' => ['win' => 3, 'draw' => 1, 'loss' => 0], 'groups_count' => 2, 'qualifiers_per_group' => 2],
        ]);

        // Groups must be set before generating.
        $this->actingAs($tournament->organizer)
            ->post(route('tournaments.schedule.store', $tournament), $this->options)
            ->assertSessionHasErrors('schedule');

        $this->actingAs($tournament->organizer)->post(route('tournaments.groups.draw', $tournament))->assertSessionHasNoErrors();

        $sizes = $tournament->groups()->withCount('teams')->pluck('teams_count')->sort()->values()->all();
        $this->assertSame([3, 4], $sizes);

        $this->generate($tournament);

        $games = $tournament->games()->get();
        $this->assertCount(3 + 6, $games);
        $this->assertTrue($games->every(fn (Game $game) => $game->stage === GameStage::Group));
        foreach ($games as $game) {
            $this->assertSame($game->homeTeam->group_id, $game->group_id);
            $this->assertSame($game->awayTeam->group_id, $game->group_id);
        }
    }

    public function test_manual_group_assignment(): void
    {
        $tournament = $this->tournamentWithTeams(TournamentFormat::GroupsKnockout, 4, [
            'settings' => ['points' => ['win' => 3, 'draw' => 1, 'loss' => 0], 'groups_count' => 2, 'qualifiers_per_group' => 1],
        ]);
        $this->actingAs($tournament->organizer)->post(route('tournaments.groups.manual', $tournament));
        [$groupA, $groupB] = $tournament->groups()->get();
        [$t1, $t2, $t3, $t4] = $tournament->teams()->orderBy('id')->get();

        $this->actingAs($tournament->organizer)->put(route('tournaments.groups.update', $tournament), [
            'assignments' => [$t1->id => $groupA->id, $t2->id => $groupA->id, $t3->id => $groupB->id, $t4->id => $groupB->id],
        ])->assertSessionHasNoErrors();

        $this->assertSame([$t1->id, $t2->id], $groupA->teams()->orderBy('id')->pluck('id')->all());
        $this->generate($tournament);
        $this->assertCount(2, $tournament->games()->get());
    }

    public function test_the_knockout_stage_is_built_from_the_group_standings(): void
    {
        $tournament = $this->tournamentWithTeams(TournamentFormat::GroupsKnockout, 8, [
            'settings' => ['points' => ['win' => 3, 'draw' => 1, 'loss' => 0], 'groups_count' => 2, 'qualifiers_per_group' => 2],
        ]);
        $this->actingAs($tournament->organizer)->post(route('tournaments.groups.draw', $tournament));
        $this->generate($tournament);

        // Not before the group stage is over.
        $this->actingAs($tournament->organizer)
            ->post(route('tournaments.schedule.knockout', $tournament), $this->options)
            ->assertSessionHasErrors('schedule');

        // In every game the team with the lower id wins, so the standings are predictable.
        foreach ($tournament->games()->get() as $game) {
            $homeWins = $game->home_team_id < $game->away_team_id;
            $game->update(['status' => GameStatus::Finished, 'home_score' => $homeWins ? 1 : 0, 'away_score' => $homeWins ? 0 : 1]);
        }

        $this->actingAs($tournament->organizer)
            ->post(route('tournaments.schedule.knockout', $tournament), $this->options)
            ->assertSessionHasNoErrors();

        $semis = $tournament->games()->where('stage', GameStage::Knockout)->where('round', 1)->get();
        $this->assertCount(2, $semis);
        $this->assertCount(1, $tournament->games()->where('stage', GameStage::Knockout)->where('round', 2)->get());

        $groups = $tournament->groups()->with('teams')->get();
        $place = fn ($group, int $i) => $group->teams->sortBy('id')->values()[$i]->id;

        foreach ($semis as $semi) {
            // A group winner faces the runner-up of the other group.
            $this->assertNotSame(Team::find($semi->home_team_id)->group_id, Team::find($semi->away_team_id)->group_id);
        }
        $this->assertEqualsCanonicalizing(
            [$place($groups[0], 0), $place($groups[0], 1), $place($groups[1], 0), $place($groups[1], 1)],
            $semis->flatMap(fn (Game $game) => [$game->home_team_id, $game->away_team_id])->all(),
        );
    }

    public function test_the_schedule_cannot_be_regenerated_once_a_game_started(): void
    {
        $tournament = $this->tournamentWithTeams(TournamentFormat::League, 4);
        $this->generate($tournament);
        $tournament->games()->first()->update(['status' => GameStatus::Live]);

        $this->actingAs($tournament->organizer)
            ->post(route('tournaments.schedule.store', $tournament), $this->options)
            ->assertSessionHasErrors('schedule');
        $this->assertCount(6, $tournament->games()->get());
    }

    public function test_regenerating_replaces_the_previous_schedule(): void
    {
        $tournament = $this->tournamentWithTeams(TournamentFormat::League, 4);
        $this->generate($tournament);
        $this->generate($tournament, ['days_between_rounds' => 0]);

        $this->assertCount(6, $tournament->games()->get());
    }

    public function test_the_organizer_edits_a_game_time_and_court(): void
    {
        $tournament = $this->tournamentWithTeams(TournamentFormat::League, 2);
        $this->generate($tournament);
        $game = $tournament->games()->sole();

        $this->actingAs($tournament->organizer)->put(route('tournaments.games.update', [$tournament, $game]), [
            'scheduled_at' => '2026-12-01T18:30',
            'venue' => 'Cancha techada',
        ])->assertSessionHasNoErrors();

        $game->refresh();
        $this->assertSame('2026-12-01 18:30', $game->scheduled_at->format('Y-m-d H:i'));
        $this->assertSame('Cancha techada', $game->venue);
    }

    public function test_scorers_see_the_schedule_but_cannot_change_it(): void
    {
        $tournament = $this->tournamentWithTeams(TournamentFormat::League, 4);
        $scorer = User::factory()->create();
        $tournament->scorers()->attach($scorer);

        $this->actingAs($scorer)->get(route('tournaments.schedule.show', $tournament))->assertOk();
        $this->actingAs($scorer)->post(route('tournaments.schedule.store', $tournament), $this->options)->assertForbidden();
        $this->actingAs(User::factory()->create())->get(route('tournaments.schedule.show', $tournament))->assertForbidden();
    }

    public function test_the_schedule_page_lists_rounds_with_resting_teams(): void
    {
        $tournament = $this->tournamentWithTeams(TournamentFormat::League, 3);
        $this->generate($tournament);

        $this->actingAs($tournament->organizer)->get(route('tournaments.schedule.show', $tournament))
            ->assertInertia(fn ($page) => $page
                ->component('tournaments/schedule')
                ->has('stages', 1)
                ->has('stages.0.rounds', 3)
                ->where('stages.0.rounds.0.label', 'Jornada 1')
                ->has('stages.0.rounds.0.games', 1)
                ->has('stages.0.rounds.0.resting', 1));
    }
}
