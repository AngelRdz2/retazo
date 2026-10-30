<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Tournaments the user organizes or scores.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('dashboard', [
            'organized' => $user->tournaments()->withCount('teams')->latest()->get(),
            'scoring' => $user->scoringTournaments()->withCount('teams')->latest()->get(),
        ]);
    }
}
