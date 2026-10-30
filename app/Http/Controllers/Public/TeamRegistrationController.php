<?php

namespace App\Http\Controllers\Public;

use App\Enums\TeamStatus;
use App\Enums\TournamentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\PublicTeamRegistrationRequest;
use App\Models\Tournament;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;

class TeamRegistrationController extends Controller
{
    public function create(Tournament $tournament): Response
    {
        abort_if($tournament->status === TournamentStatus::Draft || ! $tournament->public_registration, 404);

        return Inertia::render('public/register-team', [
            // toArray() applies the date cast, so start_date stays a plain "Y-m-d".
            'tournament' => Arr::only($tournament->toArray(), ['name', 'slug', 'sport_label', 'variant_label', 'start_date', 'location']),
            'open' => $tournament->acceptsPublicRegistrations(),
        ]);
    }

    public function store(PublicTeamRegistrationRequest $request, Tournament $tournament): RedirectResponse
    {
        $tournament->teams()->create([
            ...$request->safe()->only(['name', 'color', 'contact_name']),
            'status' => TeamStatus::Pending,
        ]);

        Inertia::flash('registered', $request->input('name'));

        return back();
    }
}
