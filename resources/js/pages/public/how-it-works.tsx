import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    ChevronDown,
    CircleCheck,
    ClipboardPen,
    Eye,
    Network,
    Radio,
    ScrollText,
    Share2,
    Shuffle,
    Trophy,
    UserCog,
    Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import PublicTournamentController from '@/actions/App/Http/Controllers/Public/TournamentController';
import TournamentController from '@/actions/App/Http/Controllers/TournamentController';
import { SportIcon } from '@/components/sport-icon';
import LandingLayout from '@/layouts/landing-layout';
import { register } from '@/routes';
import type { SportOption } from '@/types/tournament';

type SportInfo = SportOption & {
    scoreIncrements: number[];
    penaltiesInKnockout: boolean;
    rules: string[];
};

const steps = [
    {
        icon: Trophy,
        title: 'Crea tu torneo',
        text: 'Elige el deporte, la variante y el formato. Ajusta la puntuación y el orden de los desempates.',
    },
    {
        icon: Users,
        title: 'Suma los equipos',
        text: 'Agrégalos tú o comparte el enlace de inscripción: se inscriben sin crear cuenta y tú los apruebas.',
    },
    {
        icon: ScrollText,
        title: 'Define las reglas',
        text: 'Cada deporte trae reglas sugeridas. Actívalas, cambia los valores o escribe las tuyas.',
    },
    {
        icon: CalendarDays,
        title: 'Genera el calendario',
        text: 'En un toque: jornadas, horarios, canchas y descansos, sin choques de horario.',
    },
    {
        icon: Radio,
        title: 'Anota en vivo',
        text: 'Tú o tus anotadores marcan desde el teléfono con botones grandes de +1.',
    },
    {
        icon: Share2,
        title: 'Comparte y sigue',
        text: 'Un enlace público con marcadores en vivo, tabla, cuadro y reglas. Ideal para WhatsApp.',
    },
];

const formats = [
    {
        icon: CalendarDays,
        title: 'Todos contra todos',
        points: [
            'Cada equipo juega contra todos los demás.',
            'Ida y vuelta opcional.',
            'Con número impar de equipos, uno descansa en cada jornada.',
        ],
    },
    {
        icon: Network,
        title: 'Eliminatoria directa',
        points: [
            'Cuadro de llaves hasta la final.',
            'Si no son 4, 8 o 16 equipos, los mejores pasan directo a la segunda ronda.',
            'El ganador avanza solo a la siguiente ronda.',
        ],
    },
    {
        icon: Shuffle,
        title: 'Grupos + eliminatoria',
        points: [
            'Grupos por sorteo o armados a mano.',
            'Clasifican los mejores de cada grupo.',
            'Los primeros cruzan con los segundos de otro grupo.',
        ],
    },
];

const roles = [
    {
        icon: UserCog,
        title: 'Organizador',
        points: [
            'Crea y configura el torneo',
            'Aprueba equipos y edita reglas',
            'Genera el calendario',
            'Invita anotadores',
        ],
    },
    {
        icon: ClipboardPen,
        title: 'Anotador',
        points: [
            'Entra con un enlace de invitación',
            'Inicia los partidos',
            'Marca el resultado en vivo',
            'Finaliza o corrige un partido',
        ],
    },
    {
        icon: Eye,
        title: 'Público',
        points: [
            'No necesita cuenta',
            'Sigue los marcadores en vivo',
            'Consulta tabla y cuadro',
            'Inscribe a su equipo',
        ],
    },
];

const faqs = [
    {
        q: '¿Se manejan pagos o inscripciones con dinero?',
        a: 'No. Retazo no cobra inscripciones ni maneja dinero: si hay una cuota, los equipos la arreglan directamente con el organizador.',
    },
    {
        q: '¿Los equipos necesitan crear una cuenta?',
        a: 'No. Pueden inscribirse con el enlace público del torneo; la inscripción queda pendiente hasta que el organizador la apruebe.',
    },
    {
        q: '¿Qué pasa si me equivoco al anotar?',
        a: 'Puedes restar con −1 en cualquier momento, deshacer el cierre de un set o reabrir un partido terminado para corregirlo. En la eliminatoria, el ganador sale de la siguiente ronda hasta que lo vuelvas a finalizar.',
    },
    {
        q: '¿Puedo cambiar fechas y canchas después de generar el calendario?',
        a: 'Sí. Cada partido se puede mover a otra fecha, hora o cancha. Y mientras no empiece ningún partido, puedes volver a generar todo el calendario.',
    },
    {
        q: '¿Cómo se ve en el teléfono?',
        a: 'Retazo está hecho primero para el teléfono, y puedes instalarlo en tu pantalla de inicio como una app.',
    },
];

export default function HowItWorks({ sports }: { sports: SportInfo[] }) {
    const { auth } = usePage().props;
    const startHref = auth.user ? TournamentController.create() : register();

    return (
        <LandingLayout>
            <Head title="Cómo funciona" />

            <section className="mx-auto max-w-6xl px-4 pt-8 text-center sm:px-6 sm:pt-12">
                <h1 className="font-display text-5xl tracking-wide uppercase sm:text-7xl">
                    Cómo funciona
                </h1>
                <p className="mx-auto mt-2 max-w-xl text-sm text-white/60 sm:text-base">
                    De la inscripción a la gran final en seis pasos, todo desde
                    tu teléfono.
                </p>
            </section>

            <div className="mx-auto max-w-6xl space-y-16 px-4 pt-10 sm:px-6">
                <section>
                    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {steps.map(({ icon: Icon, title, text }, i) => (
                            <li
                                key={title}
                                className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b1220] p-6"
                            >
                                <span
                                    aria-hidden
                                    className="absolute -top-4 right-3 font-display text-8xl text-white/[0.06]"
                                >
                                    {i + 1}
                                </span>
                                <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-orange text-white shadow-lg shadow-brand-orange/25">
                                    <Icon className="size-5" />
                                </span>
                                <h2 className="mt-4 text-lg font-semibold">
                                    <span className="mr-1.5 text-brand-orange">
                                        {i + 1}.
                                    </span>
                                    {title}
                                </h2>
                                <p className="mt-1 text-sm text-white/60">
                                    {text}
                                </p>
                            </li>
                        ))}
                    </ol>
                </section>

                <Section title="Formatos de torneo">
                    <div className="grid gap-4 md:grid-cols-3">
                        {formats.map(({ icon: Icon, title, points }) => (
                            <Card
                                key={title}
                                icon={<Icon />}
                                title={title}
                                points={points}
                            />
                        ))}
                    </div>
                </Section>

                <Section title="Cada deporte, con sus reglas">
                    <div className="grid gap-4 lg:grid-cols-3">
                        {sports.map((sport) => (
                            <SportCard key={sport.value} sport={sport} />
                        ))}
                    </div>
                    <p className="mt-3 text-center text-xs text-white/50">
                        Son los valores por defecto: cada organizador los puede
                        cambiar en su torneo.
                    </p>
                </Section>

                <Section title="Quién hace qué">
                    <div className="grid gap-4 md:grid-cols-3">
                        {roles.map(({ icon: Icon, title, points }) => (
                            <Card
                                key={title}
                                icon={<Icon />}
                                title={title}
                                points={points}
                            />
                        ))}
                    </div>
                </Section>

                <Section title="Preguntas frecuentes">
                    <div className="mx-auto max-w-3xl space-y-2">
                        {faqs.map((faq) => (
                            <details
                                key={faq.q}
                                className="group rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 open:bg-white/[0.07]"
                            >
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium [&::-webkit-details-marker]:hidden">
                                    {faq.q}
                                    <ChevronDown className="size-4 shrink-0 text-white/60 transition-transform group-open:rotate-180" />
                                </summary>
                                <p className="mt-2 text-sm text-white/65">
                                    {faq.a}
                                </p>
                            </details>
                        ))}
                    </div>
                </Section>

                <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-brand-orange to-orange-600 px-6 py-12 text-center shadow-xl shadow-brand-orange/20">
                    <img
                        src="/images/logo-icon.png"
                        alt=""
                        aria-hidden
                        className="pointer-events-none absolute -right-10 -bottom-10 w-56 opacity-20 brightness-0 invert"
                    />
                    <h2 className="relative font-display text-4xl tracking-wide uppercase sm:text-5xl">
                        ¿Listo para el pitazo inicial?
                    </h2>
                    <p className="relative mx-auto mt-2 max-w-md text-orange-50">
                        Crea tu torneo en menos de un minuto.
                    </p>
                    <div className="relative mt-8 flex flex-wrap justify-center gap-3">
                        <Link
                            href={startHref}
                            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-orange-600 hover:bg-orange-50"
                        >
                            Crear mi torneo <ArrowRight className="size-4" />
                        </Link>
                        <Link
                            href={PublicTournamentController.index()}
                            className="inline-flex items-center rounded-full border border-white/60 px-6 py-3 text-sm font-semibold hover:bg-white/10"
                        >
                            Ver torneos
                        </Link>
                    </div>
                </section>
            </div>
        </LandingLayout>
    );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section>
            <h2 className="mb-6 text-center font-display text-4xl tracking-wide uppercase sm:text-5xl">
                {title}
            </h2>
            {children}
        </section>
    );
}

function Card({
    icon,
    title,
    points,
}: {
    icon: ReactNode;
    title: string;
    points: string[];
}) {
    return (
        <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-brand/20 text-blue-300 [&_svg]:size-5">
                {icon}
            </span>
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
                {points.map((point) => (
                    <li key={point} className="flex gap-2">
                        <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand-orange" />
                        {point}
                    </li>
                ))}
            </ul>
        </div>
    );
}

/**
 * A sport as configured in the app: variants, default points, table columns and suggested rules.
 */
function SportCard({ sport }: { sport: SportInfo }) {
    const points = sport.defaultSettings.points;
    const highlights = [
        sport.usesSets
            ? `Marcador set por set, a mejor de ${sport.defaultSettings.best_of ?? 3}; termina al ganar los sets necesarios.`
            : `Marcador por ${sport.scoreUnit} con botones de ${sport.scoreIncrements.map((n) => `+${n}`).join(', ')}.`,
        sport.allowsDraw
            ? 'Se permite el empate en liga y grupos.'
            : 'No hay empates.',
        sport.penaltiesInKnockout
            ? 'En eliminatoria, un empate se define por penales.'
            : sport.usesSets
              ? null
              : 'Si hay empate se juega tiempo extra y se sigue sumando.',
    ].filter((text): text is string => text !== null);

    return (
        <article className="flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b1220]">
            <header className="relative flex items-center gap-3 bg-[radial-gradient(90%_140%_at_0%_0%,#0f4a63_0%,#0b1220_70%)] p-5">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/30">
                    <SportIcon sport={sport.value} className="size-6" />
                </span>
                <div>
                    <h3 className="font-display text-3xl leading-none tracking-wide uppercase">
                        {sport.label}
                    </h3>
                    {Object.keys(sport.variants).length > 0 && (
                        <p className="text-xs text-white/60">
                            {Object.values(sport.variants).join(' · ')}
                        </p>
                    )}
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-5 p-5 text-sm">
                <ul className="space-y-2 text-white/70">
                    {highlights.map((text) => (
                        <li key={text} className="flex gap-2">
                            <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand-orange" />
                            {text}
                        </li>
                    ))}
                </ul>

                <div>
                    <p className="mb-2 text-xs font-semibold tracking-wide text-white/50 uppercase">
                        Puntos en la tabla
                    </p>
                    <dl className="divide-y divide-white/10 rounded-2xl border border-white/10">
                        {Object.entries(sport.pointLabels).map(
                            ([key, label]) => (
                                <div
                                    key={key}
                                    className="flex items-center justify-between gap-3 px-3 py-2"
                                >
                                    <dt className="text-white/70">{label}</dt>
                                    <dd className="font-display text-2xl leading-none">
                                        {points[key] ?? 0}
                                    </dd>
                                </div>
                            ),
                        )}
                    </dl>
                </div>

                <div>
                    <p className="mb-2 text-xs font-semibold tracking-wide text-white/50 uppercase">
                        Columnas de la tabla
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {Object.values(sport.standingsColumns).map((column) => (
                            <span
                                key={column}
                                className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium"
                            >
                                {column}
                            </span>
                        ))}
                    </div>
                </div>

                {sport.rules.length > 0 && (
                    <div>
                        <p className="mb-2 text-xs font-semibold tracking-wide text-white/50 uppercase">
                            Reglas sugeridas
                        </p>
                        <ul className="list-disc space-y-1 pl-5 text-white/70 marker:text-white/30">
                            {sport.rules.map((rule) => (
                                <li key={rule}>{rule}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </article>
    );
}
