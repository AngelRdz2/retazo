<?php

namespace App\Http\Controllers;

use App\Enums\TournamentFormat;
use App\Http\Requests\AssignGroupsRequest;
use App\Models\Tournament;
use App\Services\Scheduling\GroupStage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class GroupController extends Controller
{
    public function draw(Tournament $tournament, GroupStage $groups): RedirectResponse
    {
        $this->ensureEditable($tournament);
        $groups->draw($tournament);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Sorteo realizado.']);

        return back();
    }

    public function manual(Tournament $tournament, GroupStage $groups): RedirectResponse
    {
        $this->ensureEditable($tournament);
        $groups->createEmpty($tournament);

        return back();
    }

    public function update(AssignGroupsRequest $request, Tournament $tournament, GroupStage $groups): RedirectResponse
    {
        $this->ensureEditable($tournament);
        $groups->assign($tournament, $request->assignments());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Grupos guardados.']);

        return back();
    }

    private function ensureEditable(Tournament $tournament): void
    {
        if ($tournament->format !== TournamentFormat::GroupsKnockout) {
            throw ValidationException::withMessages(['groups' => 'Este torneo no tiene fase de grupos.']);
        }
        if ($tournament->hasGames()) {
            throw ValidationException::withMessages(['groups' => 'Los grupos no se pueden cambiar después de generar el calendario.']);
        }
    }
}
