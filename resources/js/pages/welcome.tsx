import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    ChevronDown,
    CircleCheck,
    ListOrdered,
    Network,
    Radio,
    ScrollText,
    Share2,
    Trophy,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import MatchController from '@/actions/App/Http/Controllers/Public/MatchController';
import PageController from '@/actions/App/Http/Controllers/Public/PageController';
import PublicTournamentController from '@/actions/App/Http/Controllers/Public/TournamentController';
import TournamentController from '@/actions/App/Http/Controllers/TournamentController';
import { LandingFooter, LandingNav } from '@/components/landing';
import { MatchCard } from '@/components/match-card';
import type { MatchCardData } from '@/components/match-card';
import { SportIcon } from '@/components/sport-icon';
import { TeamCrest } from '@/components/team-crest';
import { TournamentCard } from '@/components/tournament-card';
import { cn } from '@/lib/utils';
import { register } from '@/routes';
import type { GameTeam, Tournament } from '@/types/tournament';

type Stats = { tournaments: number; teams: number; games: number };

type Images = {
    stadium: string | null;
    player: string | null;
    trophy: string | null;
};

type Props = {
    tournaments: Tournament[];
    stats: Stats;
    upcoming: MatchCardData[];
    results: MatchCardData[];
    crests: GameTeam[];
    images: Images;
};

type Href = ReturnType<typeof register>;

export default function Welcome({
    tournaments,
    stats,
    upcoming,
    results,
    crests,
    images,
}: Props) {
    const { auth } = usePage().props;
    const startHref = auth.user ? TournamentController.create() : register();

    return (
        // The landing is always dark, like a stadium at night.
        <div className="dark relative min-h-svh overflow-x-hidden bg-[#04070d] font-sans text-white">
            <Head title="Torneos deportivos amateur" />
            <Stadium image={images.stadium} />

            <div className="relative mx-auto max-w-6xl space-y-6 px-3 pt-3 sm:space-y-10 sm:px-6 sm:pt-6">
                <div className="overflow-hidden rounded-[28px] border border-white/15 bg-black/10 shadow-2xl">
                    <LandingNav />
                    <Hero startHref={startHref} />
                    <About
                        stats={stats}
                        crests={crests}
                        trophy={images.trophy}
                    />
                </div>

                <Matches upcoming={upcoming} results={results} />
                {tournaments.length > 0 && (
                    <Tournaments tournaments={tournaments} />
                )}
                <Features />
                <Community startHref={startHref} player={images.player} />
            </div>

            <LandingFooter />
        </div>
    );
}

/**
 * Night stadium: floodlights, stands and a pitch in perspective (or a photo, when there is one).
 */
function Stadium({ image }: { image: string | null }) {
    return (
        <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[1150px] overflow-hidden"
        >
            {image ? (
                <img
                    src={image}
                    alt=""
                    className="absolute inset-0 size-full object-cover object-top opacity-80"
                />
            ) : (
                <>
                    <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_0%,#0e4d6e_0%,#08263b_38%,#04070d_78%)]" />
                    {/* Floodlights and their beams. */}
                    <div className="absolute -top-16 left-[6%] h-44 w-80 rounded-full bg-cyan-100/35 blur-3xl" />
                    <div className="absolute -top-16 right-[6%] h-44 w-80 rounded-full bg-cyan-100/35 blur-3xl" />
                    <div className="absolute top-0 left-[18%] h-[620px] w-44 origin-top rotate-[22deg] bg-gradient-to-b from-white/14 to-transparent blur-2xl" />
                    <div className="absolute top-0 right-[18%] h-[620px] w-44 origin-top -rotate-[22deg] bg-gradient-to-b from-white/14 to-transparent blur-2xl" />
                    {/* Crowd in the stands. */}
                    <div className="absolute inset-x-0 top-[200px] h-56 bg-[radial-gradient(rgb(255_255_255/0.16)_1px,transparent_1.6px)] [mask-image:linear-gradient(to_bottom,transparent,black_40%,black_60%,transparent)] bg-[size:8px_8px]" />
                    {/* Pitch in perspective, right behind the hero. */}
                    <div className="absolute inset-x-[-50%] bottom-[430px] h-[1100px] origin-bottom [transform:perspective(600px)_rotateX(62deg)]">
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,#11612e_0_90px,#0d5326_90px_180px)]" />
                        <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-white/45" />
                        <div className="absolute top-1/2 left-1/2 size-[360px] -translate-1/2 rounded-full border-4 border-white/45" />
                        <div className="absolute inset-x-0 top-0 h-1 bg-white/45" />
                    </div>
                </>
            )}
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-b from-transparent via-[#04070d]/70 to-[#04070d]" />
        </div>
    );
}

function Hero({ startHref }: { startHref: Href }) {
    return (
        <section className="relative">
            {/* Darker on the left so the headline always reads well. */}
            <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-r from-[#04070d]/85 via-[#04070d]/40 to-transparent"
            />

            <div className="relative grid items-center gap-10 px-5 pt-6 pb-16 sm:px-8 sm:pt-10 lg:grid-cols-[1.15fr_1fr] lg:pb-24">
                <div className="animate-in duration-700 fade-in slide-in-from-bottom-4">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur">
                        <Trophy className="size-3.5 text-brand-orange" />
                        Fútbol · Vóley · Básquet
                    </span>

                    <h1 className="mt-5 font-display text-[3.4rem] leading-[0.88] tracking-wide uppercase sm:text-7xl lg:text-[5.5rem]">
                        Organiza tu torneo
                        <span className="block text-brand-orange">
                            Vívelo en vivo
                        </span>
                    </h1>

                    <p className="mt-5 max-w-md text-sm text-white/80 sm:text-base">
                        Calendario automático, marcador en tiempo real, tabla de
                        posiciones y cuadro de eliminatoria. Todo desde tu
                        teléfono, para ligas de barrio, colegios y empresas.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link
                            href={startHref}
                            className="inline-flex items-center gap-2 rounded-full bg-brand-orange px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-orange/30 transition hover:bg-brand-orange/90"
                        >
                            Crear mi torneo <ArrowRight className="size-4" />
                        </Link>
                        <Link
                            href={PublicTournamentController.index()}
                            className="inline-flex items-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                            Ver torneos
                        </Link>
                    </div>
                </div>

                <LiveScoreDemo />
            </div>
        </section>
    );
}

const demoScores: [number, number][] = [
    [1, 1],
    [2, 1],
    [2, 2],
    [3, 2],
];

/**
 * Illustrative live scoreboard: the score advances every few seconds.
 */
function LiveScoreDemo() {
    const [step, setStep] = useState(0);
    const [minute, setMinute] = useState(61);
    const [home, away] = demoScores[step];
    const scorer =
        step === 0 ? null : home > demoScores[step - 1][0] ? 'home' : 'away';

    useEffect(() => {
        const timer = setInterval(() => {
            setStep((s) => (s + 1) % demoScores.length);
            setMinute((m) => (m >= 88 ? 61 : m + 9));
        }, 3500);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative mx-auto w-full max-w-sm animate-in duration-1000 fade-in slide-in-from-bottom-8">
            <div className="animate-float rounded-3xl border border-white/15 bg-white/95 p-5 text-slate-900 shadow-2xl shadow-black/40">
                <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-red-600">
                        <span className="relative flex size-2">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
                            <span className="relative inline-flex size-2 rounded-full bg-red-500" />
                        </span>
                        EN VIVO · {minute}'
                    </span>
                    <span className="text-slate-500">
                        Liga Colonia · Jornada 5
                    </span>
                </div>

                <div className="mt-5 flex items-center justify-between">
                    <DemoTeam name="Halcones" color="#0058F8" />
                    <span
                        key={step}
                        className="animate-in font-display text-6xl tracking-wide tabular-nums duration-500 zoom-in-125"
                    >
                        {home}
                        <span className="mx-2 text-slate-300">-</span>
                        {away}
                    </span>
                    <DemoTeam name="Tigres" color="#F87000" />
                </div>
            </div>

            <div
                key={`goal-${step}`}
                className={cn(
                    'absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-brand-orange px-4 py-1.5 text-sm font-bold whitespace-nowrap text-white shadow-lg',
                    scorer
                        ? 'animate-in duration-500 zoom-in-50 fade-in'
                        : 'opacity-0',
                )}
            >
                ¡Gol de {scorer === 'away' ? 'Tigres' : 'Halcones'}!
            </div>
        </div>
    );
}

function DemoTeam({ name, color }: { name: string; color: string }) {
    return (
        <span className="flex w-20 flex-col items-center gap-2">
            <TeamCrest team={{ name, color, logo_url: null }} size="md" />
            <span className="text-sm font-semibold">{name}</span>
        </span>
    );
}

function About({
    stats,
    crests,
    trophy,
}: {
    stats: Stats;
    crests: GameTeam[];
    trophy: string | null;
}) {
    const half = Math.ceil(crests.length / 2);
    const items = [
        { value: stats.tournaments, label: 'Torneos' },
        { value: stats.teams, label: 'Equipos' },
        { value: stats.games, label: 'Partidos jugados' },
        { value: 3, label: 'Deportes' },
    ];

    return (
        <>
            {/* "Scroll" tab joining the hero with the white section. */}
            <div className="relative flex justify-center">
                <a
                    href="#nosotros"
                    className="relative flex items-center gap-1 rounded-t-[22px] bg-white px-7 pt-2.5 pb-1 text-xs font-medium text-slate-500"
                >
                    <span className="absolute bottom-0 -left-5 size-5 bg-[radial-gradient(circle_at_0_0,transparent_19.5px,white_20px)]" />
                    <span className="absolute -right-5 bottom-0 size-5 bg-[radial-gradient(circle_at_100%_0,transparent_19.5px,white_20px)]" />
                    Desliza <ChevronDown className="size-3.5" />
                </a>
            </div>

            <section
                id="nosotros"
                className="scroll-mt-4 bg-white px-5 pt-10 pb-12 text-slate-900 sm:px-10 sm:pt-12"
            >
                <p className="mx-auto max-w-4xl text-center font-display text-3xl leading-[1.05] tracking-wide uppercase sm:text-4xl lg:text-5xl">
                    Somos la cancha digital de tu torneo: calendario, marcador
                    en vivo, tabla y cuadro para que jugadores, hinchas y
                    organizadores vivan cada partido.
                </p>

                <div className="mt-10 flex items-end justify-center gap-2 sm:gap-4">
                    <CrestRow teams={crests.slice(0, half)} />
                    <span className="mx-2 flex shrink-0 flex-col items-center sm:mx-6">
                        {trophy ? (
                            <img
                                src={trophy}
                                alt=""
                                className="h-28 w-auto drop-shadow-xl sm:h-40"
                            />
                        ) : (
                            <img
                                src="/images/logo-icon.png"
                                alt="Retazo"
                                className="h-24 w-auto drop-shadow-xl sm:h-32"
                            />
                        )}
                    </span>
                    <CrestRow teams={crests.slice(half)} />
                </div>

                <dl className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-y-8 sm:grid-cols-4 sm:divide-x sm:divide-slate-200">
                    {items.map((item) => (
                        <div key={item.label} className="text-center">
                            <dt className="sr-only">{item.label}</dt>
                            <dd className="font-display text-5xl tracking-wide">
                                {item.value.toLocaleString('es')}
                            </dd>
                            <dd className="text-sm text-slate-500">
                                {item.label}
                            </dd>
                        </div>
                    ))}
                </dl>
            </section>
        </>
    );
}

/**
 * Crests of real teams; the sports themselves when there are no teams yet.
 */
function CrestRow({ teams }: { teams: GameTeam[] }) {
    if (teams.length === 0) {
        return (
            <span className="hidden items-center gap-3 text-slate-300 sm:flex">
                <SportIcon sport="football" className="size-10" />
                <SportIcon sport="volleyball" className="size-10" />
                <SportIcon sport="basketball" className="size-10" />
            </span>
        );
    }

    return (
        <span className="flex items-end gap-1.5 sm:gap-3">
            {teams.map((team, i) => (
                <TeamCrest
                    key={team.id}
                    team={team}
                    size={i % 2 === 0 ? 'md' : 'sm'}
                    className={cn(
                        i % 2 === 0 ? '-translate-y-6' : 'translate-y-0',
                        // One crest per side on phones, more as the screen grows.
                        i >= 1 && i < 3 && 'hidden sm:inline-flex',
                        i >= 3 && 'hidden lg:inline-flex',
                    )}
                />
            ))}
        </span>
    );
}

function Matches({
    upcoming,
    results,
}: {
    upcoming: MatchCardData[];
    results: MatchCardData[];
}) {
    const [tab, setTab] = useState<'upcoming' | 'results'>(
        upcoming.length > 0 || results.length === 0 ? 'upcoming' : 'results',
    );
    const games = tab === 'upcoming' ? upcoming : results;

    return (
        <section
            id="partidos"
            className="scroll-mt-4 rounded-[28px] border border-white/10 bg-[#070b14]/90 p-4 backdrop-blur sm:p-8"
        >
            <h2 className="text-center font-display text-4xl tracking-wide uppercase sm:text-5xl">
                Partidos y resultados
            </h2>

            <div className="mt-5 flex justify-center gap-2">
                {(
                    [
                        ['upcoming', 'Próximos partidos'],
                        ['results', 'Resultados'],
                    ] as const
                ).map(([key, label]) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setTab(key)}
                        className={cn(
                            'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                            tab === key
                                ? 'border-white/40 bg-white/15 text-white'
                                : 'border-white/15 text-white/70 hover:text-white',
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {games.length === 0 ? (
                <p className="mt-8 rounded-3xl border border-dashed border-white/15 p-10 text-center text-sm text-white/60">
                    {tab === 'upcoming'
                        ? 'No hay partidos programados por ahora.'
                        : 'Todavía no hay resultados.'}
                </p>
            ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {games.map((game) => (
                        <MatchCard key={game.id} game={game} />
                    ))}
                </div>
            )}

            <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                    href={MatchController.index()}
                    className="rounded-full border border-white/30 px-6 py-2.5 text-sm font-medium hover:bg-white/10"
                >
                    Ver todos los partidos
                </Link>
                <Link
                    href={PublicTournamentController.index()}
                    className="rounded-full px-6 py-2.5 text-sm font-medium text-white/70 hover:text-white"
                >
                    Ver torneos
                </Link>
            </div>
        </section>
    );
}

function Tournaments({ tournaments }: { tournaments: Tournament[] }) {
    return (
        <section className="space-y-6">
            <h2 className="text-center font-display text-4xl tracking-wide uppercase sm:text-5xl">
                Torneos en juego
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tournaments.map((tournament) => (
                    <TournamentCard
                        key={tournament.id}
                        tournament={tournament}
                    />
                ))}
            </div>
        </section>
    );
}

const features = [
    {
        icon: CalendarDays,
        title: 'Calendario automático',
        text: 'Liga, eliminatoria o grupos, con descansos, horarios y canchas.',
    },
    {
        icon: Radio,
        title: 'Marcador en vivo',
        text: 'Botones grandes de +1 para anotar desde la cancha.',
    },
    {
        icon: ListOrdered,
        title: 'Tabla de posiciones',
        text: 'Con la puntuación de cada deporte y tus desempates.',
    },
    {
        icon: Network,
        title: 'Cuadro de eliminatoria',
        text: 'El ganador avanza solo hasta la gran final.',
    },
    {
        icon: Share2,
        title: 'Inscripción por enlace',
        text: 'Los equipos se inscriben solos y tú los apruebas.',
    },
    {
        icon: ScrollText,
        title: 'Reglas claras',
        text: 'Reglas sugeridas por deporte, listas para ajustar.',
    },
];

function Features() {
    return (
        <section id="como-funciona" className="scroll-mt-4 space-y-6">
            <h2 className="text-center font-display text-4xl tracking-wide uppercase sm:text-5xl">
                Todo para tu torneo
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {features.map(({ icon: Icon, title, text }) => (
                    <div
                        key={title}
                        className="flex gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5"
                    >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand/20 text-blue-300">
                            <Icon className="size-5" />
                        </span>
                        <div>
                            <h3 className="font-semibold">{title}</h3>
                            <p className="mt-0.5 text-sm text-white/60">
                                {text}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-center">
                <Link
                    href={PageController.howItWorks()}
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-2.5 text-sm font-medium hover:bg-white/10"
                >
                    Ver cómo funciona <ArrowRight className="size-4" />
                </Link>
            </div>
        </section>
    );
}

function Community({
    startHref,
    player,
}: {
    startHref: Href;
    player: string | null;
}) {
    const points = [
        'Fútbol, vóley y básquet',
        'Marcador en vivo',
        'Tabla y cuadro solos',
        'Desde el teléfono',
    ];

    return (
        <section className="relative grid overflow-hidden rounded-[28px] border border-white/10 lg:grid-cols-[1fr_1.15fr]">
            <div className="relative z-10 bg-white p-6 text-slate-900 sm:p-10 lg:rounded-r-[48px]">
                <h2 className="font-display text-5xl leading-none tracking-wide uppercase">
                    Arma tu torneo hoy
                </h2>
                <p className="mt-4 max-w-md text-sm text-slate-600">
                    Cada gol, cada punto y cada canasta queda en la tabla al
                    instante. Comparte el enlace por WhatsApp y que todo el
                    barrio siga el torneo desde su teléfono.
                </p>
                <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    {points.map((point) => (
                        <li key={point} className="flex items-center gap-2">
                            <CircleCheck className="size-4 shrink-0 text-brand" />
                            {point}
                        </li>
                    ))}
                </ul>
                <Link
                    href={startHref}
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-orange px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-orange/30 hover:bg-brand-orange/90"
                >
                    Crear mi torneo <ArrowRight className="size-4" />
                </Link>
            </div>

            <div className="relative min-h-64 lg:-ml-12">
                {player ? (
                    <img
                        src={player}
                        alt=""
                        className="absolute inset-0 size-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(80%_90%_at_70%_30%,#0f4a63_0%,#0b1220_60%,#04070d_100%)]">
                        <div className="absolute top-8 right-10 size-24 rounded-full bg-cyan-100/25 blur-2xl" />
                        <img
                            src="/images/logo-icon.png"
                            alt=""
                            className="absolute top-1/2 left-1/2 w-56 -translate-1/2 animate-float drop-shadow-[0_20px_40px_rgb(0_88_248/0.45)] sm:w-72"
                        />
                        <SportIcon
                            sport="volleyball"
                            className="absolute bottom-8 left-[18%] size-12 text-white/25"
                        />
                        <SportIcon
                            sport="basketball"
                            className="absolute top-10 left-[30%] size-10 text-brand-orange/50"
                        />
                    </div>
                )}
            </div>
        </section>
    );
}
