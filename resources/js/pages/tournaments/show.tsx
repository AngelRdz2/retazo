import { Head, Link } from '@inertiajs/react';
import {
    Calendar,
    CalendarDays,
    Check,
    Copy,
    ExternalLink,
    MapPin,
    ScrollText,
    UserPlus,
    Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import ScheduleController from '@/actions/App/Http/Controllers/ScheduleController';
import ScorerController from '@/actions/App/Http/Controllers/ScorerController';
import TeamController from '@/actions/App/Http/Controllers/TeamController';
import TournamentRuleController from '@/actions/App/Http/Controllers/TournamentRuleController';
import { TournamentShell } from '@/components/tournament-shell';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';
import { formatDate } from '@/lib/format';
import type { Tournament } from '@/types/tournament';

type Stats = {
    approvedTeams: number;
    pendingTeams: number;
    activeRules: number;
    scorers: number;
    games: number;
};

export default function ShowTournament({
    tournament,
    canManage,
    stats,
    links,
}: {
    tournament: Tournament;
    canManage: boolean;
    stats: Stats;
    links: { public: string; registration: string | null };
}) {
    return (
        <>
            <Head title={tournament.name} />
            <TournamentShell
                tournament={tournament}
                section="Resumen"
                canManage={canManage}
            >
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                            <Calendar className="size-4" />
                            Inicia el {formatDate(tournament.start_date)}
                        </span>
                        {tournament.location && (
                            <span className="inline-flex items-center gap-1.5">
                                <MapPin className="size-4" />
                                {tournament.location}
                            </span>
                        )}
                    </div>
                    {tournament.description && (
                        <p className="text-sm whitespace-pre-line">
                            {tournament.description}
                        </p>
                    )}

                    {tournament.status === 'draft' && canManage && (
                        <div className="rounded-xl border border-brand-orange/40 bg-brand-orange/10 p-3 text-sm">
                            El torneo está en <strong>borrador</strong> y no se
                            ve en las páginas públicas. Cámbialo a
                            “Inscripciones abiertas” o “En curso” en
                            Configuración cuando esté listo.
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <StatCard
                            href={ScheduleController.show(tournament)}
                            icon={<CalendarDays />}
                            value={stats.games}
                            label={stats.games === 1 ? 'partido' : 'partidos'}
                            badge={
                                canManage && stats.games === 0
                                    ? 'Generar'
                                    : undefined
                            }
                        />
                        {canManage && (
                            <StatCard
                                href={TeamController.index(tournament)}
                                icon={<Users />}
                                value={stats.approvedTeams}
                                label={
                                    tournament.max_teams
                                        ? `de ${tournament.max_teams} equipos`
                                        : stats.approvedTeams === 1
                                          ? 'equipo'
                                          : 'equipos'
                                }
                                badge={
                                    stats.pendingTeams > 0
                                        ? `${stats.pendingTeams} pendiente${stats.pendingTeams > 1 ? 's' : ''}`
                                        : undefined
                                }
                            />
                        )}
                        {canManage && (
                            <StatCard
                                href={TournamentRuleController.edit(tournament)}
                                icon={<ScrollText />}
                                value={stats.activeRules}
                                label="reglas activas"
                            />
                        )}
                        {canManage && (
                            <StatCard
                                href={ScorerController.index(tournament)}
                                icon={<UserPlus />}
                                value={stats.scorers}
                                label="anotadores"
                            />
                        )}
                    </div>

                    {tournament.status !== 'draft' && (
                        <ShareLink
                            title="Página pública"
                            description="Compártela por WhatsApp para que todos sigan el torneo."
                            url={links.public}
                        />
                    )}
                    {canManage && links.registration && (
                        <ShareLink
                            title="Enlace de inscripción"
                            description={
                                tournament.status === 'registration_open'
                                    ? 'Los equipos se inscriben aquí sin crear cuenta.'
                                    : 'Funciona solo cuando el torneo está en “Inscripciones abiertas”.'
                            }
                            url={links.registration}
                        />
                    )}
                </div>
            </TournamentShell>
        </>
    );
}

function StatCard({
    href,
    icon,
    value,
    label,
    badge,
}: {
    href: Parameters<typeof Link>[0]['href'];
    icon: ReactNode;
    value: number;
    label: string;
    badge?: string;
}) {
    return (
        <Link
            href={href}
            className="relative rounded-2xl border bg-card p-4 transition-colors hover:border-brand/50 [&_svg]:size-5 [&_svg]:text-brand"
        >
            {icon}
            <p className="mt-2 text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
            {badge && (
                <span className="absolute top-3 right-3 rounded-full bg-brand-orange px-2 py-0.5 text-xs font-medium text-white">
                    {badge}
                </span>
            )}
        </Link>
    );
}

function ShareLink({
    title,
    description,
    url,
}: {
    title: string;
    description: string;
    url: string;
}) {
    const [copied, copy] = useClipboard();

    return (
        <div className="rounded-2xl border bg-card p-4">
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
            <div className="mt-3 flex gap-2">
                <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-3 py-2 text-sm">
                    {url}
                </code>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copy(url)}
                    aria-label="Copiar enlace"
                >
                    {copied === url ? <Check /> : <Copy />}
                </Button>
                <Button variant="outline" size="icon" asChild>
                    <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Abrir"
                    >
                        <ExternalLink />
                    </a>
                </Button>
            </div>
        </div>
    );
}
