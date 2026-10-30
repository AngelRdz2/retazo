import { Head, Link, router, usePoll } from '@inertiajs/react';
import {
    Calendar,
    ClipboardList,
    MapPin,
    Radio,
    Trophy,
    Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import TeamRegistrationController from '@/actions/App/Http/Controllers/Public/TeamRegistrationController';
import { Bracket } from '@/components/bracket';
import type { BracketData } from '@/components/bracket';
import { GameCard } from '@/components/game-card';
import { SportIcon } from '@/components/sport-icon';
import { StandingsTable } from '@/components/standings-table';
import type { StandingTable } from '@/components/standings-table';
import { StatusBadge } from '@/components/status-badge';
import { TeamAvatar } from '@/components/team-avatar';
import { Button } from '@/components/ui/button';
import PublicLayout from '@/layouts/public-layout';
import { formatDate, plural } from '@/lib/format';
import { cn } from '@/lib/utils';
import type {
    Game,
    GameTeam,
    Team,
    Tournament,
    TournamentRule,
} from '@/types/tournament';

type TabKey =
    | 'partidos'
    | 'resultados'
    | 'tabla'
    | 'cuadro'
    | 'equipos'
    | 'reglas';

type Props = {
    tournament: Tournament;
    tab: string | null;
    teams: (Pick<Team, 'id' | 'name' | 'color' | 'logo_url'> & {
        group_id: number | null;
    })[];
    groups: { id: number; name: string }[];
    rules: TournamentRule[];
    registrationOpen: boolean;
    games: Game[];
    standings: StandingTable[];
    columns: Record<string, string>;
    qualifiers: number | null;
    bracket: BracketData | null;
};

export default function PublicTournament(props: Props) {
    const { tournament, rules, registrationOpen, games, standings, bracket } =
        props;

    // Live scores: refresh while the tournament is being played.
    usePoll(
        7000,
        { only: ['games', 'standings', 'bracket', 'tournament'] },
        { autoStart: tournament.status === 'in_progress' },
    );

    const live = games.filter((g) => g.status === 'live');
    const upcoming = games.filter((g) => g.status === 'scheduled');
    const results = games.filter((g) => g.status === 'finished').reverse();

    const tabs: { key: TabKey; label: string }[] = [
        {
            key: 'partidos',
            label: live.length > 0 ? `En vivo (${live.length})` : 'Próximos',
        },
        { key: 'resultados', label: 'Resultados' },
        ...(standings.length > 0
            ? [{ key: 'tabla' as const, label: 'Tabla' }]
            : []),
        ...(tournament.format !== 'league'
            ? [{ key: 'cuadro' as const, label: 'Cuadro' }]
            : []),
        { key: 'equipos', label: 'Equipos' },
        ...(rules.length > 0
            ? [{ key: 'reglas' as const, label: 'Reglas' }]
            : []),
    ];

    const fallback: TabKey =
        live.length + upcoming.length > 0
            ? 'partidos'
            : results.length > 0
              ? bracket
                  ? 'cuadro'
                  : standings.length > 0
                    ? 'tabla'
                    : 'resultados'
              : 'equipos';
    const [active, setActive] = useState<TabKey>(
        tabs.some((t) => t.key === props.tab)
            ? (props.tab as TabKey)
            : fallback,
    );

    const select = (key: TabKey) => {
        setActive(key);
        // Keep the tab in the URL so it can be shared.
        router.replace({
            url: `${window.location.pathname}?tab=${key}`,
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <PublicLayout>
            <Head title={tournament.name} />
            <Hero {...props} champion={champion(props)} />

            <nav className="sticky top-14 z-20 border-b bg-background/90 backdrop-blur">
                <div className="mx-auto flex max-w-4xl [scrollbar-width:none] gap-1 overflow-x-auto px-4 [&::-webkit-scrollbar]:hidden">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => select(tab.key)}
                            className={cn(
                                'shrink-0 border-b-2 border-transparent px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                                active === tab.key &&
                                    'border-brand text-foreground',
                            )}
                        >
                            {tab.key === 'partidos' && live.length > 0 && (
                                <span className="mr-1.5 inline-block size-2 animate-pulse rounded-full bg-red-500" />
                            )}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </nav>

            <div className="mx-auto max-w-4xl px-4 py-6">
                {active === 'partidos' && (
                    <GamesTab
                        live={live}
                        upcoming={upcoming}
                        tournament={tournament}
                    />
                )}
                {active === 'resultados' && (
                    <ResultsTab results={results} tournament={tournament} />
                )}
                {active === 'tabla' && <StandingsTab {...props} />}
                {active === 'cuadro' && <BracketTab bracket={bracket} />}
                {active === 'equipos' && <TeamsTab {...props} />}
                {active === 'reglas' && <RulesTab rules={rules} />}

                {registrationOpen && active !== 'equipos' && (
                    <p className="mt-8 text-center text-sm text-muted-foreground">
                        ¿Tienes un equipo?{' '}
                        <Link
                            href={TeamRegistrationController.create(tournament)}
                            className="font-medium text-brand underline-offset-4 hover:underline dark:text-blue-300"
                        >
                            Inscríbelo aquí
                        </Link>
                    </p>
                )}
            </div>
        </PublicLayout>
    );
}

/**
 * Winner of the final, or the league leader once the tournament is over.
 */
function champion({ tournament, bracket, standings }: Props): GameTeam | null {
    if (tournament.status !== 'finished') {
        return null;
    }

    const final = bracket?.rounds[bracket.rounds.length - 1]?.games[0];
    if (final?.winner_team_id) {
        return final.winner_team_id === final.home_team_id
            ? final.home_team
            : final.away_team;
    }

    return tournament.format === 'league'
        ? (standings[0]?.rows[0]?.team ?? null)
        : null;
}

function Hero({
    tournament,
    teams,
    registrationOpen,
    champion,
}: Props & { champion: GameTeam | null }) {
    return (
        <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#001a66] via-[#0030a0] to-brand text-white">
            <div
                aria-hidden
                className="absolute -top-20 -right-20 -z-10 size-72 rounded-full bg-brand-orange/40 blur-3xl"
            />
            <SportIcon
                sport={tournament.sport}
                aria-hidden
                strokeWidth={1.5}
                className="absolute -right-8 -bottom-10 -z-10 size-48 opacity-10"
            />
            <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
                <StatusBadge
                    status={tournament.status}
                    label={tournament.status_label}
                    className="bg-white/15 text-white"
                />
                <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                    {tournament.name}
                </h1>
                <p className="mt-1 text-blue-100">
                    {tournament.variant_label ?? tournament.sport_label} ·{' '}
                    {tournament.format_label}
                </p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-blue-100">
                    <span className="inline-flex items-center gap-1.5">
                        <Calendar className="size-4" />
                        {formatDate(tournament.start_date)}
                    </span>
                    {tournament.location && (
                        <span className="inline-flex items-center gap-1.5">
                            <MapPin className="size-4" />
                            {tournament.location}
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                        <Users className="size-4" />
                        {plural(teams.length, 'equipo', 'equipos')}
                    </span>
                </div>
                {tournament.description && (
                    <p className="mt-4 max-w-2xl text-sm whitespace-pre-line text-blue-50/90">
                        {tournament.description}
                    </p>
                )}

                {champion && (
                    <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-white/10 py-2 pr-4 pl-2 backdrop-blur">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-orange">
                            <Trophy className="size-5" />
                        </span>
                        <span>
                            <span className="block text-xs text-blue-100">
                                Campeón
                            </span>
                            <span className="flex items-center gap-2 font-bold">
                                <TeamAvatar
                                    team={champion}
                                    className="size-5 text-[9px]"
                                />
                                {champion.name}
                            </span>
                        </span>
                    </div>
                )}

                {registrationOpen && (
                    <div>
                        <Button
                            asChild
                            size="lg"
                            className="mt-6 bg-brand-orange text-white hover:bg-brand-orange/90"
                        >
                            <Link
                                href={TeamRegistrationController.create(
                                    tournament,
                                )}
                            >
                                <ClipboardList /> Inscribir a mi equipo
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
}

function GamesTab({
    live,
    upcoming,
    tournament,
}: {
    live: Game[];
    upcoming: Game[];
    tournament: Tournament;
}) {
    if (live.length === 0 && upcoming.length === 0) {
        return (
            <Empty
                icon={<Calendar />}
                text="No hay partidos programados por ahora."
            />
        );
    }

    return (
        <div className="space-y-8">
            {live.length > 0 && (
                <section className="space-y-3">
                    <h2 className="flex items-center gap-2 text-lg font-bold">
                        <Radio className="size-5 text-red-500" /> En vivo ahora
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {live.map((game) => (
                            <GameCard
                                key={game.id}
                                game={game}
                                tournament={tournament}
                            />
                        ))}
                    </div>
                </section>
            )}
            {upcoming.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-lg font-bold">Próximos partidos</h2>
                    <GamesByDay games={upcoming} tournament={tournament} />
                </section>
            )}
        </div>
    );
}

function ResultsTab({
    results,
    tournament,
}: {
    results: Game[];
    tournament: Tournament;
}) {
    if (results.length === 0) {
        return <Empty icon={<Trophy />} text="Todavía no hay resultados." />;
    }

    return <GamesByDay games={results} tournament={tournament} />;
}

/**
 * Games under a heading per day, keeping the order they come in.
 */
function GamesByDay({
    games,
    tournament,
}: {
    games: Game[];
    tournament: Tournament;
}) {
    const days = new Map<string, Game[]>();
    for (const game of games) {
        const key = game.scheduled_at?.slice(0, 10) ?? 'sin-fecha';
        days.set(key, [...(days.get(key) ?? []), game]);
    }

    return (
        <div className="space-y-6">
            {[...days.entries()].map(([day, dayGames]) => (
                <div key={day} className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground first-letter:uppercase">
                        {day === 'sin-fecha'
                            ? 'Sin fecha'
                            : formatDate(day, {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                              })}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {dayGames.map((game) => (
                            <div key={game.id} className="space-y-1">
                                <p className="px-1 text-xs text-muted-foreground">
                                    {game.round_label}
                                    {game.group_name && ` · ${game.group_name}`}
                                </p>
                                <GameCard game={game} tournament={tournament} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function StandingsTab({ standings, columns, qualifiers }: Props) {
    return (
        <div className="space-y-4">
            <div
                className={cn(
                    'grid gap-4',
                    standings.length > 1 && 'lg:grid-cols-2',
                )}
            >
                {standings.map((table) => (
                    <StandingsTable
                        key={table.group_id ?? 'league'}
                        table={table}
                        columns={columns}
                        qualifiers={qualifiers}
                    />
                ))}
            </div>
            {qualifiers && (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-3 w-1 rounded bg-brand" />
                    Clasifican a la eliminatoria ({qualifiers} por grupo)
                </p>
            )}
        </div>
    );
}

function BracketTab({ bracket }: { bracket: BracketData | null }) {
    if (!bracket) {
        return (
            <Empty
                icon={<Trophy />}
                text="El cuadro se arma cuando termina la fase de grupos."
            />
        );
    }

    return <Bracket bracket={bracket} />;
}

function TeamsTab({ teams, groups }: Props) {
    if (teams.length === 0) {
        return (
            <Empty icon={<Users />} text="Aún no hay equipos confirmados." />
        );
    }

    const sections =
        groups.length > 0
            ? groups.map((g) => ({
                  title: g.name,
                  teams: teams.filter((t) => t.group_id === g.id),
              }))
            : [{ title: null, teams }];

    return (
        <div className="space-y-6">
            {sections.map((section) => (
                <section key={section.title ?? 'all'} className="space-y-2">
                    {section.title && (
                        <h2 className="font-bold">{section.title}</h2>
                    )}
                    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {section.teams.map((team) => (
                            <li
                                key={team.id}
                                className="flex items-center gap-2 rounded-2xl border bg-card p-3"
                            >
                                <TeamAvatar team={team} />
                                <span className="truncate text-sm font-medium">
                                    {team.name}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}

function RulesTab({ rules }: { rules: TournamentRule[] }) {
    return (
        <ol className="space-y-2">
            {rules.map((rule, i) => (
                <li
                    key={rule.id}
                    className="flex gap-3 rounded-2xl border bg-card p-3 text-sm"
                >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand dark:text-blue-300">
                        {i + 1}
                    </span>
                    {rule.display_text}
                </li>
            ))}
        </ol>
    );
}

function Empty({ icon, text }: { icon: ReactNode; text: string }) {
    return (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed p-10 text-center text-sm text-muted-foreground [&_svg]:size-8">
            {icon}
            {text}
        </div>
    );
}
