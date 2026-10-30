<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\GameScoringController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\Public\MatchController;
use App\Http\Controllers\Public\PageController;
use App\Http\Controllers\Public\TeamRegistrationController;
use App\Http\Controllers\Public\TournamentController as PublicTournamentController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\ScorerController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\TournamentController;
use App\Http\Controllers\TournamentRuleController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');

// Public pages (no login).
Route::get('torneos', [PublicTournamentController::class, 'index'])->name('public.tournaments.index');
Route::get('partidos', [MatchController::class, 'index'])->name('public.games.index');
Route::get('como-funciona', [PageController::class, 'howItWorks'])->name('public.how-it-works');
Route::get('t/{tournament:slug}', [PublicTournamentController::class, 'show'])->name('public.tournaments.show');
Route::get('t/{tournament:slug}/inscripcion', [TeamRegistrationController::class, 'create'])->name('public.registration.create');
Route::post('t/{tournament:slug}/inscripcion', [TeamRegistrationController::class, 'store'])
    ->middleware('throttle:10,1')
    ->name('public.registration.store');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('panel', DashboardController::class)->name('dashboard');

    Route::get('torneos/crear', [TournamentController::class, 'create'])->name('tournaments.create');
    Route::post('torneos', [TournamentController::class, 'store'])->name('tournaments.store');
    Route::get('torneos/{tournament}', [TournamentController::class, 'show'])
        ->can('view', 'tournament')
        ->name('tournaments.show');
    Route::get('torneos/{tournament}/calendario', [ScheduleController::class, 'show'])
        ->can('view', 'tournament')
        ->name('tournaments.schedule.show');

    // Organizer only.
    Route::middleware('can:update,tournament')->prefix('torneos/{tournament}')->name('tournaments.')->group(function () {
        Route::get('editar', [TournamentController::class, 'edit'])->name('edit');
        Route::put('/', [TournamentController::class, 'update'])->name('update');
        Route::delete('/', [TournamentController::class, 'destroy'])->name('destroy');

        Route::get('reglas', [TournamentRuleController::class, 'edit'])->name('rules.edit');
        Route::put('reglas', [TournamentRuleController::class, 'update'])->name('rules.update');

        Route::scopeBindings()->group(function () {
            Route::get('equipos', [TeamController::class, 'index'])->name('teams.index');
            Route::post('equipos', [TeamController::class, 'store'])->name('teams.store');
            Route::put('equipos/{team}', [TeamController::class, 'update'])->name('teams.update');
            Route::delete('equipos/{team}', [TeamController::class, 'destroy'])->name('teams.destroy');
            Route::post('equipos/{team}/aprobar', [TeamController::class, 'approve'])->name('teams.approve');
        });

        Route::post('calendario', [ScheduleController::class, 'store'])->name('schedule.store');
        Route::post('calendario/eliminatoria', [ScheduleController::class, 'knockout'])->name('schedule.knockout');
        Route::put('partidos/{game}', [GameController::class, 'update'])->scopeBindings()->name('games.update');

        Route::post('grupos/sorteo', [GroupController::class, 'draw'])->name('groups.draw');
        Route::post('grupos/manual', [GroupController::class, 'manual'])->name('groups.manual');
        Route::put('grupos', [GroupController::class, 'update'])->name('groups.update');

        Route::get('anotadores', [ScorerController::class, 'index'])->name('scorers.index');
        Route::post('anotadores', [ScorerController::class, 'store'])->name('scorers.store');
        Route::post('anotadores/enlace', [ScorerController::class, 'regenerateInvite'])->name('scorers.invite.regenerate');
        Route::delete('anotadores/enlace', [ScorerController::class, 'disableInvite'])->name('scorers.invite.disable');
        Route::delete('anotadores/{user}', [ScorerController::class, 'destroy'])->whereNumber('user')->name('scorers.destroy');
    });

    // Scoring: organizer and scorers.
    Route::middleware('can:score,game')->prefix('partidos/{game}')->name('games.')->group(function () {
        Route::get('anotar', [GameScoringController::class, 'show'])->name('score');
        Route::post('iniciar', [GameScoringController::class, 'start'])->name('start');
        Route::post('marcador', [GameScoringController::class, 'adjust'])->name('adjust');
        Route::post('cerrar-set', [GameScoringController::class, 'closeSet'])->name('close-set');
        Route::post('deshacer-set', [GameScoringController::class, 'undoSet'])->name('undo-set');
        Route::post('finalizar', [GameScoringController::class, 'finish'])->name('finish');
        Route::post('reabrir', [GameScoringController::class, 'reopen'])->name('reopen');
    });

    Route::get('invitacion/{code}', [InvitationController::class, 'show'])->name('invitations.show');
    Route::post('invitacion/{code}', [InvitationController::class, 'accept'])->name('invitations.accept');
});

require __DIR__.'/settings.php';
