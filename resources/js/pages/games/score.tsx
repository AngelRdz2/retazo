import { Head, Link, router, usePage, usePoll } from '@inertiajs/react';
import { ArrowLeft, Flag, Play, RotateCcw, Undo2 } from 'lucide-react';
import { useState } from 'react';
import GameScoringController from '@/actions/App/Http/Controllers/GameScoringController';
import ScheduleController from '@/actions/App/Http/Controllers/ScheduleController';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { GameStatusBadge } from '@/components/game-card';
import InputError from '@/components/input-error';
import { TeamAvatar } from '@/components/team-avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatGameTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Game, GameTeam, SportOption } from '@/types/tournament';

type Side = 'home' | 'away';

type Props = {
    tournament: { id: number; name: string; sport_label: string };
    game: Game;
    sport: SportOption & {
        scoreIncrements: number[];
        penaltiesInKnockout: boolean;
    };
    setsToWin: number | null;
    setRule: { target: number; lead: number } | null;
    penaltiesOnTie: boolean;
    canReopen: boolean;
};

export default function ScoreGame({
    tournament,
    game,
    sport,
    setsToWin,
    setRule,
    penaltiesOnTie,
    canReopen,
}: Props) {
    const { errors } = usePage().props as { errors: Record<string, string> };

    // Keep phones of several scorers in sync.
    usePoll(4000, { only: ['game', 'setRule', 'canReopen'] });

    const sets = game.sets ?? [];
    const currentSet = sets[sets.length - 1] ?? { home: 0, away: 0 };
    const live = game.status === 'live';

    const post = (
        action: { url: string; method: 'post' },
        data: Record<string, unknown> = {},
        optimistic?: (game: Game) => Game,
    ) =>
        router.visit(action, {
            data,
            async: true,
            preserveScroll: true,
            optimistic: optimistic
                ? (props) => ({ game: optimistic(props.game as Game) })
                : undefined,
        });

    const adjust = (side: Side, delta: number) => {
        navigator.vibrate?.(15);
        post(
            GameScoringController.adjust(game.id),
            { side, delta },
            (current) => {
                if (sport.usesSets) {
                    const next = [...(current.sets ?? [{ home: 0, away: 0 }])];
                    const last = { ...next[next.length - 1] };
                    last[side] = Math.max(0, last[side] + delta);
                    next[next.length - 1] = last;

                    return { ...current, sets: next };
                }

                const key = side === 'home' ? 'home_score' : 'away_score';

                return { ...current, [key]: Math.max(0, current[key] + delta) };
            },
        );
    };

    // Highlight "close set" when the set looks won by the tournament rules.
    const setLooksWon =
        setRule !== null &&
        Math.max(currentSet.home, currentSet.away) >= setRule.target &&
        Math.abs(currentSet.home - currentSet.away) >= setRule.lead;

    return (
        <>
            <Head
                title={`Anotar · ${game.home_team?.name ?? ''} vs ${game.away_team?.name ?? ''}`}
            />
            <div className="flex min-h-svh flex-col bg-background">
                <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/95 px-2 py-2 backdrop-blur">
                    <Button variant="ghost" size="icon" asChild>
                        <Link
                            href={ScheduleController.show(tournament.id)}
                            aria-label="Volver al calendario"
                        >
                            <ArrowLeft />
                        </Link>
                    </Button>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                            {tournament.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                            {game.round_label}
                            {game.group_name && ` · ${game.group_name}`}
                            {game.scheduled_at &&
                                ` · ${formatGameTime(game.scheduled_at)}`}
                            {game.venue && ` · ${game.venue}`}
                        </p>
                    </div>
                    <span className="text-xs">
                        <GameStatusBadge game={game} />
                    </span>
                </header>

                <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-3 p-3">
                    <InputError
                        message={errors.game}
                        className="rounded-lg bg-red-500/10 p-3"
                    />

                    {sport.usesSets && sets.length > 0 && (
                        <SetsSummary
                            game={game}
                            setsToWin={setsToWin}
                            live={live}
                        />
                    )}

                    {(['home', 'away'] as const).map((side) => (
                        <TeamPanel
                            key={side}
                            team={
                                side === 'home'
                                    ? game.home_team
                                    : game.away_team
                            }
                            score={
                                sport.usesSets && live
                                    ? currentSet[side]
                                    : side === 'home'
                                      ? game.home_score
                                      : game.away_score
                            }
                            caption={
                                sport.usesSets
                                    ? live
                                        ? `Set ${sets.length} · ${side === 'home' ? game.home_score : game.away_score} sets ganados`
                                        : 'sets'
                                    : undefined
                            }
                            penalties={
                                side === 'home'
                                    ? game.home_penalties
                                    : game.away_penalties
                            }
                            winner={
                                game.winner_team_id !== null &&
                                game.winner_team_id ===
                                    (side === 'home'
                                        ? game.home_team_id
                                        : game.away_team_id)
                            }
                            increments={live ? sport.scoreIncrements : []}
                            onAdjust={(delta) => adjust(side, delta)}
                        />
                    ))}

                    {game.status === 'scheduled' &&
                        (game.home_team && game.away_team ? (
                            <Button
                                size="lg"
                                className="h-16 text-lg"
                                onClick={() =>
                                    post(GameScoringController.start(game.id))
                                }
                            >
                                <Play /> Iniciar partido
                            </Button>
                        ) : (
                            <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                                Este partido se puede iniciar cuando se conozcan
                                los dos equipos.
                            </p>
                        ))}

                    {live && sport.usesSets && (
                        <div className="space-y-2">
                            <Button
                                size="lg"
                                className={cn(
                                    'h-14 w-full text-base',
                                    setLooksWon &&
                                        'animate-pulse bg-brand-orange hover:bg-brand-orange/90',
                                )}
                                disabled={currentSet.home === currentSet.away}
                                onClick={() =>
                                    post(
                                        GameScoringController.closeSet(game.id),
                                    )
                                }
                            >
                                <Flag /> Cerrar set {sets.length}
                            </Button>
                            {setRule && (
                                <p className="text-center text-xs text-muted-foreground">
                                    Este set se juega a {setRule.target} puntos
                                    con diferencia de {setRule.lead}.
                                </p>
                            )}
                            {sets.length > 1 &&
                                currentSet.home + currentSet.away === 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full"
                                        onClick={() =>
                                            post(
                                                GameScoringController.undoSet(
                                                    game.id,
                                                ),
                                            )
                                        }
                                    >
                                        <Undo2 /> Deshacer cierre del set{' '}
                                        {sets.length - 1}
                                    </Button>
                                )}
                        </div>
                    )}

                    {live && !sport.usesSets && (
                        <FinishDialog
                            game={game}
                            sport={sport}
                            penaltiesOnTie={penaltiesOnTie}
                            error={errors.penalties}
                            onFinish={(penalties) =>
                                post(
                                    GameScoringController.finish(game.id),
                                    penalties,
                                )
                            }
                        />
                    )}

                    {game.status === 'finished' && (
                        <div className="space-y-3 text-center">
                            <p className="text-lg font-semibold">
                                {game.winner_team_id === null
                                    ? 'Empate'
                                    : `Ganó ${game.winner_team_id === game.home_team_id ? game.home_team?.name : game.away_team?.name}`}
                            </p>
                            {canReopen && (
                                <ConfirmDialog
                                    title="¿Reabrir el partido?"
                                    description="Vuelve a estar en vivo para corregir el marcador. Si es de eliminatoria, el ganador sale de la siguiente ronda hasta que lo finalices otra vez."
                                    confirmLabel="Reabrir"
                                    onConfirm={() =>
                                        post(
                                            GameScoringController.reopen(
                                                game.id,
                                            ),
                                        )
                                    }
                                    trigger={
                                        <Button variant="outline">
                                            <RotateCcw /> Reabrir partido
                                        </Button>
                                    }
                                />
                            )}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}

function TeamPanel({
    team,
    score,
    caption,
    penalties,
    winner,
    increments,
    onAdjust,
}: {
    team: GameTeam | null;
    score: number;
    caption?: string;
    penalties: number | null;
    winner: boolean;
    increments: number[];
    onAdjust: (delta: number) => void;
}) {
    const name = team?.name ?? 'Por definir';

    return (
        <section
            className={cn(
                'overflow-hidden rounded-3xl border bg-card',
                winner && 'border-brand ring-2 ring-brand/40',
            )}
        >
            <div
                className="h-1.5"
                style={{ backgroundColor: team?.color ?? '#94a3b8' }}
            />
            <div className="flex items-center gap-3 p-4 pb-2">
                {team ? (
                    <TeamAvatar team={team} className="size-10" />
                ) : (
                    <span className="size-10 rounded-full border border-dashed" />
                )}
                <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-semibold">{name}</p>
                    {caption && (
                        <p className="text-xs text-muted-foreground">
                            {caption}
                        </p>
                    )}
                </div>
                <div className="text-right">
                    <span className="block text-6xl leading-none font-black tabular-nums">
                        {score}
                    </span>
                    {penalties !== null && (
                        <span className="text-sm text-muted-foreground">
                            ({penalties} pen.)
                        </span>
                    )}
                </div>
            </div>

            {increments.length > 0 && (
                <div className="flex gap-2 p-3 pt-1">
                    <Button
                        variant="outline"
                        className="h-16 w-16 shrink-0 text-xl font-bold"
                        onClick={() => onAdjust(-1)}
                        aria-label={`Restar 1 a ${name}`}
                    >
                        −1
                    </Button>
                    {increments.map((n) => (
                        <Button
                            key={n}
                            className={cn(
                                'h-16 flex-1 text-2xl font-black',
                                n > 1 && 'bg-brand/80',
                            )}
                            onClick={() => onAdjust(n)}
                            aria-label={`Sumar ${n} a ${name}`}
                        >
                            +{n}
                        </Button>
                    ))}
                </div>
            )}
        </section>
    );
}

function SetsSummary({
    game,
    setsToWin,
    live,
}: {
    game: Game;
    setsToWin: number | null;
    live: boolean;
}) {
    const sets = game.sets ?? [];
    const closed = live ? sets.slice(0, -1) : sets;

    return (
        <div className="rounded-2xl border bg-card p-3">
            <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">
                    Sets {game.home_score} - {game.away_score}
                </span>
                {setsToWin && (
                    <span className="text-xs text-muted-foreground">
                        Gana quien llegue a {setsToWin}
                    </span>
                )}
            </div>
            {closed.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {closed.map((set, i) => (
                        <span
                            key={i}
                            className="rounded-full bg-muted px-2.5 py-1 text-xs tabular-nums"
                        >
                            Set {i + 1}: {set.home}-{set.away}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

function FinishDialog({
    game,
    sport,
    penaltiesOnTie,
    error,
    onFinish,
}: {
    game: Game;
    sport: SportOption;
    penaltiesOnTie: boolean;
    error?: string;
    onFinish: (penalties: Record<string, number>) => void;
}) {
    const [open, setOpen] = useState(false);
    const [penalties, setPenalties] = useState({ home: '', away: '' });
    const tie = game.home_score === game.away_score;
    const overtime =
        tie &&
        !penaltiesOnTie &&
        (!sport.allowsDraw || game.stage === 'knockout');
    const needsPenalties = tie && penaltiesOnTie;
    const penaltiesValid =
        penalties.home !== '' &&
        penalties.away !== '' &&
        penalties.home !== penalties.away;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="secondary"
                    size="lg"
                    className="h-14 text-base"
                >
                    <Flag /> Finalizar partido
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>¿Finalizar el partido?</DialogTitle>
                <DialogDescription>
                    {game.home_team?.name} {game.home_score} - {game.away_score}{' '}
                    {game.away_team?.name}
                </DialogDescription>

                {overtime && (
                    <p className="rounded-lg bg-brand-orange/10 p-3 text-sm">
                        El marcador está empatado y este partido no puede
                        terminar así: se juega tiempo extra. Sigue sumando
                        puntos y finaliza cuando haya un ganador.
                    </p>
                )}

                {tie && !overtime && !needsPenalties && (
                    <p className="text-sm text-muted-foreground">
                        El partido terminará en empate.
                    </p>
                )}

                {needsPenalties && (
                    <div className="space-y-3">
                        <p className="text-sm">
                            Hubo empate: ¿cómo quedaron los penales?
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {(['home', 'away'] as const).map((side) => (
                                <div key={side} className="grid gap-1.5">
                                    <Label
                                        htmlFor={`penalties-${side}`}
                                        className="truncate"
                                    >
                                        {side === 'home'
                                            ? game.home_team?.name
                                            : game.away_team?.name}
                                    </Label>
                                    <Input
                                        id={`penalties-${side}`}
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        max={99}
                                        className="h-12 text-center text-xl"
                                        value={penalties[side]}
                                        onChange={(e) =>
                                            setPenalties({
                                                ...penalties,
                                                [side]: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                        <InputError message={error} />
                    </div>
                )}

                <DialogFooter className="gap-2">
                    <Button variant="secondary" onClick={() => setOpen(false)}>
                        Seguir jugando
                    </Button>
                    <Button
                        disabled={
                            overtime || (needsPenalties && !penaltiesValid)
                        }
                        onClick={() => {
                            setOpen(false);
                            onFinish(
                                needsPenalties
                                    ? {
                                          home_penalties: Number(
                                              penalties.home,
                                          ),
                                          away_penalties: Number(
                                              penalties.away,
                                          ),
                                      }
                                    : {},
                            );
                        }}
                    >
                        Finalizar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
