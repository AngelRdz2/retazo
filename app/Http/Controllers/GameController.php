<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateGameScheduleRequest;
use App\Models\Game;
use App\Models\Tournament;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class GameController extends Controller
{
    /**
     * The organizer moves a game to another time or court.
     */
    public function update(UpdateGameScheduleRequest $request, Tournament $tournament, Game $game): RedirectResponse
    {
        $game->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Partido actualizado.']);

        return back();
    }
}
