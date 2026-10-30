import { Form, Head, Link, usePage } from '@inertiajs/react';
import { CircleCheck } from 'lucide-react';
import { useState } from 'react';
import TeamRegistrationController from '@/actions/App/Http/Controllers/Public/TeamRegistrationController';
import PublicTournamentController from '@/actions/App/Http/Controllers/Public/TournamentController';
import InputError from '@/components/input-error';
import { TEAM_COLORS } from '@/components/team-form-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import PublicLayout from '@/layouts/public-layout';
import { formatDate } from '@/lib/format';

type TournamentInfo = {
    name: string;
    slug: string;
    sport_label: string;
    variant_label: string | null;
    start_date: string;
    location: string | null;
};

export default function RegisterTeam({
    tournament,
    open,
}: {
    tournament: TournamentInfo;
    open: boolean;
}) {
    const registered = usePage().flash.registered as string | undefined;
    const [color, setColor] = useState(TEAM_COLORS[0]);

    return (
        <PublicLayout>
            <Head title={`Inscripción · ${tournament.name}`} />
            <div className="mx-auto w-full max-w-md px-4 py-8">
                <div className="mb-6 text-center">
                    <p className="text-sm font-semibold tracking-wide text-brand-orange uppercase">
                        Inscripción de equipos
                    </p>
                    <h1 className="mt-1 text-2xl font-extrabold">
                        {tournament.name}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {tournament.variant_label ?? tournament.sport_label} ·
                        inicia el {formatDate(tournament.start_date)}
                        {tournament.location && ` · ${tournament.location}`}
                    </p>
                </div>

                {registered ? (
                    <div className="space-y-3 rounded-3xl border bg-card p-6 text-center">
                        <CircleCheck className="mx-auto size-12 text-emerald-500" />
                        <p className="text-lg font-semibold">
                            ¡{registered} quedó inscrito!
                        </p>
                        <p className="text-sm text-muted-foreground">
                            El organizador debe aprobar la inscripción. Cuando
                            lo haga, tu equipo aparecerá en la página del
                            torneo.
                        </p>
                        <Button asChild variant="outline" className="w-full">
                            <Link
                                href={PublicTournamentController.show(
                                    tournament,
                                )}
                            >
                                Ver el torneo
                            </Link>
                        </Button>
                    </div>
                ) : !open ? (
                    <div className="rounded-3xl border bg-card p-6 text-center text-sm text-muted-foreground">
                        Las inscripciones de este torneo están cerradas.
                    </div>
                ) : (
                    <Form
                        {...TeamRegistrationController.store.form(tournament)}
                        className="space-y-5 rounded-3xl border bg-card p-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">
                                        Nombre del equipo
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        required
                                        maxLength={100}
                                        placeholder="Los Halcones"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="contact_name">
                                        Nombre del capitán o contacto
                                    </Label>
                                    <Input
                                        id="contact_name"
                                        name="contact_name"
                                        required
                                        maxLength={100}
                                        autoComplete="name"
                                    />
                                    <InputError message={errors.contact_name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Color del equipo</Label>
                                    <input
                                        type="hidden"
                                        name="color"
                                        value={color}
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        {TEAM_COLORS.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setColor(c)}
                                                data-active={c === color}
                                                className="size-9 rounded-full ring-offset-2 ring-offset-background data-[active=true]:ring-2 data-[active=true]:ring-foreground"
                                                style={{ backgroundColor: c }}
                                                aria-label={`Color ${c}`}
                                            />
                                        ))}
                                    </div>
                                    <InputError message={errors.color} />
                                </div>

                                <Button
                                    type="submit"
                                    size="lg"
                                    className="w-full bg-brand-orange text-white hover:bg-brand-orange/90"
                                    disabled={processing}
                                >
                                    {processing && <Spinner />}
                                    Inscribir equipo
                                </Button>
                            </>
                        )}
                    </Form>
                )}
            </div>
        </PublicLayout>
    );
}
