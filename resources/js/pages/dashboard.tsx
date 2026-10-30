import { Head, Link, usePage } from '@inertiajs/react';
import { ChevronRight, Plus, Smartphone, Trophy, Users } from 'lucide-react';
import TournamentController from '@/actions/App/Http/Controllers/TournamentController';
import { SportIcon } from '@/components/sport-icon';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { formatDate } from '@/lib/format';
import { dashboard } from '@/routes';
import type { Tournament } from '@/types/tournament';

export default function Dashboard({
    organized,
    scoring,
}: {
    organized: Tournament[];
    scoring: Tournament[];
}) {
    const { auth } = usePage().props;
    const firstName = auth.user.name.split(' ')[0];
    const { canInstall, install } = useInstallPrompt();

    return (
        <>
            <Head title="Panel" />
            <div className="w-full max-w-3xl space-y-6 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">
                            Hola, {firstName}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Tus torneos en un solo lugar.
                        </p>
                    </div>
                    <Button
                        asChild
                        className="bg-brand-orange text-white hover:bg-brand-orange/90"
                    >
                        <Link href={TournamentController.create()}>
                            <Plus /> Nuevo torneo
                        </Link>
                    </Button>
                </div>

                {canInstall && (
                    <button
                        type="button"
                        onClick={install}
                        className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-brand to-[#0030a0] p-4 text-left text-white"
                    >
                        <Smartphone className="size-8 shrink-0" />
                        <span>
                            <span className="block font-semibold">
                                Instala Retazo en tu teléfono
                            </span>
                            <span className="text-sm text-blue-100">
                                Ábrelo desde tu pantalla de inicio, como una
                                app.
                            </span>
                        </span>
                    </button>
                )}

                {organized.length === 0 && scoring.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center">
                        <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-orange/15">
                            <Trophy className="size-7 text-brand-orange" />
                        </span>
                        <p className="font-medium">Aún no tienes torneos</p>
                        <p className="max-w-sm text-sm text-muted-foreground">
                            Crea tu primer torneo de fútbol, vóley o básquet.
                            Toma menos de un minuto.
                        </p>
                        <Button asChild className="mt-2">
                            <Link href={TournamentController.create()}>
                                <Plus /> Crear torneo
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        <TournamentList
                            title="Organizas"
                            tournaments={organized}
                        />
                        <TournamentList
                            title="Eres anotador"
                            tournaments={scoring}
                        />
                    </>
                )}
            </div>
        </>
    );
}

function TournamentList({
    title,
    tournaments,
}: {
    title: string;
    tournaments: Tournament[];
}) {
    if (tournaments.length === 0) {
        return null;
    }

    return (
        <section className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
                {title}
            </h2>
            <ul className="space-y-2">
                {tournaments.map((tournament) => (
                    <li key={tournament.id}>
                        <Link
                            href={TournamentController.show(tournament)}
                            className="flex items-center gap-3 rounded-2xl border bg-card p-3 transition-colors hover:border-brand/50"
                        >
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand dark:text-blue-300">
                                <SportIcon
                                    sport={tournament.sport}
                                    className="size-6"
                                />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">
                                    {tournament.name}
                                </p>
                                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                    <StatusBadge
                                        status={tournament.status}
                                        label={tournament.status_label}
                                    />
                                    <span className="inline-flex items-center gap-1">
                                        <Users className="size-3.5" />
                                        {tournament.teams_count}
                                    </span>
                                    <span>
                                        {formatDate(tournament.start_date, {
                                            day: 'numeric',
                                            month: 'short',
                                        })}
                                    </span>
                                </div>
                            </div>
                            <ChevronRight className="size-5 text-muted-foreground" />
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Panel',
            href: dashboard(),
        },
    ],
};
