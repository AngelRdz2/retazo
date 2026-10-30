import { Form, Head, router } from '@inertiajs/react';
import { Check, Copy, Link2, RefreshCw, Trash2 } from 'lucide-react';
import ScorerController from '@/actions/App/Http/Controllers/ScorerController';
import { ConfirmDialog } from '@/components/confirm-dialog';
import InputError from '@/components/input-error';
import { TournamentShell } from '@/components/tournament-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClipboard } from '@/hooks/use-clipboard';
import type { Tournament } from '@/types/tournament';

type Scorer = { id: number; name: string; email: string };

export default function Scorers({
    tournament,
    scorers,
    inviteUrl,
}: {
    tournament: Tournament;
    scorers: Scorer[];
    inviteUrl: string | null;
}) {
    const [copied, copy] = useClipboard();

    return (
        <>
            <Head title={`Anotadores · ${tournament.name}`} />
            <TournamentShell tournament={tournament} section="Anotadores">
                <div className="space-y-6">
                    <p className="text-sm text-muted-foreground">
                        Los anotadores pueden iniciar, marcar y finalizar los
                        partidos desde su teléfono, pero no pueden cambiar la
                        configuración del torneo.
                    </p>

                    <section className="space-y-3 rounded-2xl border bg-card p-4">
                        <h2 className="font-semibold">Agregar por correo</h2>
                        <Form
                            {...ScorerController.store.form(tournament)}
                            options={{ preserveScroll: true }}
                            resetOnSuccess
                            className="space-y-2"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <Label
                                        htmlFor="scorer-email"
                                        className="sr-only"
                                    >
                                        Correo electrónico
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="scorer-email"
                                            name="email"
                                            type="email"
                                            required
                                            placeholder="correo@ejemplo.com"
                                        />
                                        <Button disabled={processing}>
                                            Agregar
                                        </Button>
                                    </div>
                                    <InputError message={errors.email} />
                                </>
                            )}
                        </Form>
                        <p className="text-xs text-muted-foreground">
                            La persona debe tener una cuenta en Retazo.
                        </p>
                    </section>

                    <section className="space-y-3 rounded-2xl border bg-card p-4">
                        <h2 className="flex items-center gap-2 font-semibold">
                            <Link2 className="size-4" /> Enlace de invitación
                        </h2>
                        {inviteUrl ? (
                            <>
                                <p className="text-sm text-muted-foreground">
                                    Quien abra este enlace e inicie sesión se
                                    convierte en anotador.
                                </p>
                                <div className="flex gap-2">
                                    <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-3 py-2 text-sm">
                                        {inviteUrl}
                                    </code>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copy(inviteUrl)}
                                        aria-label="Copiar enlace"
                                    >
                                        {copied === inviteUrl ? (
                                            <Check />
                                        ) : (
                                            <Copy />
                                        )}
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            router.visit(
                                                ScorerController.regenerateInvite(
                                                    tournament,
                                                ),
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        <RefreshCw /> Generar uno nuevo
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            router.visit(
                                                ScorerController.disableInvite(
                                                    tournament,
                                                ),
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        Desactivar
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() =>
                                    router.visit(
                                        ScorerController.regenerateInvite(
                                            tournament,
                                        ),
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                Crear enlace de invitación
                            </Button>
                        )}
                    </section>

                    <section className="space-y-2">
                        <h2 className="font-semibold">
                            Anotadores ({scorers.length})
                        </h2>
                        {scorers.length === 0 ? (
                            <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                Aún no hay anotadores. Tú, como organizador,
                                también puedes anotar los partidos.
                            </p>
                        ) : (
                            <ul className="divide-y rounded-2xl border bg-card">
                                {scorers.map((scorer) => (
                                    <li
                                        key={scorer.id}
                                        className="flex items-center gap-3 p-3"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium">
                                                {scorer.name}
                                            </p>
                                            <p className="truncate text-sm text-muted-foreground">
                                                {scorer.email}
                                            </p>
                                        </div>
                                        <ConfirmDialog
                                            title={`¿Quitar a ${scorer.name}?`}
                                            description="Ya no podrá anotar partidos de este torneo."
                                            confirmLabel="Quitar"
                                            onConfirm={() =>
                                                router.visit(
                                                    ScorerController.destroy({
                                                        tournament:
                                                            tournament.id,
                                                        user: scorer.id,
                                                    }),
                                                    { preserveScroll: true },
                                                )
                                            }
                                            trigger={
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    aria-label="Quitar"
                                                >
                                                    <Trash2 />
                                                </Button>
                                            }
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </TournamentShell>
        </>
    );
}
