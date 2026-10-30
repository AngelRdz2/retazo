<?php

namespace App\Http\Controllers;

use App\Models\Tournament;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Scorer invitation through a shareable link (/invitacion/{code}).
 */
class InvitationController extends Controller
{
    public function show(Request $request, string $code): Response
    {
        $tournament = Tournament::where('scorer_invite_code', $code)->first();

        return Inertia::render('invitations/show', [
            'code' => $code,
            'tournament' => $tournament?->only(['id', 'name', 'sport_label', 'status_label']),
            'organizer' => $tournament?->organizer->name,
            'alreadyMember' => $tournament && ($tournament->isOrganizer($request->user()) || $tournament->isScorer($request->user())),
        ]);
    }

    public function accept(Request $request, string $code): RedirectResponse
    {
        $tournament = Tournament::where('scorer_invite_code', $code)->firstOrFail();
        $user = $request->user();

        if (! $tournament->isOrganizer($user)) {
            $tournament->scorers()->syncWithoutDetaching([$user->id]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => "Ya eres anotador de {$tournament->name}."]);

        return to_route('tournaments.show', $tournament);
    }
}
