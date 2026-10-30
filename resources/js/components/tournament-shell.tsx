import { Link, setLayoutProps } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import ScheduleController from '@/actions/App/Http/Controllers/ScheduleController';
import ScorerController from '@/actions/App/Http/Controllers/ScorerController';
import TeamController from '@/actions/App/Http/Controllers/TeamController';
import TournamentController from '@/actions/App/Http/Controllers/TournamentController';
import TournamentRuleController from '@/actions/App/Http/Controllers/TournamentRuleController';
import { SportIcon } from '@/components/sport-icon';
import { StatusBadge } from '@/components/status-badge';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { Tournament } from '@/types/tournament';

/**
 * Header and section tabs shared by the private tournament pages.
 */
export function TournamentShell({
    tournament,
    section,
    canManage = true,
    children,
}: PropsWithChildren<{
    tournament: Tournament;
    section: string;
    canManage?: boolean;
}>) {
    const { isCurrentUrl } = useCurrentUrl();

    useEffect(() => {
        setLayoutProps({
            breadcrumbs: [
                { title: 'Panel', href: dashboard() },
                {
                    title: tournament.name,
                    href: TournamentController.show(tournament),
                },
                { title: section, href: '' },
            ],
        });
    }, [tournament, section]);

    const tabs = [
        { title: 'Resumen', href: TournamentController.show(tournament) },
        { title: 'Calendario', href: ScheduleController.show(tournament) },
        ...(canManage
            ? [
                  {
                      title: 'Equipos',
                      href: TeamController.index(tournament),
                  },
                  {
                      title: 'Reglas',
                      href: TournamentRuleController.edit(tournament),
                  },
                  {
                      title: 'Anotadores',
                      href: ScorerController.index(tournament),
                  },
                  {
                      title: 'Configuración',
                      href: TournamentController.edit(tournament),
                  },
              ]
            : []),
    ];

    return (
        <div className="flex flex-1 flex-col">
            <div className="border-b bg-gradient-to-br from-brand/10 via-transparent to-brand-orange/10 px-4 pt-5">
                <div className="flex items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
                        <SportIcon
                            sport={tournament.sport}
                            className="size-6"
                        />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-lg leading-tight font-semibold">
                            {tournament.name}
                        </h1>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            <span>
                                {tournament.variant_label ??
                                    tournament.sport_label}
                            </span>
                            <span aria-hidden>·</span>
                            <span>{tournament.format_label}</span>
                            <StatusBadge
                                status={tournament.status}
                                label={tournament.status_label}
                            />
                        </div>
                    </div>
                </div>

                <nav className="-mx-4 mt-4 flex [scrollbar-width:none] gap-1 overflow-x-auto px-4 [&::-webkit-scrollbar]:hidden">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.title}
                            href={tab.href}
                            className={cn(
                                'shrink-0 border-b-2 border-transparent px-3 pb-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                                isCurrentUrl(tab.href) &&
                                    'border-brand text-foreground',
                            )}
                        >
                            {tab.title}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="w-full max-w-3xl flex-1 p-4">{children}</div>
        </div>
    );
}
