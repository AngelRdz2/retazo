import { useForm } from '@inertiajs/react';
import type { UrlMethodPair } from '@inertiajs/core';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { ScheduleOptionsData } from '@/types/tournament';

/**
 * When and where the games are played; used to generate the schedule and the knockout stage.
 */
export function ScheduleOptionsForm({
    action,
    defaults,
    submitLabel,
    roundsLabel = 'jornadas',
    onSuccess,
}: {
    action: UrlMethodPair;
    defaults: ScheduleOptionsData;
    submitLabel: string;
    roundsLabel?: string;
    onSuccess?: () => void;
}) {
    const form = useForm<ScheduleOptionsData>(action, defaults);
    const { data, setData, errors, processing } = form;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.submit({ preserveScroll: true, onSuccess });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="starts_at">Primer partido</Label>
                    <Input
                        id="starts_at"
                        type="datetime-local"
                        value={data.starts_at}
                        onChange={(e) => setData('starts_at', e.target.value)}
                        required
                    />
                    <InputError message={errors.starts_at} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="game_minutes">Minutos por partido</Label>
                    <Input
                        id="game_minutes"
                        type="number"
                        min={10}
                        max={300}
                        inputMode="numeric"
                        value={data.game_minutes}
                        onChange={(e) =>
                            setData('game_minutes', Number(e.target.value))
                        }
                    />
                    <p className="text-xs text-muted-foreground">
                        Incluye descanso y cambio de equipos.
                    </p>
                    <InputError message={errors.game_minutes} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="courts">Canchas disponibles</Label>
                    <Input
                        id="courts"
                        type="number"
                        min={1}
                        max={20}
                        inputMode="numeric"
                        value={data.courts}
                        onChange={(e) =>
                            setData('courts', Number(e.target.value))
                        }
                    />
                    <InputError message={errors.courts} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="days_between_rounds">
                        Días entre {roundsLabel}
                    </Label>
                    <Input
                        id="days_between_rounds"
                        type="number"
                        min={0}
                        max={60}
                        inputMode="numeric"
                        value={data.days_between_rounds}
                        onChange={(e) =>
                            setData(
                                'days_between_rounds',
                                Number(e.target.value),
                            )
                        }
                    />
                    <p className="text-xs text-muted-foreground">
                        0 = todas las {roundsLabel} el mismo día.
                    </p>
                    <InputError message={errors.days_between_rounds} />
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="court_names">
                    Nombres de las canchas (opcional)
                </Label>
                <Input
                    id="court_names"
                    value={data.court_names}
                    onChange={(e) => setData('court_names', e.target.value)}
                    placeholder="Ej.: Cancha Norte, Cancha Sur"
                    maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                    Sepáralos con comas. Si los escribes, se usa una cancha por
                    nombre.
                </p>
                <InputError message={errors.court_names} />
            </div>
            <Button
                type="submit"
                size="lg"
                className="w-full sm:w-auto"
                disabled={processing}
            >
                {processing && <Spinner />}
                {submitLabel}
            </Button>
        </form>
    );
}
