import { Head, Link, router, usePoll } from '@inertiajs/react';
import {
    CalendarDays,
    Check,
    CircleDot,
    ClipboardList,
    Clock,
    Flag,
    ListOrdered,
    MapPin,
    Radio,
    Share2,
    Swords,
    Trophy,
    Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import TeamRegistrationController from '@/actions/App/Http/Controllers/Public/TeamRegistrationController';
import { Bracket } from '@/components/bracket';
import type { BracketData } from '@/components/bracket';
import { SegmentedControl } from '@/components/segmented-control';
import { SportIcon } from '@/components/sport-icon';
import { Stadium } from '@/components/stadium';
import { StandingsTable } from '@/components/standings-table';
import type { StandingRow, StandingTable } from '@/components/standings-table';
import { StatusBadge } from '@/components/status-badge';
import { TeamCrest } from '@/components/team-crest';
import { useClipboard } from '@/hooks/use-clipboard';
import LandingLayout from '@/layouts/landing-layout';
import { formatDate, formatGameTime, plural } from '@/lib/format';
import { cn } from '@/lib/utils';
import type {
    Game,
    GameTeam,
    SportValue,
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
    featuredGameId: number | null;
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
    stadium: string | null;
};

/**
 * Where a team stands: its row and the table (league or group) it is in.
 */
type Standing = { row: StandingRow; table: StandingTable };

export default function PublicTournament(props: Props) {
    const { tournament, rules, games, standings, bracket } = props;

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
    const [pickedId, setPickedId] = useState(props.featuredGameId);

    const featured = featuredGame(games, pickedId, tournament);
    const standingOf = useMemo(() => standingsByTeam(standings), [standings]);
    const winner = champion(props);

    // Keep the tab and the chosen match in the URL so they can be shared.
    const syncUrl = (tab: TabKey, gameId: number | null) => {
        const query = new URLSearchParams({ tab });
        if (gameId !== null) {
            query.set('partido', String(gameId));
        }
        router.replace({
            url: `${window.location.pathname}?${query}`,
            preserveScroll: true,
            preserveState: true,
        });
    };

    const select = (key: TabKey) => {
        setActive(key);
        syncUrl(key, pickedId);
    };

    // A match picked from the lists goes to the header and to "Cara a cara".
    const pick = (game: Game) => {
        setPickedId(game.id);
        setActive('partidos');
        syncUrl('partidos', game.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const row = (game: Game) => (
        <MatchRow
            key={game.id}
            game={game}
            standingOf={standingOf}
            featured={game.id === featured?.id}
            onPick={pick}
        />
    );

    return (
        <LandingLayout
            background={
                <Stadium
                    image={props.stadium}
                    sport={tournament.sport}
                    className="h-[880px]"
                />
            }
        >
            <Head title={tournament.name} />

            {featured ? (
                <MatchHero
                    game={featured}
                    tournament={tournament}
                    standingOf={standingOf}
                />
            ) : (
                <TournamentHero {...props} champion={winner} />
            )}

            <div className="sticky top-0 z-20 border-y border-white/5 bg-[#04070d]/80 py-2.5 backdrop-blur-md">
                <SegmentedControl
                    label="Secciones del torneo"
                    options={tabs.map((tab) => ({
                        value: tab.key,
                        label: tab.label,
                        icon:
                            tab.key === 'partidos' && live.length > 0 ? (
                                <span className="size-2 animate-pulse rounded-full bg-red-500" />
                            ) : undefined,
                    }))}
                    value={active}
                    onChange={(value) => select(value as TabKey)}
                    className="mx-auto w-fit px-4"
                />
            </div>

            <div
                className={cn(
                    'mx-auto grid max-w-6xl gap-10 px-4 pt-8 sm:px-6 lg:gap-8',
                    // The bracket needs the whole width; the side cards go below it.
                    active !== 'cuadro' && 'lg:grid-cols-[minmax(0,1fr)_320px]',
                )}
            >
                <div className="min-w-0">
                    {active === 'partidos' && (
                        <GamesTab
                            {...props}
                            live={live}
                            upcoming={upcoming}
                            featured={featured}
                            standingOf={standingOf}
                            row={row}
                        />
                    )}
                    {active === 'resultados' &&
                        (results.length === 0 ? (
                            <Empty
                                icon={<Trophy />}
                                text="Todavía no hay resultados."
                            />
                        ) : (
                            <GamesByDay games={results} row={row} />
                        ))}
                    {active === 'tabla' && (
                        <StandingsTab {...props} featured={featured} />
                    )}
                    {active === 'cuadro' && <BracketTab bracket={bracket} />}
                    {active === 'equipos' && (
                        <TeamsTab {...props} standingOf={standingOf} />
                    )}
                    {active === 'reglas' && <RulesTab rules={rules} />}
                </div>

                <aside
                    className={cn(
                        'space-y-8',
                        active === 'cuadro' &&
                            'grid gap-8 space-y-0 md:grid-cols-2',
                    )}
                >
                    {featured && (
                        <MatchInfo game={featured} tournament={tournament} />
                    )}
                    <TournamentInfo {...props} champion={winner} />
                </aside>
            </div>
        </LandingLayout>
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

/**
 * Match for the header: the one picked, else the live one, else the next one.
 * While the tournament runs and nothing is left to play, the latest result.
 */
function featuredGame(
    games: Game[],
    pickedId: number | null,
    tournament: Tournament,
): Game | null {
    const playable = games.filter((g) => g.home_team && g.away_team);
    const finished = playable.filter((g) => g.status === 'finished');

    return (
        playable.find((g) => g.id === pickedId) ??
        playable.find((g) => g.status === 'live') ??
        playable.find((g) => g.status === 'scheduled') ??
        (tournament.status === 'finished'
            ? null
            : (finished[finished.length - 1] ?? null))
    );
}

function standingsByTeam(tables: StandingTable[]): Map<number, Standing> {
    const standings = new Map<number, Standing>();
    for (const table of tables) {
        for (const row of table.rows) {
            standings.set(row.team.id, { row, table });
        }
    }

    return standings;
}

function TournamentTitle({
    tournament,
    large = false,
}: {
    tournament: Tournament;
    large?: boolean;
}) {
    return (
        <div className="text-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
                <StatusBadge
                    status={tournament.status}
                    label={tournament.status_label}
                    className="backdrop-blur"
                />
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-0.5 text-xs font-medium text-white/80 backdrop-blur">
                    <SportIcon sport={tournament.sport} className="size-3.5" />
                    {tournament.variant_label ?? tournament.sport_label} ·{' '}
                    {tournament.format_label}
                </span>
            </div>
            <h1
                className={cn(
                    'mt-3 font-display leading-[0.95] tracking-wide uppercase',
                    large ? 'text-5xl sm:text-7xl' : 'text-3xl sm:text-5xl',
                )}
            >
                {tournament.name}
            </h1>
        </div>
    );
}

/**
 * "Team VS Team" header: big crests, where each one stands, and the countdown or the score.
 */
function MatchHero({
    game,
    tournament,
    standingOf,
}: {
    game: Game;
    tournament: Tournament;
    standingOf: Map<number, Standing>;
}) {
    const home = game.home_team as GameTeam;
    const away = game.away_team as GameTeam;
    const lost = (team: GameTeam) =>
        game.status === 'finished' && outcomeFor(game, team.id) === 'lost';

    return (
        <section className="mx-auto max-w-6xl px-4 pt-4 pb-10 sm:px-6 sm:pt-8 sm:pb-14">
            <TournamentTitle tournament={tournament} />

            <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 sm:mt-12 sm:gap-8">
                <HeroTeam
                    team={home}
                    standing={standingOf.get(home.id)}
                    lost={lost(home)}
                />
                <MatchCenter game={game} />
                <HeroTeam
                    team={away}
                    standing={standingOf.get(away.id)}
                    lost={lost(away)}
                />
            </div>
        </section>
    );
}

function HeroTeam({
    team,
    standing,
    lost,
}: {
    team: GameTeam;
    standing: Standing | undefined;
    lost: boolean;
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center text-center',
                lost && 'opacity-60',
            )}
        >
            <TeamCrest team={team} size="xl" />
            <h2 className="mt-3 w-full font-display text-xl leading-none tracking-wide break-words uppercase sm:mt-4 sm:text-4xl">
                {team.name}
            </h2>
            {standing && (
                <>
                    <p className="mt-2 inline-flex items-baseline gap-1.5 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[11px] text-white/70 tabular-nums backdrop-blur sm:text-xs">
                        <span className="font-display text-base leading-none text-white sm:text-lg">
                            {standing.row.position}º
                        </span>
                        · {plural(standing.row.points, 'pt', 'pts')}
                    </p>
                    {standing.table.title && (
                        <p className="mt-1 text-[11px] text-white/50">
                            {standing.table.title}
                        </p>
                    )}
                </>
            )}
        </div>
    );
}

function MatchCenter({ game }: { game: Game }) {
    return (
        <div className="flex flex-col items-center gap-3 pt-3 sm:pt-8">
            <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-center text-[10px] font-semibold tracking-wider text-white/75 uppercase backdrop-blur sm:text-[11px]">
                {game.round_label}
                {game.group_name && ` · ${game.group_name}`}
            </span>
            {game.status === 'scheduled' ? (
                <Countdown at={game.scheduled_at} />
            ) : (
                <Score game={game} />
            )}
            <div className="space-y-0.5 text-center text-[11px] text-white/65 sm:text-xs">
                {game.scheduled_at && (
                    <p className="flex items-center justify-center gap-1">
                        <CalendarDays className="size-3.5 shrink-0" />
                        {formatGameTime(game.scheduled_at)}
                    </p>
                )}
                {game.venue && (
                    <p className="flex items-center justify-center gap-1">
                        <MapPin className="size-3.5 shrink-0" />
                        {game.venue}
                    </p>
                )}
            </div>
        </div>
    );
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Days, hours and minutes left for the kickoff, like a stadium screen.
 */
function Countdown({ at }: { at: string | null }) {
    const now = useNow(15_000);
    const left = at ? new Date(at).getTime() - now : 0;

    if (left <= 0) {
        return (
            <div className="rounded-2xl border border-white/10 bg-black/55 px-6 py-3 text-center shadow-2xl backdrop-blur">
                <span className="block font-display text-4xl leading-none sm:text-6xl">
                    VS
                </span>
                <span className="mt-1 block text-[10px] text-white/60 sm:text-xs">
                    {at ? 'Por comenzar' : 'Fecha por definir'}
                </span>
            </div>
        );
    }

    const parts = [
        { value: Math.floor(left / DAY), label: 'Días' },
        { value: Math.floor((left % DAY) / HOUR), label: 'Horas' },
        { value: Math.floor((left % HOUR) / MINUTE), label: 'Min' },
    ];

    return (
        <div
            role="timer"
            aria-label="Tiempo para el partido"
            className="flex divide-x divide-white/15 rounded-2xl border border-white/10 bg-black/55 py-3 shadow-2xl backdrop-blur"
        >
            {parts.map((part) => (
                <div
                    key={part.label}
                    className="flex w-12 flex-col items-center sm:w-20"
                >
                    <span className="font-display text-3xl leading-none tabular-nums sm:text-5xl">
                        {String(part.value).padStart(2, '0')}
                    </span>
                    <span className="mt-1 text-[10px] text-white/60 sm:text-xs">
                        {part.label}
                    </span>
                </div>
            ))}
        </div>
    );
}

function useNow(interval: number) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), interval);

        return () => clearInterval(timer);
    }, [interval]);

    return now;
}

function Score({ game }: { game: Game }) {
    const live = game.status === 'live';
    const sets = game.sets ?? [];
    const current = sets[sets.length - 1];

    return (
        <div
            className={cn(
                'rounded-2xl border bg-black/55 px-4 py-3 text-center shadow-2xl backdrop-blur sm:px-7 sm:py-4',
                live ? 'border-red-500/50' : 'border-white/10',
            )}
        >
            {live ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold tracking-wide">
                    <span className="size-1.5 animate-pulse rounded-full bg-white" />
                    EN VIVO
                </span>
            ) : (
                <span className="text-[10px] font-semibold tracking-widest text-white/60 uppercase sm:text-xs">
                    Final
                </span>
            )}
            <p
                key={`${game.home_score}-${game.away_score}`}
                className="mt-1 animate-in font-display text-5xl leading-none tabular-nums duration-500 zoom-in-125 sm:text-7xl"
            >
                {game.home_score}
                <span className="mx-1.5 text-white/35">-</span>
                {game.away_score}
            </p>
            {live && current && (
                <p className="mt-1 text-[11px] text-white/60 tabular-nums">
                    Set {sets.length}: {current.home}-{current.away}
                </p>
            )}
            {!live && sets.length > 0 && (
                <p className="mt-1 text-[11px] text-white/60 tabular-nums">
                    {sets.map((set) => `${set.home}-${set.away}`).join(' · ')}
                </p>
            )}
            {game.home_penalties !== null && (
                <p className="mt-1 text-[11px] text-white/60">
                    Penales {game.home_penalties}-{game.away_penalties}
                </p>
            )}
        </div>
    );
}

function TournamentHero({
    tournament,
    teams,
    registrationOpen,
    champion,
}: Props & { champion: GameTeam | null }) {
    return (
        // Tall enough to cover the near edge of the drawn pitch behind it.
        <section className="mx-auto min-h-96 max-w-6xl px-4 pt-6 pb-12 text-center sm:px-6 sm:pt-12 sm:pb-16">
            <TournamentTitle tournament={tournament} large />
            <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-white/70">
                <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-4" />
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

            {champion ? (
                <div className="mt-10 flex flex-col items-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange px-3 py-1 text-xs font-bold tracking-wide uppercase shadow-lg shadow-brand-orange/30">
                        <Trophy className="size-3.5" /> Campeón
                    </span>
                    <TeamCrest team={champion} size="xl" className="mt-5" />
                    <p className="mt-4 font-display text-4xl tracking-wide uppercase sm:text-5xl">
                        {champion.name}
                    </p>
                </div>
            ) : (
                registrationOpen && (
                    <Link
                        href={TeamRegistrationController.create(tournament)}
                        className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-orange px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-orange/30 transition hover:bg-brand-orange/90"
                    >
                        <ClipboardList className="size-4" /> Inscribir a mi
                        equipo
                    </Link>
                )
            )}
        </section>
    );
}

function GamesTab({
    live,
    upcoming,
    featured,
    standingOf,
    row,
    ...props
}: Props & {
    live: Game[];
    upcoming: Game[];
    featured: Game | null;
    standingOf: Map<number, Standing>;
    row: (game: Game) => ReactNode;
}) {
    return (
        <div className="space-y-12">
            {featured && (
                <HeadToHead
                    {...props}
                    game={featured}
                    standingOf={standingOf}
                />
            )}
            {live.length > 0 && (
                <section className="space-y-4">
                    <SectionTitle icon={<Radio className="text-red-500" />}>
                        En vivo ahora
                    </SectionTitle>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {live.map(row)}
                    </div>
                </section>
            )}
            {upcoming.length > 0 && (
                <section className="space-y-4">
                    <SectionTitle icon={<CalendarDays />}>
                        Próximos partidos
                    </SectionTitle>
                    <GamesByDay games={upcoming} row={row} />
                </section>
            )}
            {live.length === 0 && upcoming.length === 0 && (
                <Empty
                    icon={<CalendarDays />}
                    text="No hay partidos programados por ahora."
                />
            )}
        </div>
    );
}

type Stat = {
    key: string;
    label: string;
    home: number;
    away: number;
    better: 'more' | 'less' | null;
    signed: boolean;
};

const statLabels: Record<string, string> = {
    points: 'Puntos',
    played: 'Partidos jugados',
    won: 'Ganados',
    drawn: 'Empatados',
    lost: 'Perdidos',
};

const scoreLabels: Record<SportValue, Record<string, string>> = {
    football: {
        for: 'Goles a favor',
        against: 'Goles en contra',
        difference: 'Diferencia de gol',
    },
    volleyball: {
        for: 'Sets ganados',
        against: 'Sets perdidos',
        difference: 'Diferencia de sets',
    },
    basketball: {
        for: 'Puntos a favor',
        against: 'Puntos en contra',
        difference: 'Diferencia de puntos',
    },
};

/**
 * The two teams' table numbers side by side, points first, using the sport's columns.
 */
function compareStats(
    columns: Record<string, string>,
    sport: SportValue,
    home: StandingRow,
    away: StandingRow,
): Stat[] {
    const keys = Object.keys(columns) as (keyof StandingRow)[];
    const ordered = [
        ...keys.filter((key) => key === 'points'),
        ...keys.filter((key) => key !== 'points'),
    ];

    return ordered.map((key) => ({
        key,
        label: statLabels[key] ?? scoreLabels[sport][key] ?? columns[key],
        home: home[key] as number,
        away: away[key] as number,
        better:
            key === 'played'
                ? null
                : key === 'lost' || key === 'against'
                  ? 'less'
                  : 'more',
        signed: key === 'difference',
    }));
}

type Outcome = 'won' | 'drawn' | 'lost';
type FormResult = { game: Game; outcome: Outcome };

/**
 * How a finished game went for a team. The score decides; when it is level,
 * the winner (on penalties) or a draw.
 */
function outcomeFor(game: Game, teamId: number): Outcome {
    const isHome = game.home_team_id === teamId;
    const own = isHome ? game.home_score : game.away_score;
    const rival = isHome ? game.away_score : game.home_score;

    if (own !== rival) {
        return own > rival ? 'won' : 'lost';
    }

    if (game.winner_team_id === null) {
        return 'drawn';
    }

    return game.winner_team_id === teamId ? 'won' : 'lost';
}

/**
 * Last five finished games of a team, oldest first.
 */
function recentForm(games: Game[], teamId: number): FormResult[] {
    return games
        .filter(
            (g) =>
                g.status === 'finished' &&
                (g.home_team_id === teamId || g.away_team_id === teamId),
        )
        .slice(-5)
        .map((game) => ({ game, outcome: outcomeFor(game, teamId) }));
}

/**
 * How the two teams of the featured match compare: position, table numbers,
 * recent form, and the table with both of them highlighted.
 */
function HeadToHead({
    game,
    games,
    standings,
    standingOf,
    columns,
    qualifiers,
    tournament,
}: Props & { game: Game; standingOf: Map<number, Standing> }) {
    const home = game.home_team as GameTeam;
    const away = game.away_team as GameTeam;
    const homeStanding = standingOf.get(home.id);
    const awayStanding = standingOf.get(away.id);
    const stats =
        homeStanding && awayStanding
            ? compareStats(
                  columns,
                  tournament.sport,
                  homeStanding.row,
                  awayStanding.row,
              )
            : [];
    const homeForm = recentForm(games, home.id);
    const awayForm = recentForm(games, away.id);
    const tables = standings.filter((table) =>
        table.rows.some(
            (row) => row.team.id === home.id || row.team.id === away.id,
        ),
    );

    return (
        <section className="space-y-4">
            <SectionTitle icon={<Swords />}>Cara a cara</SectionTitle>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1220]">
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 bg-[radial-gradient(90%_140%_at_50%_0%,#0f4a63_0%,#0b1220_75%)] px-4 py-5 sm:px-6">
                    <HeadToHeadTeam team={home} standing={homeStanding} />
                    <span className="font-display text-2xl text-white/35">
                        VS
                    </span>
                    <HeadToHeadTeam
                        team={away}
                        standing={awayStanding}
                        reverse
                    />
                </div>

                {stats.length > 0 && (
                    <div className="space-y-4 border-t border-white/10 px-4 py-5 sm:px-6">
                        {stats.map((stat) => (
                            <StatCompare
                                key={stat.key}
                                stat={stat}
                                home={home}
                                away={away}
                            />
                        ))}
                    </div>
                )}

                {homeForm.length + awayForm.length > 0 ? (
                    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 border-t border-white/10 px-4 py-4 sm:px-6">
                        <FormChips form={homeForm} teamId={home.id} />
                        <span className="text-center text-[10px] leading-tight tracking-wide text-white/50 uppercase">
                            Últimos
                            <br />
                            partidos
                        </span>
                        <FormChips form={awayForm} teamId={away.id} reverse />
                    </div>
                ) : (
                    <p className="border-t border-white/10 px-6 py-4 text-center text-sm text-white/55">
                        Todavía no tienen partidos jugados para comparar.
                    </p>
                )}
            </div>

            {tables.length > 0 && (
                <div className="space-y-3 pt-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-white/70">
                        <ListOrdered className="size-4" /> Así van en la tabla
                    </h3>
                    {tables.map((table) => (
                        <StandingsTable
                            key={table.group_id ?? 'league'}
                            table={table}
                            columns={columns}
                            qualifiers={qualifiers}
                            highlight={[home.id, away.id]}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

function HeadToHeadTeam({
    team,
    standing,
    reverse = false,
}: {
    team: GameTeam;
    standing: Standing | undefined;
    reverse?: boolean;
}) {
    return (
        <div
            className={cn(
                'flex min-w-0 flex-col items-center gap-2 text-center sm:flex-row sm:gap-3 sm:text-left',
                reverse && 'sm:flex-row-reverse sm:text-right',
            )}
        >
            <TeamCrest team={team} size="md" />
            <div className="w-full min-w-0 sm:w-auto">
                <p className="truncate font-semibold">{team.name}</p>
                {standing && (
                    <p className="text-xs text-white/60">
                        <span className="font-display text-3xl leading-none text-white">
                            {standing.row.position}º
                        </span>{' '}
                        de {standing.table.rows.length}
                    </p>
                )}
            </div>
        </div>
    );
}

function StatCompare({
    stat,
    home,
    away,
}: {
    stat: Stat;
    home: GameTeam;
    away: GameTeam;
}) {
    const leader =
        stat.better === null || stat.home === stat.away
            ? null
            : stat.home > stat.away === (stat.better === 'more')
              ? 'home'
              : 'away';
    // Bars grow out from the middle; the shift keeps negative differences comparable.
    const shift = Math.min(stat.home, stat.away, 0);
    const max = Math.max(stat.home - shift, stat.away - shift, 1);
    const format = (value: number) =>
        stat.signed && value > 0 ? `+${value}` : String(value);

    return (
        <div>
            <div className="flex items-baseline justify-between gap-3">
                <span
                    className={cn(
                        'font-display text-2xl leading-none tabular-nums',
                        leader === 'away' && 'text-white/45',
                    )}
                >
                    {format(stat.home)}
                </span>
                <span className="text-center text-xs text-white/60">
                    {stat.label}
                </span>
                <span
                    className={cn(
                        'font-display text-2xl leading-none tabular-nums',
                        leader === 'home' && 'text-white/45',
                    )}
                >
                    {format(stat.away)}
                </span>
            </div>
            <div aria-hidden className="mt-1.5 flex gap-1">
                <div className="flex h-1.5 flex-1 justify-end overflow-hidden rounded-full bg-white/10">
                    <div
                        className="h-full rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.2)] transition-[width] duration-700"
                        style={{
                            width: `${((stat.home - shift) / max) * 100}%`,
                            backgroundColor: home.color ?? '#64748b',
                            opacity: leader === 'away' ? 0.45 : 1,
                        }}
                    />
                </div>
                <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                        className="h-full rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.2)] transition-[width] duration-700"
                        style={{
                            width: `${((stat.away - shift) / max) * 100}%`,
                            backgroundColor: away.color ?? '#64748b',
                            opacity: leader === 'home' ? 0.45 : 1,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

const outcomes = {
    won: { letter: 'G', label: 'Ganó', className: 'bg-emerald-500' },
    drawn: { letter: 'E', label: 'Empató', className: 'bg-slate-500' },
    lost: { letter: 'P', label: 'Perdió', className: 'bg-red-500' },
};

function FormChips({
    form,
    teamId,
    reverse = false,
}: {
    form: FormResult[];
    teamId: number;
    reverse?: boolean;
}) {
    if (form.length === 0) {
        return (
            <span
                className={cn('text-xs text-white/40', reverse && 'text-right')}
            >
                Sin partidos
            </span>
        );
    }

    return (
        <span className={cn('flex flex-wrap gap-1', reverse && 'justify-end')}>
            {form.map(({ game, outcome }) => {
                const isHome = game.home_team_id === teamId;
                const rival = isHome ? game.away_team : game.home_team;
                const score = isHome
                    ? `${game.home_score}-${game.away_score}`
                    : `${game.away_score}-${game.home_score}`;
                const title = `${outcomes[outcome].label} ${score} vs ${rival?.name ?? 'rival'}`;

                return (
                    <span
                        key={game.id}
                        title={title}
                        aria-label={title}
                        className={cn(
                            'flex size-6 items-center justify-center rounded-md text-[11px] font-bold text-white',
                            outcomes[outcome].className,
                        )}
                    >
                        {outcomes[outcome].letter}
                    </span>
                );
            })}
        </span>
    );
}

/**
 * A game in the lists: both teams with their place in the table. Tapping it
 * puts it in the header and in "Cara a cara".
 */
function MatchRow({
    game,
    standingOf,
    featured,
    onPick,
}: {
    game: Game;
    standingOf: Map<number, Standing>;
    featured: boolean;
    onPick: (game: Game) => void;
}) {
    const live = game.status === 'live';
    const played = game.status !== 'scheduled';
    const pickable = game.home_team !== null && game.away_team !== null;
    const sets = game.sets ?? [];
    const lost = (team: GameTeam | null) =>
        game.status === 'finished' &&
        team !== null &&
        outcomeFor(game, team.id) === 'lost';

    return (
        <button
            type="button"
            disabled={!pickable}
            aria-pressed={featured}
            onClick={() => onPick(game)}
            className={cn(
                'group block w-full rounded-2xl border bg-[#0b1220] p-3 text-left transition-colors enabled:hover:border-white/30 sm:p-4',
                live ? 'border-red-500/50' : 'border-white/10',
                featured &&
                    'border-brand-orange/70 ring-1 ring-brand-orange/40',
            )}
        >
            <span className="flex items-center gap-2 text-[11px] text-white/55">
                <span className="shrink-0 font-semibold tracking-wide text-white/75 uppercase">
                    {game.round_label}
                    {game.group_name && ` · ${game.group_name}`}
                </span>
                {game.scheduled_at && (
                    <span className="inline-flex shrink-0 items-center gap-1">
                        <Clock className="size-3" />
                        {game.scheduled_at.slice(11, 16)}
                    </span>
                )}
                {game.venue && (
                    <span className="inline-flex min-w-0 items-center gap-1">
                        <MapPin className="size-3 shrink-0" />
                        <span className="truncate">{game.venue}</span>
                    </span>
                )}
                <span className="ml-auto shrink-0">
                    {live ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">
                            <span className="size-1.5 animate-pulse rounded-full bg-white" />
                            EN VIVO
                        </span>
                    ) : (
                        played && (
                            <span className="rounded-full bg-white/10 px-2 py-0.5 font-medium text-white/70">
                                Final
                            </span>
                        )
                    )}
                </span>
            </span>

            <span className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                <RowTeam
                    team={game.home_team}
                    standing={
                        game.home_team
                            ? standingOf.get(game.home_team.id)
                            : undefined
                    }
                    dim={lost(game.home_team)}
                />
                <span className="px-1 text-center font-display leading-none tabular-nums">
                    {played ? (
                        <span className="text-3xl">
                            {game.home_score}
                            <span className="mx-1 text-white/35">-</span>
                            {game.away_score}
                        </span>
                    ) : (
                        <span className="text-2xl text-white/40">VS</span>
                    )}
                </span>
                <RowTeam
                    team={game.away_team}
                    standing={
                        game.away_team
                            ? standingOf.get(game.away_team.id)
                            : undefined
                    }
                    dim={lost(game.away_team)}
                    reverse
                />
            </span>

            {played && (sets.length > 0 || game.home_penalties !== null) && (
                <span className="mt-2 block text-center text-[11px] text-white/50 tabular-nums">
                    {game.home_penalties !== null
                        ? `Penales ${game.home_penalties}-${game.away_penalties}`
                        : live
                          ? `Set ${sets.length}: ${sets[sets.length - 1].home}-${sets[sets.length - 1].away}`
                          : sets
                                .map((set) => `${set.home}-${set.away}`)
                                .join(' · ')}
                </span>
            )}

            {pickable && (
                <span
                    className={cn(
                        'mt-3 flex items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-medium transition-colors',
                        featured
                            ? 'bg-brand-orange/15 text-orange-300'
                            : 'bg-white/[0.05] text-white/65 group-hover:bg-white/10 group-hover:text-white',
                    )}
                >
                    <Swords className="size-3.5" />
                    {featured ? 'Destacado arriba' : 'Ver cara a cara'}
                </span>
            )}
        </button>
    );
}

function RowTeam({
    team,
    standing,
    dim,
    reverse = false,
}: {
    team: GameTeam | null;
    standing: Standing | undefined;
    dim: boolean;
    reverse?: boolean;
}) {
    if (!team) {
        return (
            <span
                className={cn(
                    'truncate text-sm text-white/40 italic',
                    reverse && 'text-right',
                )}
            >
                Por definir
            </span>
        );
    }

    return (
        <span
            className={cn(
                'flex min-w-0 items-center gap-2',
                reverse && 'flex-row-reverse text-right',
                dim && 'opacity-55',
            )}
        >
            <TeamCrest team={team} size="sm" />
            <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                    {team.name}
                </span>
                {standing && (
                    <span className="block text-[11px] text-white/50 tabular-nums">
                        {standing.row.position}º ·{' '}
                        {plural(standing.row.points, 'pt', 'pts')}
                    </span>
                )}
            </span>
        </span>
    );
}

/**
 * Games under a heading per day, keeping the order they come in.
 */
function GamesByDay({
    games,
    row,
}: {
    games: Game[];
    row: (game: Game) => ReactNode;
}) {
    const days = new Map<string, Game[]>();
    for (const game of games) {
        const key = game.scheduled_at?.slice(0, 10) ?? 'sin-fecha';
        days.set(key, [...(days.get(key) ?? []), game]);
    }

    return (
        <div className="space-y-6">
            {[...days.entries()].map(([day, dayGames]) => (
                <div key={day} className="space-y-3">
                    <h3 className="text-sm font-semibold text-white/60 first-letter:uppercase">
                        {day === 'sin-fecha'
                            ? 'Sin fecha'
                            : formatDate(day, {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                              })}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {dayGames.map(row)}
                    </div>
                </div>
            ))}
        </div>
    );
}

function StandingsTab({
    standings,
    columns,
    qualifiers,
    featured,
}: Props & { featured: Game | null }) {
    const highlight = featured
        ? [featured.home_team_id, featured.away_team_id].filter(
              (id): id is number => id !== null,
          )
        : [];

    return (
        <div className="space-y-4">
            <div
                className={cn(
                    'grid gap-4',
                    standings.length > 1 && 'xl:grid-cols-2',
                )}
            >
                {standings.map((table) => (
                    <StandingsTable
                        key={table.group_id ?? 'league'}
                        table={table}
                        columns={columns}
                        qualifiers={qualifiers}
                        highlight={highlight}
                    />
                ))}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/55">
                {qualifiers && (
                    <p className="flex items-center gap-2">
                        <span className="h-3 w-1 rounded bg-brand" />
                        Clasifican a la eliminatoria ({qualifiers} por grupo)
                    </p>
                )}
                {featured && (
                    <p className="flex items-center gap-2">
                        <Swords className="size-3.5" />
                        Resaltados: {featured.home_team?.name} y{' '}
                        {featured.away_team?.name}
                    </p>
                )}
            </div>
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

function TeamsTab({
    teams,
    groups,
    standingOf,
}: Props & { standingOf: Map<number, Standing> }) {
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
        <div className="space-y-8">
            {sections.map((section) => (
                <section key={section.title ?? 'all'} className="space-y-3">
                    {section.title && (
                        <SectionTitle icon={<Users />}>
                            {section.title}
                        </SectionTitle>
                    )}
                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {section.teams.map((team) => {
                            const standing = standingOf.get(team.id);

                            return (
                                <li
                                    key={team.id}
                                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1220] p-3"
                                >
                                    <TeamCrest team={team} size="sm" />
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-semibold">
                                            {team.name}
                                        </span>
                                        {standing && (
                                            <span className="block text-[11px] text-white/50">
                                                {standing.row.position}º ·{' '}
                                                {plural(
                                                    standing.row.points,
                                                    'pt',
                                                    'pts',
                                                )}
                                            </span>
                                        )}
                                    </span>
                                </li>
                            );
                        })}
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
                    className="flex gap-3 rounded-2xl border border-white/10 bg-[#0b1220] p-4 text-sm text-white/80"
                >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-orange/15 text-xs font-bold text-orange-300">
                        {i + 1}
                    </span>
                    {rule.display_text}
                </li>
            ))}
        </ol>
    );
}

/**
 * Side card with a tab on top, like the info panels of a match page.
 */
function InfoCard({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="relative pt-7">
            <h2 className="absolute top-0 left-1/2 -translate-x-1/2 rounded-t-2xl bg-[#0f1626] px-6 pt-2 pb-1 text-xs font-medium whitespace-nowrap text-white/70">
                <span
                    aria-hidden
                    className="absolute bottom-0 -left-4 size-4 bg-[radial-gradient(circle_at_0_0,transparent_15.5px,#0f1626_16px)]"
                />
                <span
                    aria-hidden
                    className="absolute -right-4 bottom-0 size-4 bg-[radial-gradient(circle_at_100%_0,transparent_15.5px,#0f1626_16px)]"
                />
                {title}
            </h2>
            <div className="rounded-3xl bg-[#0f1626] p-5">{children}</div>
        </section>
    );
}

function InfoRow({
    icon,
    label,
    children,
}: {
    icon: ReactNode;
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
            <span className="flex shrink-0 items-center gap-2 text-white/85 [&_svg]:size-4 [&_svg]:text-white/50">
                {icon}
                {label}
            </span>
            <span className="min-w-0 text-right text-white/60">{children}</span>
        </div>
    );
}

function MatchInfo({
    game,
    tournament,
}: {
    game: Game;
    tournament: Tournament;
}) {
    const [copied, copy] = useClipboard();
    const url = `${window.location.origin}${window.location.pathname}?tab=partidos&partido=${game.id}`;

    const share = async () => {
        if (navigator.share) {
            // Closing the share sheet rejects; nothing else to do then.
            await navigator
                .share({
                    title: `${game.home_team?.name} vs ${game.away_team?.name} · ${tournament.name}`,
                    url,
                })
                .catch(() => undefined);

            return;
        }

        await copy(url);
    };

    return (
        <InfoCard title="Info del partido">
            <div className="divide-y divide-white/[0.07]">
                <InfoRow icon={<CircleDot />} label="Estado">
                    {game.status === 'live' ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-red-400">
                            <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
                            En vivo
                        </span>
                    ) : (
                        game.status_label
                    )}
                </InfoRow>
                <InfoRow icon={<CalendarDays />} label="Fecha">
                    {game.scheduled_at
                        ? formatGameTime(game.scheduled_at)
                        : 'Por definir'}
                </InfoRow>
                {game.venue && (
                    <InfoRow icon={<MapPin />} label="Cancha">
                        {game.venue}
                    </InfoRow>
                )}
                <InfoRow icon={<Flag />} label="Fase">
                    {game.round_label}
                    {game.group_name && ` · ${game.group_name}`}
                </InfoRow>
            </div>
            <button
                type="button"
                onClick={share}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-white/40 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10"
            >
                {copied === url ? (
                    <>
                        <Check className="size-4" /> Enlace copiado
                    </>
                ) : (
                    <>
                        <Share2 className="size-4" /> Compartir partido
                    </>
                )}
            </button>
        </InfoCard>
    );
}

function TournamentInfo({
    tournament,
    teams,
    registrationOpen,
    champion,
}: Props & { champion: GameTeam | null }) {
    return (
        <InfoCard title="Sobre el torneo">
            {tournament.description && (
                <p className="mb-2 text-sm whitespace-pre-line text-white/70">
                    {tournament.description}
                </p>
            )}
            <div className="divide-y divide-white/[0.07]">
                <InfoRow
                    icon={<SportIcon sport={tournament.sport} />}
                    label="Deporte"
                >
                    {tournament.variant_label ?? tournament.sport_label}
                </InfoRow>
                <InfoRow icon={<ListOrdered />} label="Formato">
                    {tournament.format_label}
                </InfoRow>
                <InfoRow icon={<CalendarDays />} label="Inicio">
                    {formatDate(tournament.start_date)}
                </InfoRow>
                {tournament.location && (
                    <InfoRow icon={<MapPin />} label="Lugar">
                        {tournament.location}
                    </InfoRow>
                )}
                <InfoRow icon={<Users />} label="Equipos">
                    {teams.length}
                </InfoRow>
                {champion && (
                    <InfoRow icon={<Trophy />} label="Campeón">
                        {champion.name}
                    </InfoRow>
                )}
            </div>
            {registrationOpen && (
                <Link
                    href={TeamRegistrationController.create(tournament)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand-orange py-2.5 text-sm font-semibold text-white transition hover:bg-brand-orange/90"
                >
                    <ClipboardList className="size-4" /> Inscribir a mi equipo
                </Link>
            )}
        </InfoCard>
    );
}

function SectionTitle({
    icon,
    children,
}: {
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <h2 className="flex items-center gap-2 font-display text-3xl leading-none tracking-wide uppercase [&_svg]:size-5">
            {icon}
            {children}
        </h2>
    );
}

function Empty({ icon, text }: { icon: ReactNode; text: string }) {
    return (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-white/15 p-10 text-center text-sm text-white/60 [&_svg]:size-8">
            {icon}
            {text}
        </div>
    );
}
