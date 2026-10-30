import { TeamAvatar } from '@/components/team-avatar';
import { cn } from '@/lib/utils';
import type { GameTeam } from '@/types/tournament';

export type StandingRow = {
    team: GameTeam;
    position: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    for: number;
    against: number;
    difference: number;
    points: number;
};

export type StandingTable = {
    title: string | null;
    group_id: number | null;
    rows: StandingRow[];
};

/**
 * Standings with the columns of the sport (e.g. football: PJ G E P GF GC DG Pts).
 * The first `qualifiers` rows are marked as going through to the knockout, and the
 * `highlight` teams (e.g. the two of a match) stand out in their own color.
 */
export function StandingsTable({
    table,
    columns,
    qualifiers,
    highlight = [],
}: {
    table: StandingTable;
    columns: Record<string, string>;
    qualifiers?: number | null;
    highlight?: number[];
}) {
    const keys = Object.keys(columns) as (keyof StandingRow)[];
    const focused = table.rows.some((row) => highlight.includes(row.team.id));

    return (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1220]">
            {table.title && (
                <h3 className="border-b border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold">
                    {table.title}
                </h3>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-sm tabular-nums">
                    <thead>
                        <tr className="text-[11px] tracking-wide text-white/45 uppercase">
                            <th className="w-10 py-2.5 pl-3 text-left font-medium">
                                #
                            </th>
                            <th className="py-2.5 text-left font-medium">
                                Equipo
                            </th>
                            {keys.map((key) => (
                                <th
                                    key={key}
                                    className={cn(
                                        'px-1 py-2.5 text-center font-medium sm:px-1.5',
                                        key === 'points' && 'pr-4 text-white',
                                    )}
                                >
                                    {columns[key]}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {table.rows.map((row) => {
                            const qualifies =
                                qualifiers != null &&
                                row.position <= qualifiers;
                            const highlighted = highlight.includes(row.team.id);
                            const color = row.team.color ?? '#64748b';

                            return (
                                <tr
                                    key={row.team.id}
                                    className={cn(
                                        'border-t border-white/[0.06] transition-opacity',
                                        focused &&
                                            !highlighted &&
                                            'opacity-55 hover:opacity-100',
                                    )}
                                    style={
                                        highlighted
                                            ? {
                                                  backgroundColor: `color-mix(in srgb, ${color} 22%, transparent)`,
                                              }
                                            : undefined
                                    }
                                >
                                    <td
                                        className={cn(
                                            'border-l-4 border-transparent py-2.5 pl-2 text-xs font-semibold text-white/50',
                                            qualifies &&
                                                'border-brand text-blue-300',
                                        )}
                                    >
                                        {highlighted ? (
                                            <span
                                                className="inline-flex size-6 items-center justify-center rounded-full text-white shadow"
                                                style={{
                                                    backgroundColor: color,
                                                }}
                                            >
                                                {row.position}
                                            </span>
                                        ) : (
                                            <span className="inline-flex w-6 justify-center">
                                                {row.position}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-2.5 pr-2">
                                        <span className="flex min-w-[7.5rem] items-center gap-2">
                                            <TeamAvatar
                                                team={row.team}
                                                className="size-6 shrink-0 text-[10px]"
                                            />
                                            <span
                                                className={cn(
                                                    'max-w-[9rem] truncate sm:max-w-none',
                                                    highlighted
                                                        ? 'font-bold'
                                                        : 'font-medium',
                                                )}
                                            >
                                                {row.team.name}
                                            </span>
                                        </span>
                                    </td>
                                    {keys.map((key) => (
                                        <td
                                            key={key}
                                            className={cn(
                                                'px-1 py-2.5 text-center text-xs sm:px-1.5 sm:text-sm',
                                                key === 'points'
                                                    ? 'pr-4 font-bold text-white'
                                                    : highlighted
                                                      ? 'text-white/85'
                                                      : 'text-white/55',
                                            )}
                                        >
                                            {key === 'difference' &&
                                            row.difference > 0
                                                ? `+${row.difference}`
                                                : (row[key] as number)}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
