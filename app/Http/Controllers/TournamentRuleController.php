<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateRulesRequest;
use App\Models\Tournament;
use App\Services\TournamentRules;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class TournamentRuleController extends Controller
{
    public function edit(Tournament $tournament): Response
    {
        return Inertia::render('tournaments/rules', [
            'tournament' => $tournament,
            'rules' => $tournament->rules()->get(),
        ]);
    }

    public function update(UpdateRulesRequest $request, Tournament $tournament, TournamentRules $rules): RedirectResponse
    {
        $rules->save($tournament, $request->rulesData());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Reglas guardadas.']);

        return to_route('tournaments.rules.edit', $tournament);
    }
}
