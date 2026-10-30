import { Link } from '@inertiajs/react';
import { CalendarDays, CirclePlay, MapPin } from 'lucide-react';
import PublicTournamentController from '@/actions/App/Http/Controllers/Public/TournamentController';
import { SportIcon } from '@/components/sport-icon';
import { TeamCrest } from '@/components/team-crest';
import { formatGameTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { GameStatus, GameTeam, SportValue } from '@/types/tournament';

export type MatchCardData = {
    id: number;
    status: GameStatus;
    scheduled_at: string | null;
    venue: string | null;
    home_score: number;
    away_score: number;
    home_penalties: number | null;
    away_penalties: number | null;
    winner_team_id: number | null;
    home_team: GameTeam;
    away_team: GameTeam;
    tournament: {
        name: string;
        slug: string;
        sport: SportValue;
        sport_label: string;
    };
};

/**
 * "Team VS Team" card of a public game; links to its tournament page with the game in the header.
 */
export function MatchCard({ game }: { game: MatchCardData }) {
    const played = game.status !== 'scheduled';
    const live = game.status === 'live';
    const tab = game.status === 'finished' ? 'resultados' : 'partidos';

    return (
        <Link
            href={PublicTournamentController.show(game.tournament, {
                query: { tab, partido: game.id },
            })}
            className={cn(
                'group overflow-hidden rounded-3xl border bg-[#0b1220] transition-colors',
                live
                    ? 'border-red-500/50'
                    : 'border-white/10 hover:border-white/30',
            )}
        >
            <div className="relative flex items-center justify-center gap-4 bg-[radial-gradient(90%_120%_at_50%_0%,#0f4a63_0%,#0b1220_75%)] px-4 py-8">
                <span className="absolute top-3 left-3 flex items-center gap-1.5 text-[11px] text-white/60">
                    <SportIcon
                        sport={game.tournament.sport}
                        className="size-3.5"
                    />
                    {game.tournament.sport_label}
                </span>
                {live && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold tracking-wide">
                        <span className="size-1.5 animate-pulse rounded-full bg-white" />{' '}
                        EN VIVO
                    </span>
                )}
                <TeamCrest team={game.home_team} size="lg" />
                <span className="w-20 text-center font-display text-4xl tracking-wide">
                    {played ? (
                        <>
                            {game.home_score}
                            <span className="mx-1 text-white/40">-</span>
                            {game.away_score}
                        </>
                    ) : (
                        'VS'
                    )}
                </span>
                <TeamCrest team={game.away_team} size="lg" />
            </div>

            <div className="space-y-2 p-4">
                <p className="truncate text-sm font-semibold">
                    {game.home_team.name}{' '}
                    <span className="text-white/40">VS</span>{' '}
                    {game.away_team.name}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/60">
                    {game.scheduled_at && (
                        <span className="inline-flex items-center gap-1">
                            <CalendarDays className="size-3.5" />
                            {formatGameTime(game.scheduled_at)}
                        </span>
                    )}
                    <span className="inline-flex min-w-0 items-center gap-1">
                        <MapPin className="size-3.5 shrink-0" />
                        <span className="truncate">
                            {game.venue ?? game.tournament.name}
                        </span>
                    </span>
                </div>
                <p className="inline-flex items-center gap-1.5 text-sm font-medium">
                    {live
                        ? 'Ver en vivo'
                        : played
                          ? 'Ver resultado'
                          : 'Ver partido'}
                    <CirclePlay className="size-4 transition-transform group-hover:translate-x-0.5" />
                </p>
                {game.home_penalties !== null && (
                    <p className="text-xs text-white/50">
                        Penales {game.home_penalties}-{game.away_penalties}
                    </p>
                )}
            </div>
        </Link>
    );
}
