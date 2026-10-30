<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreScorerRequest;
use App\Models\Tournament;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ScorerController extends Controller
{
    public function index(Tournament $tournament): Response
    {
        return Inertia::render('tournaments/scorers', [
            'tournament' => $tournament,
            'scorers' => $tournament->scorers()->orderBy('name')->get(['users.id', 'users.name', 'users.email']),
            'inviteUrl' => $tournament->scorer_invite_code
                ? route('invitations.show', $tournament->scorer_invite_code)
                : null,
        ]);
    }

    public function store(StoreScorerRequest $request, Tournament $tournament): RedirectResponse
    {
        $scorer = $request->scorer();
        $tournament->scorers()->attach($scorer);

        Inertia::flash('toast', ['type' => 'success', 'message' => "{$scorer?->name} ahora es anotador."]);

        return back();
    }

    public function destroy(Tournament $tournament, User $user): RedirectResponse
    {
        $tournament->scorers()->detach($user);

        Inertia::flash('toast', ['type' => 'success', 'message' => "{$user->name} ya no es anotador."]);

        return back();
    }

    /**
     * Create a new invite link. The previous one stops working.
     */
    public function regenerateInvite(Tournament $tournament): RedirectResponse
    {
        $tournament->forceFill(['scorer_invite_code' => Str::random(24)])->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Se generó un nuevo enlace de invitación.']);

        return back();
    }

    public function disableInvite(Tournament $tournament): RedirectResponse
    {
        $tournament->forceFill(['scorer_invite_code' => null])->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'El enlace de invitación fue desactivado.']);

        return back();
    }
}
