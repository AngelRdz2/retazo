<?php

namespace Tests\Feature;

use App\Enums\GameStage;
use App\Enums\GameStatus;
use App\Enums\Sport;
use App\Enums\TournamentFormat;
use App\Enums\TournamentStatus;
use App\Models\Game;
use App\Models\Team;
use App\Models\Tournament;
use App\Models\User;
use App\Services\Scheduling\ScheduleGenerator;
use App\Services\Scheduling\ScheduleOptions;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class GameScoringTest extends TestCase
{
    use RefreshDatabase;

    private function game(Sport $sport = Sport::Football, array $tournament = []): Game
    {
        $tournament = Tournament::factory()->sport($sport)->status(TournamentStatus::InProgress)->create($tournament);
        [$home, $away] = Team::factory()->for($tournament)->count(2)->create();

        return Game::factory()->for($tournament)->create(['home_team_id' => $home->id, 'away_team_id' => $away->id]);
    }

    /**
     * Knockout of 4 teams: two semifinals feeding the final.
     */
    private function knockout(Sport $sport = Sport::Football): Tournament
    {
        $tournament = Tournament::factory()->sport($sport)->format(TournamentFormat::Knockout)->create();
        Team::factory()->for($tournament)->count(4)->create();
        app(ScheduleGenerator::class)->generate($tournament, new ScheduleOptions(CarbonImmutable::parse('2026-11-07 09:00')));

        return $tournament;
    }

    private function act(Game $game, string $action, array $data = []): TestResponse
    {
        return $this->actingAs($game->tournament->organizer)->post(route("games.{$action}", $game), $data);
    }

    private function score(Game $game, string $side, int $times = 1, int $delta = 1): void
    {
        for ($i = 0; $i < $times; $i++) {
            $this->act($game, 'adjust', ['side' => $side, 'delta' => $delta])->assertSessionHasNoErrors();
        }
    }

    public function test_a_football_game_from_kickoff_to_final_whistle(): void
    {
        $game = $this->game();

        $this->act($game, 'adjust', ['side' => 'home', 'delta' => 1])->assertSessionHasErrors('game'); // Not started yet.
        $this->act($game, 'start')->assertSessionHasNoErrors();
        $this->assertSame(GameStatus::Live, $game->fresh()->status);

        $this->score($game, 'home', 2);
        $this->score($game, 'away');
        $this->score($game, 'away', delta: -1);
        $this->score($game, 'away', delta: -1); // Never below zero.
        $this->act($game, 'adjust', ['side' => 'home', 'delta' => 3])->assertSessionHasErrors('game'); // Football counts one by one.

        $this->act($game, 'finish')->assertSessionHasNoErrors();

        $game->refresh();
        $this->assertSame([2, 0], [$game->home_score, $game->away_score]);
        $this->assertSame(GameStatus::Finished, $game->status);
        $this->assertSame($game->home_team_id, $game->winner_team_id);
        $this->assertNotNull($game->finished_at);
        // It was the only game: the tournament is over.
        $this->assertSame(TournamentStatus::Finished, $game->tournament->fresh()->status);

        $this->act($game, 'adjust', ['side' => 'home', 'delta' => 1])->assertSessionHasErrors('game');
    }

    public function test_league_football_games_can_end_in_a_draw(): void
    {
        $game = $this->game();
        $this->act($game, 'start');
        $this->score($game, 'home');
        $this->score($game, 'away');

        $this->act($game, 'finish')->assertSessionHasNoErrors();
        $this->assertNull($game->fresh()->winner_team_id);
    }

    public function test_a_game_cannot_start_until_both_teams_are_known(): void
    {
        $tournament = $this->knockout();
        $final = $tournament->games()->where('round', 2)->sole();

        $this->act($final, 'start')->assertSessionHasErrors('game');
        $this->assertSame(GameStatus::Scheduled, $final->fresh()->status);
    }

    public function test_basketball_counts_baskets_and_goes_to_overtime_when_tied(): void
    {
        $game = $this->game(Sport::Basketball);
        $this->act($game, 'start');
        $this->score($game, 'home', delta: 3);
        $this->score($game, 'away', delta: 2);
        $this->score($game, 'away');

        $this->act($game, 'finish')->assertSessionHasErrors('game');
        $this->assertSame(GameStatus::Live, $game->fresh()->status);

        // Overtime: points keep adding to the same score.
        $this->score($game, 'away', delta: 2);
        $this->act($game, 'finish')->assertSessionHasNoErrors();

        $game->refresh();
        $this->assertSame([3, 5], [$game->home_score, $game->away_score]);
        $this->assertSame($game->away_team_id, $game->winner_team_id);
    }

    public function test_volleyball_is_scored_set_by_set_and_ends_with_the_sets_needed(): void
    {
        $game = $this->game(Sport::Volleyball); // Best of 3.
        $this->act($game, 'start');
        $this->assertSame([['home' => 0, 'away' => 0]], $game->fresh()->sets);

        $this->score($game, 'home', 3);
        $this->score($game, 'away', 3);
        $this->act($game, 'close-set')->assertSessionHasErrors('game'); // A set can't end tied.

        $this->score($game, 'home', 2);
        $this->act($game, 'close-set')->assertSessionHasNoErrors();
        $game->refresh();
        $this->assertSame([1, 0], [$game->home_score, $game->away_score]);
        $this->assertSame([['home' => 5, 'away' => 3], ['home' => 0, 'away' => 0]], $game->sets);

        // Closing a set by mistake can be undone while the new one is 0-0.
        $this->act($game, 'undo-set')->assertSessionHasNoErrors();
        $this->assertSame([0, 0], [$game->fresh()->home_score, $game->fresh()->away_score]);
        $this->act($game, 'close-set');

        $this->score($game, 'away', 2);
        $this->act($game, 'close-set');
        $this->score($game, 'home', 4);
        $this->act($game, 'close-set')->assertSessionHasNoErrors();

        $game->refresh();
        $this->assertSame(GameStatus::Finished, $game->status);
        $this->assertSame([2, 1], [$game->home_score, $game->away_score]);
        $this->assertSame($game->home_team_id, $game->winner_team_id);
        $this->assertCount(3, $game->sets);

        // There is no "finish" button in volleyball.
        $other = $this->game(Sport::Volleyball);
        $this->act($other, 'start');
        $this->act($other, 'finish')->assertSessionHasErrors('game');
    }

    public function test_reopening_a_volleyball_game_reopens_its_last_set(): void
    {
        $game = $this->game(Sport::Volleyball);
        $this->act($game, 'start');
        foreach ([1, 2] as $set) {
            $this->score($game, 'home');
            $this->act($game, 'close-set');
        }
        $this->assertSame(GameStatus::Finished, $game->fresh()->status);

        $this->act($game, 'reopen')->assertSessionHasNoErrors();

        $game->refresh();
        $this->assertSame(GameStatus::Live, $game->status);
        $this->assertSame([1, 0], [$game->home_score, $game->away_score]);
        $this->assertNull($game->winner_team_id);
        $this->assertSame(TournamentStatus::InProgress, $game->tournament->fresh()->status);
    }

    public function test_knockout_winners_advance_to_their_slot_in_the_next_round(): void
    {
        $tournament = $this->knockout();
        [$semiA, $semiB] = $tournament->games()->where('round', 1)->orderBy('bracket_position')->get();
        $final = $tournament->games()->where('round', 2)->sole();

        $this->act($semiA, 'start');
        $this->score($semiA, 'away');
        $this->act($semiA, 'finish');

        $this->act($semiB, 'start');
        $this->score($semiB, 'home', 2);
        $this->act($semiB, 'finish');

        $final->refresh();
        $this->assertSame($semiA->away_team_id, $final->home_team_id); // Top semifinal → home.
        $this->assertSame($semiB->home_team_id, $final->away_team_id);
        $this->assertSame(TournamentStatus::InProgress, $tournament->fresh()->status);

        $this->act($final, 'start');
        $this->score($final, 'home');
        $this->act($final, 'finish');

        $this->assertSame(TournamentStatus::Finished, $tournament->fresh()->status);
        $this->assertSame($semiA->away_team_id, $final->fresh()->winner_team_id);
    }

    public function test_a_tied_football_knockout_game_is_decided_on_penalties(): void
    {
        $tournament = $this->knockout();
        $semi = $tournament->games()->where('round', 1)->orderBy('bracket_position')->first();
        $this->act($semi, 'start');
        $this->score($semi, 'home');
        $this->score($semi, 'away');

        $this->act($semi, 'finish')->assertSessionHasErrors('penalties');
        $this->act($semi, 'finish', ['home_penalties' => 4, 'away_penalties' => 4])->assertSessionHasErrors('penalties');
        $this->act($semi, 'finish', ['home_penalties' => 3, 'away_penalties' => 5])->assertSessionHasNoErrors();

        $semi->refresh();
        $this->assertSame([3, 5], [$semi->home_penalties, $semi->away_penalties]);
        $this->assertSame($semi->away_team_id, $semi->winner_team_id);
        $this->assertSame($semi->away_team_id, $tournament->games()->where('round', 2)->sole()->home_team_id);
    }

    public function test_basketball_knockout_ties_go_to_overtime_not_penalties(): void
    {
        $tournament = $this->knockout(Sport::Basketball);
        $semi = $tournament->games()->where('round', 1)->first();
        $this->act($semi, 'start');

        $this->act($semi, 'finish', ['home_penalties' => 3, 'away_penalties' => 1])->assertSessionHasErrors('game');
        $this->assertSame(GameStatus::Live, $semi->fresh()->status);
    }

    public function test_reopening_a_knockout_game_takes_the_winner_out_of_the_next_round(): void
    {
        $tournament = $this->knockout();
        [$semiA, $semiB] = $tournament->games()->where('round', 1)->orderBy('bracket_position')->get();
        $final = $tournament->games()->where('round', 2)->sole();

        foreach ([$semiA, $semiB] as $semi) {
            $this->act($semi, 'start');
            $this->score($semi, 'home');
            $this->act($semi, 'finish');
        }

        $this->act($semiA, 'reopen')->assertSessionHasNoErrors();
        $this->assertNull($final->fresh()->home_team_id);
        $this->assertSame($semiB->home_team_id, $final->fresh()->away_team_id);

        // Once the final starts, the semifinals can no longer be reopened.
        $this->act($semiA, 'finish');
        $this->act($final, 'start');
        $this->act($semiB, 'reopen')->assertSessionHasErrors('game');
        $this->assertSame(GameStatus::Finished, $semiB->fresh()->status);
    }

    public function test_only_the_organizer_and_scorers_can_score(): void
    {
        $game = $this->game();
        $scorer = User::factory()->create();
        $game->tournament->scorers()->attach($scorer);

        $this->get(route('games.score', $game))->assertRedirect(route('login'));
        $this->actingAs(User::factory()->create())->post(route('games.start', $game))->assertForbidden();

        $this->actingAs($scorer)->get(route('games.score', $game))
            ->assertInertia(fn ($page) => $page->component('games/score')->where('game.id', $game->id));
        $this->actingAs($scorer)->post(route('games.start', $game))->assertSessionHasNoErrors();
        $this->assertSame(GameStatus::Live, $game->fresh()->status);
    }

    public function test_finished_group_games_unlock_the_knockout_stage(): void
    {
        $tournament = Tournament::factory()->format(TournamentFormat::GroupsKnockout)->create([
            'settings' => ['points' => ['win' => 3, 'draw' => 1, 'loss' => 0], 'groups_count' => 2, 'qualifiers_per_group' => 1],
        ]);
        Team::factory()->for($tournament)->count(4)->create();
        $this->actingAs($tournament->organizer)->post(route('tournaments.groups.draw', $tournament));
        app(ScheduleGenerator::class)->generate($tournament, new ScheduleOptions(CarbonImmutable::parse('2026-11-07 09:00')));

        foreach ($tournament->games()->get() as $game) {
            $this->act($game, 'start');
            $this->score($game, 'home');
            $this->act($game, 'finish');
        }

        // Every group game is over, but the tournament waits for its knockout stage.
        $this->assertSame(TournamentStatus::InProgress, $tournament->fresh()->status);
        $this->actingAs($tournament->organizer)->get(route('tournaments.schedule.show', $tournament))
            ->assertInertia(fn ($page) => $page->where('canGenerateKnockout', true));
        $this->assertFalse($tournament->games()->where('stage', GameStage::Knockout)->exists());
    }
}
