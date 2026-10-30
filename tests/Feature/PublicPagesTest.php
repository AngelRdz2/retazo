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
use App\Services\Scheduling\GroupStage;
use App\Services\Scheduling\ScheduleGenerator;
use App\Services\Scheduling\ScheduleOptions;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicPagesTest extends TestCase
{
    use RefreshDatabase;

    private function schedule(Tournament $tournament): void
    {
        app(ScheduleGenerator::class)->generate($tournament, new ScheduleOptions(CarbonImmutable::parse('2026-11-07 09:00')));
    }

    public function test_the_tournament_list_shows_published_tournaments_and_filters_them(): void
    {
        Tournament::factory()->create(['name' => 'Borrador secreto']);
        Tournament::factory()->sport(Sport::Football)->status(TournamentStatus::InProgress)->create(['name' => 'Liga Colonia']);
        Tournament::factory()->sport(Sport::Volleyball)->status(TournamentStatus::Finished)->create(['name' => 'Copa Vóley']);
        Tournament::factory()->sport(Sport::Basketball)->status(TournamentStatus::RegistrationOpen)->create(['name' => 'Liga Básquet']);

        Team::factory()->for(Tournament::where('name', 'Liga Colonia')->sole())->count(6)->create();

        $this->get(route('public.tournaments.index'))->assertInertia(fn ($page) => $page
            ->component('public/tournaments')
            ->has('tournaments.data', 3)
            ->where('tournaments.data.0.name', 'Liga Colonia') // In progress first.
            ->has('tournaments.data.0.teams', 4) // A few crests per card...
            ->where('tournaments.data.0.teams_count', 6)); // ...and the real total.

        $this->get(route('public.tournaments.index', ['deporte' => 'volleyball']))
            ->assertInertia(fn ($page) => $page->has('tournaments.data', 1)->where('tournaments.data.0.name', 'Copa Vóley'));

        $this->get(route('public.tournaments.index', ['estado' => 'registration_open']))
            ->assertInertia(fn ($page) => $page->has('tournaments.data', 1)->where('tournaments.data.0.name', 'Liga Básquet'));

        $this->get(route('public.tournaments.index', ['q' => 'liga']))
            ->assertInertia(fn ($page) => $page->has('tournaments.data', 2));
    }

    public function test_a_league_page_has_games_and_a_standings_table_with_the_sport_columns(): void
    {
        $tournament = Tournament::factory()->sport(Sport::Basketball)->status(TournamentStatus::InProgress)->create();
        Team::factory()->for($tournament)->count(4)->create();
        $this->schedule($tournament);

        $game = $tournament->games()->first();
        $game->update(['status' => GameStatus::Finished, 'home_score' => 80, 'away_score' => 70, 'winner_team_id' => $game->home_team_id]);
        $tournament->games()->whereKeyNot($game->id)->first()->update(['status' => GameStatus::Live, 'home_score' => 10, 'away_score' => 12]);

        $this->get(route('public.tournaments.show', $tournament))->assertInertia(fn ($page) => $page
            ->component('public/tournament')
            ->has('games', 6)
            ->where('columns', ['played' => 'PJ', 'won' => 'G', 'lost' => 'P', 'for' => 'PF', 'against' => 'PC', 'difference' => 'DP', 'points' => 'Pts'])
            ->has('standings', 1)
            ->has('standings.0.rows', 4)
            ->where('standings.0.rows.0.team.id', $game->home_team_id)
            ->where('standings.0.rows.0.points', 2)
            ->where('standings.0.rows.0.difference', 10)
            ->where('bracket', null)
            ->where('qualifiers', null));
    }

    public function test_a_groups_tournament_shows_one_table_per_group_and_its_bracket_later(): void
    {
        $tournament = Tournament::factory()->format(TournamentFormat::GroupsKnockout)->status(TournamentStatus::InProgress)->create([
            'settings' => ['points' => ['win' => 3, 'draw' => 1, 'loss' => 0], 'groups_count' => 2, 'qualifiers_per_group' => 2],
        ]);
        Team::factory()->for($tournament)->count(8)->create();
        app(GroupStage::class)->draw($tournament);
        $this->schedule($tournament);

        $this->get(route('public.tournaments.show', $tournament))->assertInertia(fn ($page) => $page
            ->has('standings', 2)
            ->where('standings.0.title', 'Grupo A')
            ->has('standings.0.rows', 4)
            ->where('qualifiers', 2)
            ->has('groups', 2)
            ->where('bracket', null));

        $tournament->games()->update(['status' => GameStatus::Finished, 'home_score' => 1, 'away_score' => 0]);
        app(ScheduleGenerator::class)->generateKnockoutFromGroups($tournament, new ScheduleOptions(CarbonImmutable::parse('2026-11-14 09:00')));

        $this->get(route('public.tournaments.show', $tournament))->assertInertia(fn ($page) => $page
            ->where('bracket.size', 4)
            ->has('bracket.rounds', 2)
            ->where('bracket.rounds.0.label', 'Semifinal')
            ->has('bracket.rounds.0.games', 2)
            ->where('bracket.rounds.1.label', 'Final'));
    }

    public function test_a_knockout_bracket_keeps_bye_slots_out_of_the_first_round(): void
    {
        $tournament = Tournament::factory()->format(TournamentFormat::Knockout)->status(TournamentStatus::InProgress)->create();
        Team::factory()->for($tournament)->count(5)->create();
        $this->schedule($tournament);

        $this->get(route('public.tournaments.show', $tournament))->assertInertia(fn ($page) => $page
            ->where('standings', [])
            ->where('bracket.size', 8)
            ->has('bracket.rounds', 3)
            ->has('bracket.rounds.0.games', 1) // 5 teams: one first-round game, three byes.
            ->has('bracket.rounds.1.games', 2)
            ->where('bracket.rounds.2.label', 'Final'));

        $this->assertSame(1, $tournament->games()->where('stage', GameStage::Knockout)->where('round', 1)->count());
    }

    public function test_shared_links_get_open_graph_tags(): void
    {
        $tournament = Tournament::factory()->status(TournamentStatus::InProgress)->create([
            'name' => 'Liga Colonia 2026',
            'description' => 'El torneo del barrio',
            'start_date' => '2026-11-07',
        ]);
        Team::factory()->for($tournament)->count(3)->create();

        $this->get(route('public.tournaments.show', $tournament))
            ->assertOk()
            ->assertSee('<title>Liga Colonia 2026 · Retazo</title>', false)
            ->assertSee('<meta property="og:title" content="Liga Colonia 2026 · Retazo">', false)
            ->assertSee('El torneo del barrio — Fútbol 7 · Todos contra todos (liga) · 3 equipos · inicia el 7 de noviembre', false)
            ->assertSee(route('public.tournaments.show', $tournament), false)
            ->assertSee('images/og-image.png', false);

        $this->get(route('home'))->assertSee('<meta property="og:title" content="Retazo · Torneos deportivos amateur">', false);
    }

    public function test_the_home_page_shows_live_and_upcoming_games_results_and_crests(): void
    {
        $tournament = Tournament::factory()->status(TournamentStatus::InProgress)->create();
        Team::factory()->for($tournament)->count(4)->create();
        $this->schedule($tournament);
        [$live, $finished] = $tournament->games()->orderBy('id')->take(2)->get();
        $live->update(['status' => GameStatus::Live]);
        $finished->update(['status' => GameStatus::Finished, 'home_score' => 2, 'away_score' => 1, 'finished_at' => now()]);

        $draft = Tournament::factory()->create();
        Team::factory()->for($draft)->count(2)->create();
        $this->schedule($draft);
        $draft->update(['status' => TournamentStatus::Draft]);

        $this->get(route('home'))->assertInertia(fn ($page) => $page
            ->component('welcome')
            ->has('upcoming', 5)
            ->where('upcoming.0.id', $live->id) // Live games first.
            ->where('upcoming.0.tournament.slug', $tournament->slug)
            ->has('results', 1)
            ->where('results.0.home_score', 2)
            ->has('crests', 4)
            ->where('stats.games', 1)
            ->where('images', ['stadium' => null, 'player' => null, 'trophy' => null]));
    }

    public function test_the_requested_tab_is_passed_to_the_page(): void
    {
        $tournament = Tournament::factory()->status(TournamentStatus::InProgress)->create();

        $this->get(route('public.tournaments.show', [$tournament, 'tab' => 'tabla']))
            ->assertInertia(fn ($page) => $page->where('tab', 'tabla'));
    }

    public function test_drafts_and_unknown_slugs_are_not_found(): void
    {
        $draft = Tournament::factory()->create();
        Game::factory()->for($draft)->create();

        $this->get(route('public.tournaments.show', $draft))->assertNotFound();
        $this->get('/t/no-existe')->assertNotFound();
    }
}
