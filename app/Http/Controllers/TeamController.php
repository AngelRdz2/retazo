<?php

namespace App\Http\Controllers;

use App\Enums\TeamStatus;
use App\Http\Requests\TeamRequest;
use App\Models\Game;
use App\Models\Team;
use App\Models\Tournament;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    public function index(Tournament $tournament): Response
    {
        return Inertia::render('tournaments/teams', [
            'tournament' => $tournament,
            // Pending registrations first so the organizer sees them right away.
            'teams' => $tournament->teams()->orderByRaw('status = ? desc', [TeamStatus::Pending->value])->orderBy('name')->get(),
            'isFull' => $tournament->isFull(),
            'registrationUrl' => $tournament->public_registration ? route('public.registration.create', $tournament) : null,
        ]);
    }

    public function store(TeamRequest $request, Tournament $tournament): RedirectResponse
    {
        $this->ensureCapacity($tournament);

        $tournament->teams()->create([
            ...$request->safe()->only(['name', 'color', 'contact_name']),
            'logo_path' => $this->storeLogo($request->file('logo')),
            'status' => TeamStatus::Approved,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Equipo agregado.']);

        return back();
    }

    public function update(TeamRequest $request, Tournament $tournament, Team $team): RedirectResponse
    {
        $team->fill($request->safe()->only(['name', 'color', 'contact_name']));

        if ($request->hasFile('logo') || $request->boolean('remove_logo')) {
            if ($team->logo_path) {
                Storage::disk('public')->delete($team->logo_path);
            }
            $team->logo_path = $this->storeLogo($request->file('logo'));
        }

        $team->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Equipo actualizado.']);

        return back();
    }

    public function approve(Tournament $tournament, Team $team): RedirectResponse
    {
        $this->ensureCapacity($tournament);

        $team->update(['status' => TeamStatus::Approved]);

        Inertia::flash('toast', ['type' => 'success', 'message' => "{$team->name} fue aprobado."]);

        return back();
    }

    public function destroy(Tournament $tournament, Team $team): RedirectResponse
    {
        $hasGames = Game::where('home_team_id', $team->id)->orWhere('away_team_id', $team->id)->exists();

        if ($hasGames) {
            throw ValidationException::withMessages([
                'team' => 'No puedes eliminar un equipo que ya tiene partidos en el calendario.',
            ]);
        }

        if ($team->logo_path) {
            Storage::disk('public')->delete($team->logo_path);
        }
        $team->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Equipo eliminado.']);

        return back();
    }

    private function storeLogo(?UploadedFile $logo): ?string
    {
        if (! $logo) {
            return null;
        }

        return $logo->store('team-logos', 'public')
            ?: throw ValidationException::withMessages(['logo' => 'No se pudo guardar el logo. Intenta de nuevo.']);
    }

    private function ensureCapacity(Tournament $tournament): void
    {
        if ($tournament->isFull()) {
            throw ValidationException::withMessages([
                'name' => "El torneo ya tiene el máximo de {$tournament->max_teams} equipos.",
            ]);
        }
    }
}
