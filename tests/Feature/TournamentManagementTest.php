<?php

namespace Tests\Feature;

use App\Enums\Sport;
use App\Enums\Tiebreaker;
use App\Enums\TournamentFormat;
use App\Models\Game;
use App\Models\Tournament;
use App\Models\User;
use Database\Seeders\RuleTemplateSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TournamentManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RuleTemplateSeeder::class);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return [
            'name' => 'Liga Colonia 2026',
            'sport' => 'football',
            'variant' => 'f7',
            'description' => '',
            'start_date' => '2026-11-15',
            'location' => 'Cancha municipal',
            'format' => 'league',
            'status' => 'draft',
            'double_round' => false,
            'public_registration' => false,
            'max_teams' => '',
            'points' => ['win' => 3, 'draw' => 1, 'loss' => 0],
            'best_of' => 3,
            'groups_count' => 2,
            'qualifiers_per_group' => 2,
            'tiebreakers' => Tiebreaker::defaultOrder(),
            ...$overrides,
        ];
    }

    public function test_a_user_creates_a_tournament_with_the_suggested_rules(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('tournaments.store'), $this->payload())
            ->assertRedirect();

        $tournament = Tournament::sole();
        $this->assertSame($user->id, $tournament->user_id);
        $this->assertSame('liga-colonia-2026', $tournament->slug);
        $this->assertSame(['points' => ['win' => 3, 'draw' => 1, 'loss' => 0]], $tournament->settings);

        // Generic football rules plus the ones of the Fútbol 7 variant.
        $rules = $tournament->rules()->get();
        $this->assertCount(6, $rules);
        $this->assertTrue($rules->every->is_active);
        $this->assertSame('25', $rules->firstWhere('template_key', 'half_duration')->value);
    }

    public function test_volleyball_uses_sets_settings_and_syncs_the_best_of_rule(): void
    {
        $this->actingAs(User::factory()->create())->post(route('tournaments.store'), $this->payload([
            'sport' => 'volleyball',
            'variant' => null,
            'best_of' => 5,
            'points' => ['win' => 3, 'win_close' => 2, 'loss_close' => 1, 'loss' => 0],
        ]))->assertSessionHasNoErrors();

        $tournament = Tournament::sole();
        $this->assertSame(5, $tournament->settings['best_of']);
        $this->assertNull($tournament->variant);
        $this->assertSame('5', $tournament->rules()->where('template_key', 'best_of')->value('value'));
    }

    public function test_points_are_validated_for_the_chosen_sport(): void
    {
        $this->actingAs(User::factory()->create())->post(route('tournaments.store'), $this->payload([
            'sport' => 'volleyball',
            'variant' => null,
            'points' => ['win' => 3],
        ]))->assertSessionHasErrors(['points.win_close', 'points.loss_close', 'points.loss']);
    }

    public function test_slugs_are_unique(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->post(route('tournaments.store'), $this->payload());
        $this->actingAs($user)->post(route('tournaments.store'), $this->payload());

        $this->assertSame(['liga-colonia-2026', 'liga-colonia-2026-2'], Tournament::orderBy('id')->pluck('slug')->all());
    }

    public function test_only_the_organizer_can_edit(): void
    {
        $tournament = Tournament::factory()->create();
        $scorer = User::factory()->create();
        $tournament->scorers()->attach($scorer);
        $stranger = User::factory()->create();

        $this->actingAs($stranger)->get(route('tournaments.show', $tournament))->assertForbidden();
        $this->actingAs($stranger)->get(route('tournaments.edit', $tournament))->assertForbidden();
        $this->actingAs($stranger)->put(route('tournaments.update', $tournament), $this->payload(['slug' => 'x']))->assertForbidden();

        $this->actingAs($scorer)->get(route('tournaments.show', $tournament))->assertOk();
        $this->actingAs($scorer)->get(route('tournaments.edit', $tournament))->assertForbidden();

        $this->actingAs($tournament->organizer)->get(route('tournaments.edit', $tournament))->assertOk();
    }

    public function test_changing_the_variant_reloads_suggested_rules_and_keeps_custom_ones(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->post(route('tournaments.store'), $this->payload());
        $tournament = Tournament::sole();
        $tournament->rules()->create(['text' => 'Se juega con balón número 5', 'sort_order' => 99]);

        $this->actingAs($user)->put(route('tournaments.update', $tournament), $this->payload([
            'variant' => 'f11',
            'slug' => $tournament->slug,
        ]))->assertSessionHasNoErrors();

        $rules = $tournament->rules()->get();
        $this->assertSame('45', $rules->firstWhere('template_key', 'half_duration')->value);
        $this->assertTrue($rules->contains('text', 'Se juega con balón número 5'));
        $this->assertCount(7, $rules);
    }

    public function test_the_format_is_locked_once_the_schedule_exists(): void
    {
        $tournament = Tournament::factory()->format(TournamentFormat::League)->sport(Sport::Football)->create();
        Game::factory()->for($tournament)->create();

        $this->actingAs($tournament->organizer)->put(route('tournaments.update', $tournament), $this->payload([
            'format' => 'knockout',
            'slug' => $tournament->slug,
        ]))->assertSessionHasErrors('format');

        // Other settings can still change.
        $this->actingAs($tournament->organizer)->put(route('tournaments.update', $tournament), $this->payload([
            'name' => 'Nuevo nombre',
            'slug' => $tournament->slug,
        ]))->assertSessionHasNoErrors();
        $this->assertSame('Nuevo nombre', $tournament->fresh()->name);
    }

    public function test_the_organizer_deletes_a_tournament(): void
    {
        $tournament = Tournament::factory()->create();

        $this->actingAs($tournament->organizer)->delete(route('tournaments.destroy', $tournament))
            ->assertRedirect(route('dashboard'));

        $this->assertModelMissing($tournament);
    }

    public function test_the_dashboard_lists_organized_and_scored_tournaments(): void
    {
        $user = User::factory()->create();
        Tournament::factory()->for($user, 'organizer')->create(['name' => 'Mío']);
        Tournament::factory()->create(['name' => 'Ajeno'])->scorers()->attach($user);
        Tournament::factory()->create(['name' => 'Otro']);

        $this->actingAs($user)->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->has('organized', 1)
            ->where('organized.0.name', 'Mío')
            ->has('scoring', 1)
            ->where('scoring.0.name', 'Ajeno'));
    }
}
