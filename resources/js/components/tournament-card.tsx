import { Link } from '@inertiajs/react';
import { CalendarDays, CirclePlay, MapPin, Users } from 'lucide-react';
import PublicTournamentController from '@/actions/App/Http/Controllers/Public/TournamentController';
import { SportIcon } from '@/components/sport-icon';
import { StatusBadge } from '@/components/status-badge';
import { TeamCrest } from '@/components/team-crest';
import { formatDate, plural } from '@/lib/format';
import type { GameTeam, Tournament } from '@/types/tournament';

/**
 * Dark public card linking to the tournament page, with the crests of some of its teams.
 */
export function TournamentCard({
    tournament,
}: {
    tournament: Tournament & { teams?: GameTeam[] };
}) {
    const teams = tournament.teams ?? [];
    const total = tournament.teams_count ?? teams.length;

    return (
        <Link
            href={PublicTournamentController.show(tournament)}
            className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b1220] text-left text-white transition-colors hover:border-white/30"
        >
            <div className="relative flex h-36 items-center justify-center bg-[radial-gradient(90%_120%_at_50%_0%,#0f4a63_0%,#0b1220_75%)]">
                <span className="absolute top-3 left-3 flex items-center gap-1.5 text-[11px] text-white/60">
                    <SportIcon sport={tournament.sport} className="size-3.5" />
                    {tournament.variant_label ?? tournament.sport_label}
                </span>
                <StatusBadge
                    status={tournament.status}
                    label={tournament.status_label}
                    className="absolute top-3 right-3"
                />

                {teams.length > 0 ? (
                    <div className="mt-4 flex items-center -space-x-2">
                        {teams.map((team) => (
                            <TeamCrest key={team.id} team={team} size="md" />
                        ))}
                        {total > teams.length && (
                            <span className="ml-3 rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold">
                                +{total - teams.length}
                            </span>
                        )}
                    </div>
                ) : (
                    <SportIcon
                        sport={tournament.sport}
                        strokeWidth={1.5}
                        className="mt-4 size-14 text-white/30"
                    />
                )}
            </div>

            <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="line-clamp-1 font-semibold">
                    {tournament.name}
                </h3>
                <p className="text-xs text-white/50">
                    {tournament.format_label}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/60">
                    <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3.5" />
                        {formatDate(tournament.start_date, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </span>
                    {tournament.location && (
                        <span className="inline-flex min-w-0 items-center gap-1">
                            <MapPin className="size-3.5 shrink-0" />
                            <span className="truncate">
                                {tournament.location}
                            </span>
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                        <Users className="size-3.5" />
                        {plural(total, 'equipo', 'equipos')}
                    </span>
                </div>
                <p className="mt-auto inline-flex items-center gap-1.5 pt-1 text-sm font-medium">
                    Ver torneo
                    <CirclePlay className="size-4 transition-transform group-hover:translate-x-0.5" />
                </p>
            </div>
        </Link>
    );
}
