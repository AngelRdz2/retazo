import { Trophy } from 'lucide-react';
import { TeamAvatar } from '@/components/team-avatar';
import { formatGameTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Game, GameTeam } from '@/types/tournament';

export type BracketData = {
    size: number;
    rounds: { round: number; label: string; games: Game[] }[];
};

// Height of each first-round slot. Every later round splits the same height in
// half as many slots, so each game sits right between the two games that feed it.
const SLOT_HEIGHT = 104;

/**
 * Classic knockout bracket: one column per round joined by lines, scrollable sideways on phones.
 */
export function Bracket({ bracket }: { bracket: BracketData }) {
    const height = (bracket.size / 2) * SLOT_HEIGHT;
    const final = bracket.rounds[bracket.rounds.length - 1]?.games[0];
    const champion =
        final?.status === 'finished'
            ? final.winner_team_id === final.home_team_id
                ? final.home_team
                : final.away_team
            : null;

    return (
        <div className="-mx-4 overflow-x-auto px-4 pb-4">
            <div className="flex w-max gap-8">
                {bracket.rounds.map((round, index) => {
                    const slots = bracket.size / 2 ** round.round;
                    const byPosition = new Map(
                        round.games.map((g) => [g.bracket_position, g]),
                    );
                    const isLast = index === bracket.rounds.length - 1;

                    return (
                        <div key={round.round} className="w-52 shrink-0">
                            <h4 className="mb-3 text-center text-xs font-semibold tracking-wide text-white/50 uppercase">
                                {round.label}
                            </h4>
                            <div className="flex flex-col" style={{ height }}>
                                {Array.from(
                                    { length: slots },
                                    (_, position) => {
                                        const game = byPosition.get(position);

                                        return (
                                            <div
                                                key={position}
                                                className="relative flex flex-1 items-center"
                                            >
                                                {index > 0 && (
                                                    <span className="absolute top-1/2 right-full w-4 border-t-2 border-white/15" />
                                                )}
                                                {!isLast && (
                                                    <>
                                                        <span className="absolute top-1/2 left-full w-4 border-t-2 border-white/15" />
                                                        <span
                                                            className={cn(
                                                                'absolute left-[calc(100%+1rem)] h-1/2 border-l-2 border-white/15',
                                                                position % 2 ===
                                                                    0
                                                                    ? 'top-1/2'
                                                                    : 'bottom-1/2',
                                                            )}
                                                        />
                                                    </>
                                                )}
                                                {game ? (
                                                    <BracketGame game={game} />
                                                ) : (
                                                    <ByeSlot
                                                        team={byeTeam(
                                                            bracket,
                                                            position,
                                                        )}
                                                    />
                                                )}
                                            </div>
                                        );
                                    },
                                )}
                            </div>
                        </div>
                    );
                })}

                {champion && (
                    <div className="flex w-44 shrink-0 flex-col">
                        <h4 className="mb-3 text-center text-xs font-semibold tracking-wide text-brand-orange uppercase">
                            Campeón
                        </h4>
                        <div
                            className="flex flex-1 items-center"
                            style={{ height }}
                        >
                            <div className="w-full rounded-2xl bg-gradient-to-br from-brand-orange to-orange-600 p-4 text-center text-white shadow-lg shadow-brand-orange/30">
                                <Trophy className="mx-auto size-8" />
                                <TeamAvatar
                                    team={champion}
                                    className="mx-auto mt-2 size-10 ring-2 ring-white"
                                />
                                <p className="mt-2 font-bold">
                                    {champion.name}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Team that skipped the first round: it already waits in its second-round game.
 */
function byeTeam(bracket: BracketData, position: number): GameTeam | null {
    const next = bracket.rounds[1]?.games.find(
        (g) => g.bracket_position === Math.floor(position / 2),
    );

    if (!next) {
        return null;
    }

    return position % 2 === 0 ? next.home_team : next.away_team;
}

function BracketGame({ game }: { game: Game }) {
    const played = game.status !== 'scheduled';

    return (
        <div
            className={cn(
                'w-full overflow-hidden rounded-xl border border-white/10 bg-[#0b1220]',
                game.status === 'live' &&
                    'border-red-500/60 ring-2 ring-red-500/30',
            )}
        >
            <div className="flex items-center justify-between bg-white/[0.04] px-2.5 py-1 text-[10px] text-white/50">
                <span className="truncate">
                    {game.scheduled_at
                        ? formatGameTime(game.scheduled_at)
                        : 'Por programar'}
                </span>
                {game.status === 'live' && (
                    <span className="font-bold text-red-400">EN VIVO</span>
                )}
            </div>
            {(['home', 'away'] as const).map((side) => {
                const team = side === 'home' ? game.home_team : game.away_team;
                const winner =
                    game.winner_team_id !== null &&
                    game.winner_team_id === team?.id;
                const loser = game.winner_team_id !== null && !winner;
                const penalties =
                    side === 'home' ? game.home_penalties : game.away_penalties;

                return (
                    <div
                        key={side}
                        className={cn(
                            'flex items-center gap-2 px-2.5 py-1.5 text-sm',
                            winner && 'bg-white/[0.06] font-bold',
                            loser && 'text-white/45',
                        )}
                    >
                        {team ? (
                            <TeamAvatar
                                team={team}
                                className="size-5 text-[9px]"
                            />
                        ) : (
                            <span className="size-5 rounded-full border border-dashed border-white/25" />
                        )}
                        <span
                            className={cn(
                                'flex-1 truncate',
                                !team && 'text-white/40 italic',
                            )}
                        >
                            {team?.name ?? 'Por definir'}
                        </span>
                        {played && (
                            <span className="tabular-nums">
                                {side === 'home'
                                    ? game.home_score
                                    : game.away_score}
                                {penalties !== null && (
                                    <sup className="ml-0.5 text-[10px] text-white/50">
                                        ({penalties})
                                    </sup>
                                )}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function ByeSlot({ team }: { team: GameTeam | null }) {
    return (
        <div className="w-full rounded-xl border border-dashed border-white/20 px-2.5 py-2 text-sm text-white/55">
            <div className="flex items-center gap-2">
                {team && (
                    <TeamAvatar team={team} className="size-5 text-[9px]" />
                )}
                <span className="truncate">{team?.name ?? '—'}</span>
            </div>
            <p className="mt-0.5 text-[10px]">Pasa directo</p>
        </div>
    );
}
