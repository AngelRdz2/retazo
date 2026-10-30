<?php

namespace Tests\Feature;

use App\Models\Tournament;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ErrorPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_forbidden_page_shows_the_app_error_page(): void
    {
        $tournament = Tournament::factory()->create();
        $stranger = User::factory()->create();

        $this->actingAs($stranger)->get(route('tournaments.show', $tournament))
            ->assertForbidden()
            ->assertInertia(fn (Assert $page) => $page
                ->component('error')
                ->where('status', 403)
                ->where('auth.user.id', $stranger->id));
    }

    public function test_a_missing_page_shows_the_app_error_page(): void
    {
        $this->get('/no-existe')
            ->assertNotFound()
            ->assertInertia(fn (Assert $page) => $page
                ->component('error')
                ->where('status', 404)
                ->where('auth.user', null));
    }
}
