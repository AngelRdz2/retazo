<?php

namespace Tests\Feature;

use App\Enums\TeamStatus;
use App\Enums\TournamentStatus;
use App\Models\Game;
use App\Models\Team;
use App\Models\Tournament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TeamManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_organizer_adds_an_approved_team_with_a_logo(): void
    {
        Storage::fake('public');
        $tournament = Tournament::factory()->create();

        $this->actingAs($tournament->organizer)->post(route('tournaments.teams.store', $tournament), [
            'name' => 'Halcones',
            'color' => '#0058F8',
            'contact_name' => 'Ana',
            'logo' => UploadedFile::fake()->image('logo.png'),
        ])->assertSessionHasNoErrors();

        $team = $tournament->teams()->sole();
        $this->assertSame(TeamStatus::Approved, $team->status);
        Storage::disk('public')->assertExists($team->logo_path);
    }

    public function test_team_names_are_unique_within_a_tournament(): void
    {
        $tournament = Tournament::factory()->create();
        Team::factory()->for($tournament)->create(['name' => 'Halcones']);
        Team::factory()->create(['name' => 'Tigres']);

        $this->actingAs($tournament->organizer)
            ->post(route('tournaments.teams.store', $tournament), ['name' => 'Halcones'])
            ->assertSessionHasErrors('name');

        // The same name is fine in another tournament.
        $this->actingAs($tournament->organizer)
            ->post(route('tournaments.teams.store', $tournament), ['name' => 'Tigres'])
            ->assertSessionHasNoErrors();
    }

    public function test_the_max_teams_limit_is_enforced(): void
    {
        $tournament = Tournament::factory()->create(['max_teams' => 2]);
        Team::factory()->for($tournament)->count(2)->create();
        $pending = Team::factory()->for($tournament)->pending()->create();

        $this->actingAs($tournament->organizer)
            ->post(route('tournaments.teams.store', $tournament), ['name' => 'Tercero'])
            ->assertSessionHasErrors('name');

        $this->actingAs($tournament->organizer)
            ->post(route('tournaments.teams.approve', [$tournament, $pending]))
            ->assertSessionHasErrors('name');
        $this->assertSame(TeamStatus::Pending, $pending->fresh()->status);
    }

    public function test_guests_register_pending_teams_through_the_public_link(): void
    {
        $tournament = Tournament::factory()->status(TournamentStatus::RegistrationOpen)->create(['public_registration' => true]);

        $this->get(route('public.registration.create', $tournament))->assertOk();
        $this->post(route('public.registration.store', $tournament), [
            'name' => 'Leones',
            'contact_name' => 'Luis',
            'color' => '#16A34A',
        ])->assertSessionHasNoErrors();

        $team = $tournament->teams()->sole();
        $this->assertSame(TeamStatus::Pending, $team->status);

        $this->actingAs($tournament->organizer)
            ->post(route('tournaments.teams.approve', [$tournament, $team]))
            ->assertSessionHasNoErrors();
        $this->assertSame(TeamStatus::Approved, $team->fresh()->status);
    }

    public function test_public_registration_is_rejected_when_closed(): void
    {
        $tournament = Tournament::factory()->status(TournamentStatus::InProgress)->create(['public_registration' => true]);

        $this->post(route('public.registration.store', $tournament), ['name' => 'Leones', 'contact_name' => 'Luis'])
            ->assertSessionHasErrors('name');
        $this->assertSame(0, $tournament->teams()->count());

        $disabled = Tournament::factory()->status(TournamentStatus::RegistrationOpen)->create(['public_registration' => false]);
        $this->get(route('public.registration.create', $disabled))->assertNotFound();
    }

    public function test_a_team_with_games_cannot_be_deleted(): void
    {
        $tournament = Tournament::factory()->create();
        [$home, $away] = Team::factory()->for($tournament)->count(2)->create();
        Game::factory()->for($tournament)->create(['home_team_id' => $home->id, 'away_team_id' => $away->id]);
        $free = Team::factory()->for($tournament)->create();

        $this->actingAs($tournament->organizer)
            ->delete(route('tournaments.teams.destroy', [$tournament, $home]))
            ->assertSessionHasErrors('team');
        $this->assertModelExists($home);

        $this->actingAs($tournament->organizer)
            ->delete(route('tournaments.teams.destroy', [$tournament, $free]))
            ->assertSessionHasNoErrors();
        $this->assertModelMissing($free);
    }

    public function test_teams_of_another_tournament_cannot_be_touched(): void
    {
        $tournament = Tournament::factory()->create();
        $foreign = Team::factory()->create();

        $this->actingAs($tournament->organizer)
            ->delete(route('tournaments.teams.destroy', [$tournament, $foreign]))
            ->assertNotFound();
    }
}
