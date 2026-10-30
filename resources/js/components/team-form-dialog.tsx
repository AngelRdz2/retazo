import { Form } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import TeamController from '@/actions/App/Http/Controllers/TeamController';
import InputError from '@/components/input-error';
import { TeamAvatar } from '@/components/team-avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { Team, Tournament } from '@/types/tournament';

export const TEAM_COLORS = [
    '#0058F8',
    '#F87000',
    '#16A34A',
    '#DC2626',
    '#9333EA',
    '#0891B2',
    '#CA8A04',
    '#111827',
];

/**
 * Create or edit a team. Uses a regular form post so the logo file is uploaded.
 */
export function TeamFormDialog({
    tournament,
    team,
    trigger,
}: {
    tournament: Tournament;
    team?: Team;
    trigger: ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const [color, setColor] = useState(team?.color ?? TEAM_COLORS[0]);
    const action = team
        ? TeamController.update.form({
              tournament: tournament.id,
              team: team.id,
          })
        : TeamController.store.form(tournament);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogTitle>
                    {team ? 'Editar equipo' : 'Nuevo equipo'}
                </DialogTitle>
                <DialogDescription>
                    El color y el logo se muestran en la tabla y en el cuadro.
                </DialogDescription>

                <Form
                    {...action}
                    options={{ preserveScroll: true }}
                    onSuccess={() => setOpen(false)}
                    resetOnSuccess
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="team-name">Nombre</Label>
                                <Input
                                    id="team-name"
                                    name="name"
                                    defaultValue={team?.name}
                                    required
                                    maxLength={100}
                                    autoFocus
                                    placeholder="Los Halcones"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Color</Label>
                                <input
                                    type="hidden"
                                    name="color"
                                    value={color}
                                />
                                <div className="flex flex-wrap items-center gap-2">
                                    {TEAM_COLORS.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setColor(c)}
                                            className="size-8 rounded-full ring-offset-2 ring-offset-background transition-shadow data-[active=true]:ring-2 data-[active=true]:ring-foreground"
                                            data-active={c === color}
                                            style={{ backgroundColor: c }}
                                            aria-label={`Color ${c}`}
                                        />
                                    ))}
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) =>
                                            setColor(e.target.value)
                                        }
                                        className="size-8 cursor-pointer rounded-full border bg-transparent"
                                        aria-label="Otro color"
                                    />
                                </div>
                                <InputError message={errors.color} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="team-contact">
                                    Capitán o contacto (opcional)
                                </Label>
                                <Input
                                    id="team-contact"
                                    name="contact_name"
                                    defaultValue={team?.contact_name ?? ''}
                                    maxLength={100}
                                />
                                <InputError message={errors.contact_name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="team-logo">
                                    Logo (opcional)
                                </Label>
                                <div className="flex items-center gap-3">
                                    {team?.logo_url && (
                                        <TeamAvatar
                                            team={team}
                                            className="size-10"
                                        />
                                    )}
                                    <Input
                                        id="team-logo"
                                        name="logo"
                                        type="file"
                                        accept="image/*"
                                    />
                                </div>
                                {team?.logo_url && (
                                    <label className="flex items-center gap-2 text-sm">
                                        <Checkbox
                                            name="remove_logo"
                                            value="1"
                                        />
                                        Quitar logo
                                    </label>
                                )}
                                <InputError message={errors.logo} />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={processing}
                            >
                                {processing && <Spinner />}
                                {team ? 'Guardar cambios' : 'Agregar equipo'}
                            </Button>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
