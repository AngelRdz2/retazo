<?php

namespace Tests\Feature\Auth;

use App\Models\Game;
use App\Models\Team;
use App\Models\Tournament;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IntendedRedirectTest extends TestCase
{
    use RefreshDatabase;

    private function game(): Game
    {
        $tournament = Tournament::factory()->create();
        [$home, $away] = Team::factory()->for($tournament)->count(2)->create();

        return Game::factory()->for($tournament)->create(['home_team_id' => $home->id, 'away_team_id' => $away->id]);
    }

    public function test_a_scorer_goes_back_to_the_scoring_page_after_logging_in(): void
    {
        $game = $this->game();
        $scorer = User::factory()->create();
        $game->tournament->scorers()->attach($scorer);

        $this->get(route('games.score', $game))->assertRedirect(route('login'));

        $this->post(route('login.store'), ['email' => $scorer->email, 'password' => 'password'])
            ->assertRedirect(route('games.score', $game));
    }

    public function test_another_account_lands_on_its_panel_instead_of_a_forbidden_page(): void
    {
        $game = $this->game();
        $stranger = User::factory()->create();

        $this->get(route('games.score', $game))->assertRedirect(route('login'));

        $this->post(route('login.store'), ['email' => $stranger->email, 'password' => 'password'])
            ->assertRedirect(route('dashboard', absolute: false))
            ->assertSessionHas('inertia.flash_data.toast.type', 'info');
    }

    public function test_a_new_account_lands_on_its_panel_instead_of_a_forbidden_page(): void
    {
        $game = $this->game();

        $this->get(route('tournaments.show', $game->tournament))->assertRedirect(route('login'));

        $this->post(route('register.store'), [
            'name' => 'Nueva',
            'email' => 'nueva@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_pages_without_permission_checks_are_kept(): void
    {
        $user = User::factory()->create();

        $this->get(route('tournaments.create'))->assertRedirect(route('login'));

        $this->post(route('login.store'), ['email' => $user->email, 'password' => 'password'])
            ->assertRedirect(route('tournaments.create'));
    }
}
