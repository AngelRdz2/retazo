import { Head, Link, router } from '@inertiajs/react';
import { ClipboardList } from 'lucide-react';
import InvitationController from '@/actions/App/Http/Controllers/InvitationController';
import TournamentController from '@/actions/App/Http/Controllers/TournamentController';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';

export default function Invitation({
    code,
    tournament,
    organizer,
    alreadyMember,
}: {
    code: string;
    tournament: {
        id: number;
        name: string;
        sport_label: string;
        status_label: string;
    } | null;
    organizer: string | null;
    alreadyMember: boolean;
}) {
    return (
        <>
            <Head title="Invitación de anotador" />
            <div className="flex flex-1 items-center justify-center p-4">
                <div className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-6 text-center">
                    <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                        <ClipboardList className="size-7" />
                    </span>
                    {tournament ? (
                        <>
                            <div className="space-y-1">
                                <h1 className="text-lg font-semibold">
                                    {tournament.name}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    {organizer} te invita a anotar los partidos
                                    de este torneo de {tournament.sport_label}.
                                </p>
                            </div>
                            {alreadyMember ? (
                                <Button asChild className="w-full">
                                    <Link
                                        href={TournamentController.show(
                                            tournament.id,
                                        )}
                                    >
                                        Ya eres parte del torneo. Ir al torneo
                                    </Link>
                                </Button>
                            ) : (
                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={() =>
                                        router.visit(
                                            InvitationController.accept(code),
                                        )
                                    }
                                >
                                    Aceptar y ser anotador
                                </Button>
                            )}
                        </>
                    ) : (
                        <>
                            <h1 className="text-lg font-semibold">
                                Invitación no válida
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                El enlace venció o fue desactivado. Pídele al
                                organizador uno nuevo.
                            </p>
                            <Button
                                asChild
                                variant="outline"
                                className="w-full"
                            >
                                <Link href={dashboard()}>Ir a mi panel</Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
