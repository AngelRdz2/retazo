<?php

namespace Tests\Feature;

use App\Enums\GameStage;
use App\Enums\GameStatus;
use App\Enums\TournamentStatus;
use App\Models\Tournament;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_demo_seeder_creates_one_playable_tournament_per_sport(): void
    {
        $this->seed(DatabaseSeeder::class);

        $organizer = User::where('email', 'demo@retazo.test')->sole();
        $scorer = User::where('email', 'anotador@retazo.test')->sole();
        $this->assertSame(3, $organizer->tournaments()->count());

        // Fútbol 7 league: 3 match days played and a game live today.
        $league = Tournament::where('slug', 'liga-colonia-2026')->sole();
        $this->assertSame(TournamentStatus::InProgress, $league->status);
        $this->assertSame(9, $league->games()->where('status', GameStatus::Finished)->count());
        $this->assertSame(1, $league->games()->where('status', GameStatus::Live)->count());
        $this->assertTrue($league->isScorer($scorer));
        $this->assertSame(6, $league->rules()->count());

        // Volleyball: groups and semifinals played, final waiting with both teams.
        $cup = Tournament::where('slug', 'copa-voley-primavera')->sole();
        $this->assertSame(TournamentStatus::InProgress, $cup->status);
        $this->assertFalse($cup->games()->where('stage', GameStage::Group)->whereNot('status', GameStatus::Finished)->exists());
        $final = $cup->games()->where('stage', GameStage::Knockout)->where('round', 2)->sole();
        $this->assertSame(GameStatus::Scheduled, $final->status);
        $this->assertNotNull($final->home_team_id);
        $this->assertNotNull($final->away_team_id);
        $this->assertTrue($cup->games()->where('stage', GameStage::Group)->get()->every(fn ($game) => count($game->sets) >= 2));

        // Basketball: finished knockout with a champion.
        $knockout = Tournament::where('slug', 'relampago-basquet')->sole();
        $this->assertSame(TournamentStatus::Finished, $knockout->status);
        $this->assertNotNull($knockout->games()->whereNull('next_game_id')->sole()->winner_team_id);

        foreach ([$league, $cup, $knockout] as $tournament) {
            $this->get(route('public.tournaments.show', $tournament))->assertOk();
        }
    }

    public function test_the_demo_seeder_can_run_again(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(DatabaseSeeder::class);

        $this->assertSame(3, Tournament::count());
    }
}
