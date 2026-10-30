import { Head, router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import TournamentController from '@/actions/App/Http/Controllers/TournamentController';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { TournamentForm } from '@/components/tournament-form';
import { TournamentShell } from '@/components/tournament-shell';
import { Button } from '@/components/ui/button';
import type { Tournament, TournamentOptions } from '@/types/tournament';

export default function EditTournament({
    tournament,
    options,
    hasGames,
}: {
    tournament: Tournament;
    options: TournamentOptions;
    hasGames: boolean;
}) {
    const settings = tournament.settings;

    return (
        <>
            <Head title={`Configuración · ${tournament.name}`} />
            <TournamentShell tournament={tournament} section="Configuración">
                <TournamentForm
                    // Remount when the saved tournament changes so the form starts from the new values.
                    key={JSON.stringify(tournament)}
                    options={options}
                    action={TournamentController.update(tournament)}
                    submitLabel="Guardar cambios"
                    locked={hasGames}
                    publicBaseUrl={`${window.location.host}/t/`}
                    initial={{
                        name: tournament.name,
                        slug: tournament.slug,
                        sport: tournament.sport,
                        variant: tournament.variant,
                        description: tournament.description ?? '',
                        start_date: tournament.start_date.slice(0, 10),
                        location: tournament.location ?? '',
                        format: tournament.format,
                        status: tournament.status,
                        double_round: tournament.double_round,
                        public_registration: tournament.public_registration,
                        max_teams: tournament.max_teams?.toString() ?? '',
                        points: settings.points,
                        best_of: settings.best_of ?? 3,
                        groups_count: settings.groups_count ?? 2,
                        qualifiers_per_group:
                            settings.qualifiers_per_group ?? 2,
                        tiebreakers: tournament.tiebreakers,
                    }}
                />

                <section className="mt-2 space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
                    <div>
                        <h2 className="font-semibold text-red-700 dark:text-red-300">
                            Eliminar torneo
                        </h2>
                        <p className="text-sm text-red-700/80 dark:text-red-300/80">
                            Se borran sus equipos, reglas y partidos. No se
                            puede deshacer.
                        </p>
                    </div>
                    <ConfirmDialog
                        title={`¿Eliminar ${tournament.name}?`}
                        description="Se borrarán todos los equipos, reglas y partidos del torneo."
                        confirmLabel="Sí, eliminar"
                        onConfirm={() =>
                            router.visit(
                                TournamentController.destroy(tournament),
                            )
                        }
                        trigger={
                            <Button variant="destructive">
                                <Trash2 /> Eliminar torneo
                            </Button>
                        }
                    />
                </section>
            </TournamentShell>
        </>
    );
}
