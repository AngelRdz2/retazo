import { Head, router, usePage } from '@inertiajs/react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import TeamController from '@/actions/App/Http/Controllers/TeamController';
import { ConfirmDialog } from '@/components/confirm-dialog';
import InputError from '@/components/input-error';
import { TeamAvatar } from '@/components/team-avatar';
import { TeamFormDialog } from '@/components/team-form-dialog';
import { TournamentShell } from '@/components/tournament-shell';
import { Button } from '@/components/ui/button';
import { plural } from '@/lib/format';
import type { Team, Tournament } from '@/types/tournament';

export default function Teams({
    tournament,
    teams,
    isFull,
    registrationUrl,
}: {
    tournament: Tournament;
    teams: Team[];
    isFull: boolean;
    registrationUrl: string | null;
}) {
    const { errors } = usePage().props as { errors: Record<string, string> };
    const pending = teams.filter((t) => t.status === 'pending');
    const approved = teams.filter((t) => t.status === 'approved');
    const args = (team: Team) => ({ tournament: tournament.id, team: team.id });

    return (
        <>
            <Head title={`Equipos · ${tournament.name}`} />
            <TournamentShell tournament={tournament} section="Equipos">
                <div className="space-y-6">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="font-semibold">
                                {tournament.max_teams
                                    ? `${approved.length} de ${plural(tournament.max_teams, 'equipo', 'equipos')}`
                                    : plural(
                                          approved.length,
                                          'equipo',
                                          'equipos',
                                      )}
                            </h2>
                            {isFull && (
                                <p className="text-sm text-muted-foreground">
                                    Se alcanzó el máximo de equipos.
                                </p>
                            )}
                        </div>
                        <TeamFormDialog
                            tournament={tournament}
                            trigger={
                                <Button disabled={isFull}>
                                    <Plus /> Agregar equipo
                                </Button>
                            }
                        />
                    </div>

                    <InputError message={errors.team ?? errors.name} />

                    {registrationUrl && (
                        <p className="rounded-xl border bg-muted/50 p-3 text-sm text-muted-foreground">
                            La inscripción por enlace está activada. Los equipos
                            inscritos aparecen como pendientes hasta que los
                            apruebes.
                        </p>
                    )}

                    {pending.length > 0 && (
                        <section className="space-y-2">
                            <h3 className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                                Pendientes de aprobación ({pending.length})
                            </h3>
                            <ul className="space-y-2">
                                {pending.map((team) => (
                                    <li
                                        key={team.id}
                                        className="flex items-center gap-3 rounded-xl border border-brand-orange/40 bg-brand-orange/5 p-3"
                                    >
                                        <TeamAvatar team={team} />
                                        <TeamName team={team} />
                                        <Button
                                            size="sm"
                                            disabled={isFull}
                                            onClick={() =>
                                                router.visit(
                                                    TeamController.approve(
                                                        args(team),
                                                    ),
                                                    { preserveScroll: true },
                                                )
                                            }
                                        >
                                            <Check /> Aprobar
                                        </Button>
                                        <ConfirmDialog
                                            title={`¿Rechazar a ${team.name}?`}
                                            description="La inscripción se elimina."
                                            confirmLabel="Rechazar"
                                            onConfirm={() =>
                                                router.visit(
                                                    TeamController.destroy(
                                                        args(team),
                                                    ),
                                                    { preserveScroll: true },
                                                )
                                            }
                                            trigger={
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    aria-label="Rechazar"
                                                >
                                                    <X />
                                                </Button>
                                            }
                                        />
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {approved.length === 0 ? (
                        <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                            Todavía no hay equipos. Agrégalos tú o comparte el
                            enlace de inscripción.
                        </div>
                    ) : (
                        <ul className="divide-y rounded-2xl border bg-card">
                            {approved.map((team) => (
                                <li
                                    key={team.id}
                                    className="flex items-center gap-3 p-3"
                                >
                                    <TeamAvatar team={team} />
                                    <TeamName team={team} />
                                    <TeamFormDialog
                                        tournament={tournament}
                                        team={team}
                                        trigger={
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                aria-label="Editar"
                                            >
                                                <Pencil />
                                            </Button>
                                        }
                                    />
                                    <ConfirmDialog
                                        title={`¿Eliminar a ${team.name}?`}
                                        onConfirm={() =>
                                            router.visit(
                                                TeamController.destroy(
                                                    args(team),
                                                ),
                                                { preserveScroll: true },
                                            )
                                        }
                                        trigger={
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                aria-label="Eliminar"
                                            >
                                                <Trash2 />
                                            </Button>
                                        }
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </TournamentShell>
        </>
    );
}

function TeamName({ team }: { team: Team }) {
    return (
        <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{team.name}</p>
            {team.contact_name && (
                <p className="truncate text-sm text-muted-foreground">
                    {team.contact_name}
                </p>
            )}
        </div>
    );
}
