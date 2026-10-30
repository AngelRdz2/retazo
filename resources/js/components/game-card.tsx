import { Form, Link } from '@inertiajs/react';
import { ClipboardPen, Clock, MapPin, Pencil, Radio } from 'lucide-react';
import { useState } from 'react';
import GameController from '@/actions/App/Http/Controllers/GameController';
import GameScoringController from '@/actions/App/Http/Controllers/GameScoringController';
import InputError from '@/components/input-error';
import { TeamAvatar } from '@/components/team-avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatGameTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Game, GameTeam, Tournament } from '@/types/tournament';

export function GameCard({
    game,
    tournament,
    canEdit = false,
    canScore = false,
}: {
    game: Game;
    tournament: Tournament;
    canEdit?: boolean;
    canScore?: boolean;
}) {
    const showScore = game.status !== 'scheduled';

    return (
        <div
            className={cn(
                'rounded-2xl border bg-card p-3',
                game.status === 'live' &&
                    'border-red-500/50 ring-1 ring-red-500/30',
            )}
        >
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                {game.scheduled_at && (
                    <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {formatGameTime(game.scheduled_at)}
                    </span>
                )}
                {game.venue && (
                    <span className="inline-flex items-center gap-1 truncate">
                        <MapPin className="size-3.5" />
                        {game.venue}
                    </span>
                )}
                {game.group_name && (
                    <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
                        {game.group_name}
                    </span>
                )}
                <span className="ml-auto flex items-center gap-1">
                    <GameStatusBadge game={game} />
                    {canEdit && game.status === 'scheduled' && (
                        <EditGameDialog game={game} tournament={tournament} />
                    )}
                </span>
            </div>

            <TeamLine
                team={game.home_team}
                score={showScore ? game.home_score : null}
                winner={
                    game.winner_team_id !== null &&
                    game.winner_team_id === game.home_team_id
                }
            />
            <TeamLine
                team={game.away_team}
                score={showScore ? game.away_score : null}
                winner={
                    game.winner_team_id !== null &&
                    game.winner_team_id === game.away_team_id
                }
            />
            {game.home_penalties !== null && (
                <p className="text-xs text-muted-foreground">
                    Penales: {game.home_penalties}-{game.away_penalties}
                </p>
            )}
            {game.sets &&
                game.sets.length > 0 &&
                game.status !== 'scheduled' && (
                    <p className="text-xs text-muted-foreground tabular-nums">
                        {game.status === 'live'
                            ? `Set ${game.sets.length}: ${game.sets[game.sets.length - 1].home}-${game.sets[game.sets.length - 1].away}`
                            : game.sets
                                  .map((set) => `${set.home}-${set.away}`)
                                  .join(' · ')}
                    </p>
                )}

            {canScore && game.home_team && game.away_team && (
                <Button
                    asChild
                    size="sm"
                    variant={game.status === 'finished' ? 'ghost' : 'default'}
                    className={cn(
                        'mt-2 w-full',
                        game.status === 'live' &&
                            'bg-red-600 text-white hover:bg-red-600/90',
                    )}
                >
                    <Link href={GameScoringController.show(game.id)}>
                        {game.status === 'scheduled' && (
                            <>
                                <ClipboardPen /> Anotar
                            </>
                        )}
                        {game.status === 'live' && (
                            <>
                                <Radio /> Anotar en vivo
                            </>
                        )}
                        {game.status === 'finished' && 'Ver o corregir'}
                    </Link>
                </Button>
            )}
        </div>
    );
}

function TeamLine({
    team,
    score,
    winner,
}: {
    team: GameTeam | null;
    score: number | null;
    winner: boolean;
}) {
    return (
        <div className="flex items-center gap-2 py-1">
            {team ? (
                <TeamAvatar team={team} className="size-7 text-xs" />
            ) : (
                <span className="size-7 rounded-full border border-dashed" />
            )}
            <span
                className={cn(
                    'flex-1 truncate text-sm',
                    team ? 'font-medium' : 'text-muted-foreground italic',
                    winner && 'font-bold',
                )}
            >
                {team?.name ?? 'Por definir'}
            </span>
            {score !== null && (
                <span
                    className={cn(
                        'text-lg font-bold tabular-nums',
                        winner && 'text-brand dark:text-blue-300',
                    )}
                >
                    {score}
                </span>
            )}
        </div>
    );
}

export function GameStatusBadge({ game }: { game: Game }) {
    if (game.status === 'live') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 font-semibold text-red-600 dark:text-red-400">
                <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
                En vivo
            </span>
        );
    }
    if (game.status === 'finished') {
        return (
            <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
                Final
            </span>
        );
    }

    return null;
}

function EditGameDialog({
    game,
    tournament,
}: {
    game: Game;
    tournament: Tournament;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label="Editar horario"
                >
                    <Pencil className="size-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Editar horario</DialogTitle>
                <DialogDescription>
                    {game.home_team?.name ?? 'Por definir'} vs{' '}
                    {game.away_team?.name ?? 'Por definir'}
                </DialogDescription>
                <Form
                    {...GameController.update.form({
                        tournament: tournament.id,
                        game: game.id,
                    })}
                    options={{ preserveScroll: true }}
                    onSuccess={() => setOpen(false)}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor={`scheduled-${game.id}`}>
                                    Fecha y hora
                                </Label>
                                <Input
                                    id={`scheduled-${game.id}`}
                                    name="scheduled_at"
                                    type="datetime-local"
                                    defaultValue={game.scheduled_at ?? ''}
                                />
                                <InputError message={errors.scheduled_at} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor={`venue-${game.id}`}>
                                    Cancha (opcional)
                                </Label>
                                <Input
                                    id={`venue-${game.id}`}
                                    name="venue"
                                    defaultValue={game.venue ?? ''}
                                    maxLength={100}
                                />
                                <InputError message={errors.venue} />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={processing}
                            >
                                Guardar
                            </Button>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
