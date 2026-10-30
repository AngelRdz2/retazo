<?php

namespace App\Http\Controllers;

use App\Enums\Sport;
use App\Enums\TeamStatus;
use App\Enums\Tiebreaker;
use App\Enums\TournamentStatus;
use App\Http\Requests\TournamentRequest;
use App\Models\Tournament;
use App\Services\TournamentRules;
use App\Support\TournamentOptions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class TournamentController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('tournaments/create', [
            'options' => TournamentOptions::all(),
            'defaults' => [
                'sport' => Sport::Football->value,
                'status' => TournamentStatus::Draft->value,
                'tiebreakers' => Tiebreaker::defaultOrder(),
                'start_date' => now()->addWeek()->toDateString(),
            ],
        ]);
    }

    public function store(TournamentRequest $request, TournamentRules $rules): RedirectResponse
    {
        $tournament = $request->user()->tournaments()->create($request->tournamentAttributes());
        $rules->loadTemplates($tournament);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Torneo creado. Ahora agrega los equipos.']);

        return to_route('tournaments.show', $tournament);
    }

    public function show(Request $request, Tournament $tournament): Response
    {
        $teams = $tournament->teams()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');

        return Inertia::render('tournaments/show', [
            'tournament' => $tournament,
            'canManage' => $request->user()->can('update', $tournament),
            'stats' => [
                'approvedTeams' => (int) ($teams[TeamStatus::Approved->value] ?? 0),
                'pendingTeams' => (int) ($teams[TeamStatus::Pending->value] ?? 0),
                'activeRules' => $tournament->rules()->where('is_active', true)->count(),
                'scorers' => $tournament->scorers()->count(),
                'games' => $tournament->games()->count(),
            ],
            'links' => [
                'public' => route('public.tournaments.show', $tournament),
                'registration' => $tournament->public_registration ? route('public.registration.create', $tournament) : null,
            ],
        ]);
    }

    public function edit(Tournament $tournament): Response
    {
        return Inertia::render('tournaments/edit', [
            'tournament' => $tournament,
            'options' => TournamentOptions::all(),
            'hasGames' => $tournament->hasGames(),
        ]);
    }

    public function update(TournamentRequest $request, Tournament $tournament, TournamentRules $rules): RedirectResponse
    {
        $tournament->fill($request->tournamentAttributes());
        $sportChanged = $tournament->isDirty(['sport', 'variant']);
        $tournament->save();

        $sportChanged ? $rules->loadTemplates($tournament) : $rules->syncWithSettings($tournament);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Cambios guardados.']);

        return to_route('tournaments.show', $tournament);
    }

    public function destroy(Tournament $tournament): RedirectResponse
    {
        $logos = $tournament->teams()->whereNotNull('logo_path')->pluck('logo_path')->all();
        $tournament->delete();
        Storage::disk('public')->delete($logos);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Torneo eliminado.']);

        return to_route('dashboard');
    }
}
