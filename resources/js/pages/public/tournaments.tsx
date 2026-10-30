import { Head, router } from '@inertiajs/react';
import { Search, Trophy, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import PublicTournamentController from '@/actions/App/Http/Controllers/Public/TournamentController';
import { Pager } from '@/components/pager';
import type { Paginated } from '@/components/pager';
import { SegmentedControl } from '@/components/segmented-control';
import { SportIcon } from '@/components/sport-icon';
import { TournamentCard } from '@/components/tournament-card';
import LandingLayout from '@/layouts/landing-layout';
import type {
    GameTeam,
    Option,
    SportValue,
    Tournament,
} from '@/types/tournament';

type Filters = { deporte: string | null; estado: string | null; q: string };

const statuses = [
    { value: '', label: 'Todos' },
    { value: 'in_progress', label: 'En curso' },
    { value: 'registration_open', label: 'Inscripciones' },
    { value: 'finished', label: 'Finalizados' },
];

export default function Tournaments({
    tournaments,
    filters,
    sports,
}: {
    tournaments: Paginated<Tournament & { teams: GameTeam[] }>;
    filters: Filters;
    sports: Option[];
}) {
    const [search, setSearch] = useState(filters.q);

    const visit = (changes: Partial<Filters>) => {
        const query = Object.fromEntries(
            Object.entries({ ...filters, ...changes }).filter(([, v]) => v),
        );
        router.get(PublicTournamentController.index.url(), query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        visit({ q: search.trim() });
    };

    const clearSearch = () => {
        setSearch('');
        visit({ q: '' });
    };

    return (
        <LandingLayout>
            <Head title="Torneos" />
            <section className="mx-auto max-w-6xl px-4 pt-8 pb-4 text-center sm:px-6 sm:pt-12">
                <h1 className="font-display text-5xl tracking-wide uppercase sm:text-6xl">
                    Nuestros torneos
                </h1>
                <p className="mx-auto mt-2 max-w-lg text-sm text-white/60">
                    Sigue los partidos en vivo, revisa tablas y cuadros, o
                    inscribe a tu equipo en los torneos con inscripciones
                    abiertas.
                </p>

                <div className="mt-8 flex flex-col items-center gap-3">
                    <SegmentedControl
                        label="Estado del torneo"
                        options={statuses}
                        value={filters.estado ?? ''}
                        onChange={(estado) => visit({ estado })}
                    />
                    <div className="flex w-full flex-col items-center gap-3 md:flex-row md:justify-center">
                        <SegmentedControl
                            label="Deporte"
                            options={[
                                { value: '', label: 'Todos' },
                                ...sports.map((sport) => ({
                                    ...sport,
                                    icon: (
                                        <SportIcon
                                            sport={sport.value as SportValue}
                                        />
                                    ),
                                })),
                            ]}
                            value={filters.deporte ?? ''}
                            onChange={(deporte) => visit({ deporte })}
                        />
                        <form
                            onSubmit={submit}
                            className="relative w-full max-w-xs"
                            role="search"
                        >
                            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-white/40" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar torneo"
                                aria-label="Buscar torneo por nombre"
                                className="h-10 w-full rounded-full border border-white/10 bg-white/[0.06] pr-10 pl-10 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/30 focus:ring-2 focus:ring-white/10"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
                                    aria-label="Borrar búsqueda"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-4 pt-6 pb-4 sm:px-6">
                {tournaments.data.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/15 p-12 text-center text-white/60">
                        <Trophy className="size-8" />
                        No encontramos torneos con esos filtros.
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {tournaments.data.map((tournament) => (
                            <TournamentCard
                                key={tournament.id}
                                tournament={tournament}
                            />
                        ))}
                    </div>
                )}

                <Pager page={tournaments} />
            </section>
        </LandingLayout>
    );
}
