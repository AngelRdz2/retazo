import { Head, router, usePoll } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';
import MatchController from '@/actions/App/Http/Controllers/Public/MatchController';
import { MatchCard } from '@/components/match-card';
import type { MatchCardData } from '@/components/match-card';
import { Pager } from '@/components/pager';
import type { Paginated } from '@/components/pager';
import { SegmentedControl } from '@/components/segmented-control';
import { SportIcon } from '@/components/sport-icon';
import LandingLayout from '@/layouts/landing-layout';
import type { Option, SportValue } from '@/types/tournament';

type Filters = { vista: 'proximos' | 'resultados'; deporte: string | null };

export default function Matches({
    games,
    filters,
    live,
    sports,
}: {
    games: Paginated<MatchCardData>;
    filters: Filters;
    live: number;
    sports: Option[];
}) {
    // Live scores keep moving while there are games in play.
    usePoll(10000, { only: ['games', 'live'] }, { autoStart: live > 0 });

    const visit = (changes: Partial<Filters>) => {
        const query = Object.fromEntries(
            Object.entries({ ...filters, ...changes }).filter(
                ([key, value]) =>
                    value && !(key === 'vista' && value === 'proximos'),
            ),
        );
        router.get(MatchController.index.url(), query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <LandingLayout>
            <Head title="Partidos" />
            <section className="mx-auto max-w-6xl px-4 pt-8 pb-4 text-center sm:px-6 sm:pt-12">
                <h1 className="font-display text-5xl tracking-wide uppercase sm:text-6xl">
                    Partidos
                </h1>
                <p className="mx-auto mt-2 max-w-lg text-sm text-white/60">
                    Lo que se juega hoy, lo que viene y todos los resultados de
                    los torneos publicados.
                </p>

                <div className="mt-8 flex flex-col items-center gap-3">
                    <SegmentedControl
                        label="Partidos"
                        options={[
                            {
                                value: 'proximos',
                                label:
                                    live > 0
                                        ? `Próximos · ${live} en vivo`
                                        : 'Próximos',
                                icon:
                                    live > 0 ? (
                                        <span className="size-2 animate-pulse rounded-full bg-red-500" />
                                    ) : undefined,
                            },
                            { value: 'resultados', label: 'Resultados' },
                        ]}
                        value={filters.vista}
                        onChange={(vista) =>
                            visit({ vista: vista as Filters['vista'] })
                        }
                    />
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
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-4 pt-6 pb-4 sm:px-6">
                {games.data.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/15 p-12 text-center text-white/60">
                        <CalendarDays className="size-8" />
                        {filters.vista === 'resultados'
                            ? 'Todavía no hay resultados.'
                            : 'No hay partidos programados por ahora.'}
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {games.data.map((game) => (
                            <MatchCard key={game.id} game={game} />
                        ))}
                    </div>
                )}

                <Pager page={games} />
            </section>
        </LandingLayout>
    );
}
