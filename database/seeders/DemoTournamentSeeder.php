<?php

namespace Database\Seeders;

use App\Enums\GameStage;
use App\Enums\GameStatus;
use App\Enums\Sport;
use App\Enums\Tiebreaker;
use App\Enums\TournamentFormat;
use App\Enums\TournamentStatus;
use App\Models\Game;
use App\Models\Tournament;
use App\Models\User;
use App\Services\GameScoring;
use App\Services\Scheduling\GroupStage;
use App\Services\Scheduling\ScheduleGenerator;
use App\Services\Scheduling\ScheduleOptions;
use App\Services\TournamentRules;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;

/**
 * One example tournament per sport, played with the real services so the
 * results, standings and bracket are consistent:
 * - Fútbol 7: league in progress with a game live today.
 * - Vóley: groups + knockout, waiting for the final.
 * - Básquet: finished knockout with byes and a champion.
 */
class DemoTournamentSeeder extends Seeder
{
    private const COLORS = ['#0058F8', '#F87000', '#16A34A', '#DC2626', '#9333EA', '#0891B2', '#CA8A04', '#111827'];

    private const CONTACTS = ['María López', 'Carlos Pérez', 'Ana Martínez', 'José Hernández', 'Lucía Gómez', 'Diego Ramírez', 'Sofía Castro', 'Luis Morales'];

    public function __construct(
        private ScheduleGenerator $schedule,
        private GroupStage $groups,
        private GameScoring $scoring,
        private TournamentRules $rules,
    ) {}

    public function run(): void
    {
        mt_srand(2026);

        $organizer = User::where('email', 'demo@retazo.test')->firstOrFail();
        $scorer = User::where('email', 'anotador@retazo.test')->first();

        Tournament::whereIn('slug', ['liga-colonia-2026', 'copa-voley-primavera', 'relampago-basquet'])->delete();

        $this->footballLeague($organizer, $scorer);
        $this->volleyballCup($organizer);
        $this->basketballKnockout($organizer);
    }

    private function footballLeague(User $organizer, ?User $scorer): void
    {
        $today = CarbonImmutable::today();
        $tournament = $this->tournament($organizer, [
            'name' => 'Liga Colonia 2026',
            'slug' => 'liga-colonia-2026',
            'sport' => Sport::Football,
            'variant' => 'f7',
            'description' => 'La liga de fútbol 7 del barrio. Todos los jueves por la noche en la cancha municipal.',
            'start_date' => $today->subWeeks(3),
            'location' => 'Cancha municipal Colonia',
            'format' => TournamentFormat::League,
        ], ['Real Colonia', 'Deportivo Sur', 'Atlético Norte', 'Juventud FC', 'Unión Barrio', 'Racing Oeste']);

        if ($scorer) {
            $tournament->scorers()->attach($scorer);
        }

        // One match day per week; the 4th is today.
        $this->schedule->generate($tournament, new ScheduleOptions(
            startsAt: $today->subWeeks(3)->setTime(19, 0),
            gameMinutes: 60,
            courts: 2,
            courtNames: ['Cancha 1', 'Cancha 2'],
            daysBetweenRounds: 7,
        ));

        foreach ($tournament->games()->where('round', '<=', 3)->get() as $game) {
            $this->play($game, mt_rand(0, 4), mt_rand(0, 3));
        }

        $live = $tournament->games()->where('round', 4)->orderBy('scheduled_at')->first();
        if ($live) {
            $this->scoring->start($live);
            $this->scoring->adjust($live, 'home', 1);
            $this->scoring->adjust($live, 'away', 1);
            $this->scoring->adjust($live, 'home', 1);
        }
    }

    private function volleyballCup(User $organizer): void
    {
        $groupDay = CarbonImmutable::today()->subWeeks(2)->next(CarbonImmutable::SATURDAY);
        $tournament = $this->tournament($organizer, [
            'name' => 'Copa Vóley Primavera',
            'slug' => 'copa-voley-primavera',
            'sport' => Sport::Volleyball,
            'description' => 'Ocho equipos mixtos, dos grupos y la gran final en el gimnasio del colegio.',
            'start_date' => $groupDay,
            'location' => 'Gimnasio Colegio San José',
            'format' => TournamentFormat::GroupsKnockout,
            'settings' => [
                'best_of' => 3,
                'points' => ['win' => 3, 'win_close' => 2, 'loss_close' => 1, 'loss' => 0],
                'groups_count' => 2,
                'qualifiers_per_group' => 2,
            ],
        ], ['Las Panteras', 'Club Ola', 'Voley Sur', 'Saque Fuerte', 'Red Norte', 'Bloqueo Total', 'Las Gacelas', 'Club Arena']);

        $this->groups->draw($tournament);
        $this->schedule->generate($tournament, new ScheduleOptions(
            startsAt: $groupDay->setTime(8, 0),
            gameMinutes: 50,
            courts: 2,
            courtNames: ['Cancha A', 'Cancha B'],
            daysBetweenRounds: 0,
        ));

        foreach ($tournament->games()->get() as $game) {
            $this->playSets($game);
        }

        // Semifinals last Saturday, final next Saturday.
        $this->schedule->generateKnockoutFromGroups($tournament, new ScheduleOptions(
            startsAt: $groupDay->addWeek()->setTime(10, 0),
            gameMinutes: 60,
            courts: 1,
            courtNames: ['Cancha central'],
            daysBetweenRounds: 7,
        ));

        foreach ($tournament->games()->where('stage', GameStage::Knockout)->where('round', 1)->get() as $semifinal) {
            $this->playSets($semifinal);
        }
    }

    private function basketballKnockout(User $organizer): void
    {
        $day = CarbonImmutable::today()->subMonth()->next(CarbonImmutable::SUNDAY);
        $tournament = $this->tournament($organizer, [
            'name' => 'Torneo Relámpago de Básquet',
            'slug' => 'relampago-basquet',
            'sport' => Sport::Basketball,
            'description' => 'Seis equipos, un solo día, eliminación directa.',
            'start_date' => $day,
            'location' => 'Polideportivo Central',
            'format' => TournamentFormat::Knockout,
        ], ['Los Halcones', 'Tiburones', 'Gigantes', 'Cóndores', 'Rayos', 'Titanes']);

        $this->schedule->generate($tournament, new ScheduleOptions(
            startsAt: $day->setTime(9, 0),
            gameMinutes: 75,
            courts: 1,
            daysBetweenRounds: 0,
        ));

        // Round by round, so each winner is already in the next game.
        foreach ([1, 2, 3] as $round) {
            foreach ($tournament->games()->where('round', $round)->get() as $game) {
                $home = mt_rand(55, 90);
                $away = mt_rand(55, 90);
                $this->play($game, $home, $home === $away ? $away + 3 : $away);
            }
        }
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @param  list<string>  $teamNames
     */
    private function tournament(User $organizer, array $attributes, array $teamNames): Tournament
    {
        $sport = $attributes['sport'];

        $tournament = $organizer->tournaments()->create([
            'status' => TournamentStatus::RegistrationOpen,
            'settings' => $sport->definition()->defaultSettings(),
            'tiebreakers' => Tiebreaker::defaultOrder(),
            ...$attributes,
        ]);
        $this->rules->loadTemplates($tournament);

        foreach ($teamNames as $i => $name) {
            $tournament->teams()->create([
                'name' => $name,
                'color' => self::COLORS[$i % count(self::COLORS)],
                'contact_name' => self::CONTACTS[$i % count(self::CONTACTS)],
                'status' => 'approved',
            ]);
        }

        return $tournament;
    }

    /**
     * Football or basketball: kick off, set the final score and blow the whistle.
     */
    private function play(Game $game, int $home, int $away): void
    {
        $this->scoring->start($game);
        Game::whereKey($game->id)->update(['home_score' => $home, 'away_score' => $away]);
        $this->scoring->finish($game);
    }

    /**
     * Volleyball best of 3 with believable set scores.
     */
    private function playSets(Game $game): void
    {
        $this->scoring->start($game);
        $homeWins = (bool) mt_rand(0, 1);
        $sets = mt_rand(0, 1) ? [$homeWins, ! $homeWins, $homeWins] : [$homeWins, $homeWins];

        foreach ($sets as $index => $homeTakesSet) {
            $target = $index === 2 ? 15 : 25;
            $loser = mt_rand($target - 12, $target - 2);
            $current = $game->fresh();

            if ($current === null || $current->status !== GameStatus::Live) {
                return;
            }

            $setScores = $current->sets ?? [];
            array_pop($setScores);
            $setScores[] = $homeTakesSet ? ['home' => $target, 'away' => $loser] : ['home' => $loser, 'away' => $target];
            $current->update(['sets' => $setScores]);
            $this->scoring->closeSet($current);
        }
    }
}
