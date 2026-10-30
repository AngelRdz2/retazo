<?php

namespace Tests\Feature;

use App\Enums\TournamentStatus;
use App\Models\Tournament;
use App\Models\User;
use App\Services\TournamentRules;
use Database\Seeders\RuleTemplateSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RulesAndScorersTest extends TestCase
{
    use RefreshDatabase;

    private function tournamentWithRules(): Tournament
    {
        $this->seed(RuleTemplateSeeder::class);
        $tournament = Tournament::factory()->status(TournamentStatus::InProgress)->create();
        app(TournamentRules::class)->loadTemplates($tournament);

        return $tournament;
    }

    public function test_the_organizer_toggles_edits_and_adds_rules(): void
    {
        $tournament = $this->tournamentWithRules();
        $tolerance = $tournament->rules()->where('template_key', 'tolerance')->sole();
        $redCard = $tournament->rules()->where('template_key', 'red_card')->sole();

        $this->actingAs($tournament->organizer)->put(route('tournaments.rules.update', $tournament), [
            'rules' => [
                ['id' => $tolerance->id, 'value' => '15', 'is_active' => true],
                ['id' => $redCard->id, 'is_active' => false],
                ['id' => null, 'text' => 'Se juega con balón número 5', 'is_active' => true],
            ],
        ])->assertSessionHasNoErrors();

        $this->assertSame('Tolerancia de 15 minutos para presentarse; después se pierde el partido', $tolerance->fresh()->display_text);
        $this->assertFalse($redCard->fresh()->is_active);
        $this->assertTrue($tournament->rules()->where('text', 'Se juega con balón número 5')->exists());

        // The public page only shows active rules.
        $this->get(route('public.tournaments.show', $tournament))->assertInertia(fn ($page) => $page
            ->where('rules', fn ($rules) => collect($rules)->doesntContain('template_key', 'red_card')
                && collect($rules)->contains('text', 'Se juega con balón número 5')));
    }

    public function test_custom_rules_need_text_and_can_be_removed(): void
    {
        $tournament = $this->tournamentWithRules();
        $custom = $tournament->rules()->create(['text' => 'Regla propia', 'sort_order' => 50]);

        $this->actingAs($tournament->organizer)->put(route('tournaments.rules.update', $tournament), [
            'rules' => [['id' => null, 'text' => '', 'is_active' => true]],
        ])->assertSessionHasErrors('rules.0.text');

        $suggested = $tournament->rules()->whereNotNull('template_key')->count();
        $this->actingAs($tournament->organizer)->put(route('tournaments.rules.update', $tournament), [
            'rules' => [],
        ])->assertSessionHasNoErrors();

        // Custom rules left out are deleted; suggested ones can only be turned off.
        $this->assertModelMissing($custom);
        $this->assertSame($suggested, $tournament->rules()->count());
    }

    public function test_the_organizer_adds_a_scorer_by_email(): void
    {
        $tournament = Tournament::factory()->create();
        $scorer = User::factory()->create(['email' => 'anotador@example.com']);

        $this->actingAs($tournament->organizer)
            ->post(route('tournaments.scorers.store', $tournament), ['email' => 'nadie@example.com'])
            ->assertSessionHasErrors('email');

        $this->actingAs($tournament->organizer)
            ->post(route('tournaments.scorers.store', $tournament), ['email' => 'anotador@example.com'])
            ->assertSessionHasNoErrors();
        $this->assertTrue($tournament->isScorer($scorer));

        $this->actingAs($tournament->organizer)
            ->post(route('tournaments.scorers.store', $tournament), ['email' => 'anotador@example.com'])
            ->assertSessionHasErrors('email');

        $this->actingAs($tournament->organizer)
            ->delete(route('tournaments.scorers.destroy', [$tournament, $scorer]))
            ->assertSessionHasNoErrors();
        $this->assertFalse($tournament->isScorer($scorer));
    }

    public function test_a_user_joins_as_scorer_with_the_invite_link(): void
    {
        $tournament = Tournament::factory()->create();
        $tournament->forceFill(['scorer_invite_code' => 'codigo-de-prueba'])->save();
        $code = 'codigo-de-prueba';
        $user = User::factory()->create();

        $this->get(route('invitations.show', $code))->assertRedirect(route('login'));

        $this->actingAs($user)->get(route('invitations.show', $code))->assertOk();
        $this->actingAs($user)->post(route('invitations.accept', $code))
            ->assertRedirect(route('tournaments.show', $tournament));
        $this->assertTrue($tournament->isScorer($user));

        // A new link invalidates the previous one.
        $this->actingAs($tournament->organizer)->post(route('tournaments.scorers.invite.regenerate', $tournament));
        $this->actingAs(User::factory()->create())->post(route('invitations.accept', $code))->assertNotFound();
    }

    public function test_draft_tournaments_are_not_public(): void
    {
        $draft = Tournament::factory()->create();
        $published = Tournament::factory()->status(TournamentStatus::InProgress)->create();

        $this->get(route('public.tournaments.show', $draft))->assertNotFound();
        $this->get(route('public.tournaments.show', $published))->assertOk();

        $this->get(route('home'))->assertInertia(fn ($page) => $page
            ->component('welcome')
            ->has('tournaments', 1)
            ->where('tournaments.0.id', $published->id)
            ->missing('tournaments.0.scorer_invite_code'));
    }
}
