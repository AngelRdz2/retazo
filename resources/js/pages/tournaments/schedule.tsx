import { Head, usePage } from '@inertiajs/react';
import { CalendarDays, Coffee, RefreshCw, Trophy } from 'lucide-react';
import { useState } from 'react';
import ScheduleController from '@/actions/App/Http/Controllers/ScheduleController';
import { GameCard } from '@/components/game-card';
import { GroupsPanel } from '@/components/groups-panel';
import InputError from '@/components/input-error';
import { ScheduleOptionsForm } from '@/components/schedule-options-form';
import { TournamentShell } from '@/components/tournament-shell';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { plural } from '@/lib/format';
import type {
    ScheduleOptionsData,
    ScheduleStage,
    Team,
    Tournament,
} from '@/types/tournament';

type ScheduleTeam = Pick<Team, 'id' | 'name' | 'color' | 'logo_url'> & {
    group_id: number | null;
};

export default function Schedule({
    tournament,
    canManage,
    canScore,
    stages,
    teams,
    groups,
    pendingTeams,
    hasStarted,
    canGenerateKnockout,
    defaults,
    knockoutDefaults,
}: {
    tournament: Tournament;
    canManage: boolean;
    canScore: boolean;
    stages: ScheduleStage[];
    teams: ScheduleTeam[];
    groups: { id: number; name: string }[];
    pendingTeams: number;
    hasStarted: boolean;
    canGenerateKnockout: boolean;
    defaults: ScheduleOptionsData;
    knockoutDefaults: ScheduleOptionsData;
}) {
    const { errors } = usePage().props as { errors: Record<string, string> };
    const hasGames = stages.length > 0;
    const isGroups = tournament.format === 'groups_knockout';
    const roundsLabel =
        tournament.format === 'knockout' ? 'rondas' : 'jornadas';

    return (
        <>
            <Head title={`Calendario · ${tournament.name}`} />
            <TournamentShell
                tournament={tournament}
                section="Calendario"
                canManage={canManage}
            >
                <div className="space-y-6">
                    <InputError message={errors.schedule ?? errors.groups} />

                    {!hasGames && !canManage && (
                        <EmptyState text="El organizador todavía no genera el calendario." />
                    )}

                    {!hasGames && canManage && (
                        <>
                            {pendingTeams > 0 && (
                                <p className="rounded-xl border border-brand-orange/40 bg-brand-orange/10 p-3 text-sm">
                                    Hay{' '}
                                    {plural(
                                        pendingTeams,
                                        'equipo pendiente',
                                        'equipos pendientes',
                                    )}{' '}
                                    de aprobación. Solo entran al calendario los
                                    equipos aprobados.
                                </p>
                            )}

                            {isGroups && (
                                <Step number={1} title="Arma los grupos">
                                    <GroupsPanel
                                        key={teams
                                            .map((t) => `${t.id}:${t.group_id}`)
                                            .join()}
                                        tournament={tournament}
                                        groups={groups}
                                        teams={teams}
                                    />
                                </Step>
                            )}

                            <Step
                                number={isGroups ? 2 : 1}
                                title="Genera el calendario"
                                description={`${plural(teams.length, 'equipo aprobado', 'equipos aprobados')}. El orden de los partidos se sortea.`}
                            >
                                <ScheduleOptionsForm
                                    action={ScheduleController.store(
                                        tournament,
                                    )}
                                    defaults={defaults}
                                    roundsLabel={roundsLabel}
                                    submitLabel="Generar calendario"
                                />
                            </Step>
                        </>
                    )}

                    {hasGames && canManage && !hasStarted && (
                        <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/40 p-3 text-sm">
                            <span className="text-muted-foreground">
                                Puedes volver a generarlo mientras no empiece
                                ningún partido.
                            </span>
                            <RegenerateDialog
                                tournament={tournament}
                                defaults={defaults}
                                roundsLabel={roundsLabel}
                            />
                        </div>
                    )}

                    {canGenerateKnockout && canManage && (
                        <Step
                            icon={<Trophy className="size-4" />}
                            title="Fase eliminatoria"
                            description="La fase de grupos terminó. Se arma el cuadro con los clasificados de cada grupo."
                        >
                            <ScheduleOptionsForm
                                action={ScheduleController.knockout(tournament)}
                                defaults={knockoutDefaults}
                                roundsLabel="rondas"
                                submitLabel="Generar fase eliminatoria"
                            />
                        </Step>
                    )}

                    {stages.map((stage) => (
                        <section key={stage.stage} className="space-y-4">
                            {stages.length > 1 && (
                                <h2 className="text-lg font-bold">
                                    {stage.title}
                                </h2>
                            )}
                            {stage.rounds.map((round) => (
                                <div key={round.round} className="space-y-2">
                                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                                        <h3 className="font-semibold">
                                            {round.label}
                                        </h3>
                                        {round.resting.length > 0 && (
                                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                <Coffee className="size-3.5" />
                                                Descansa:{' '}
                                                {round.resting.join(', ')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {round.games.map((game) => (
                                            <GameCard
                                                key={game.id}
                                                game={game}
                                                tournament={tournament}
                                                canEdit={canManage}
                                                canScore={canScore}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </section>
                    ))}
                </div>
            </TournamentShell>
        </>
    );
}

function Step({
    number,
    icon,
    title,
    description,
    children,
}: {
    number?: number;
    icon?: React.ReactNode;
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-4 rounded-2xl border bg-card p-4">
            <header className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                    {icon ?? number}
                </span>
                <div>
                    <h2 className="font-semibold">{title}</h2>
                    {description && (
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            </header>
            {children}
        </section>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            <CalendarDays className="size-8" />
            {text}
        </div>
    );
}

function RegenerateDialog({
    tournament,
    defaults,
    roundsLabel,
}: {
    tournament: Tournament;
    defaults: ScheduleOptionsData;
    roundsLabel: string;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0">
                    <RefreshCw /> Volver a generar
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90svh] overflow-y-auto">
                <DialogTitle>Volver a generar el calendario</DialogTitle>
                <DialogDescription>
                    Se borran los partidos actuales y se vuelve a sortear el
                    orden.
                </DialogDescription>
                <ScheduleOptionsForm
                    action={ScheduleController.store(tournament)}
                    defaults={defaults}
                    roundsLabel={roundsLabel}
                    submitLabel="Volver a generar"
                    onSuccess={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
