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
 * The first `qualifiers` rows are marked as going through to the knockout.
 */
export function StandingsTable({
    table,
    columns,
    qualifiers,
}: {
    table: StandingTable;
    columns: Record<string, string>;
    qualifiers?: number | null;
}) {
    const keys = Object.keys(columns) as (keyof StandingRow)[];

    return (
        <div className="overflow-hidden rounded-2xl border bg-card">
            {table.title && (
                <h3 className="border-b bg-muted/50 px-3 py-2 text-sm font-semibold">
                    {table.title}
                </h3>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-sm tabular-nums">
                    <thead>
                        <tr className="text-xs text-muted-foreground">
                            <th className="w-8 py-2 pl-3 text-left font-medium">
                                #
                            </th>
                            <th className="py-2 text-left font-medium">
                                Equipo
                            </th>
                            {keys.map((key) => (
                                <th
                                    key={key}
                                    className={cn(
                                        'px-1 py-2 text-center font-medium sm:px-1.5',
                                        key === 'points' &&
                                            'pr-3 text-foreground',
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

                            return (
                                <tr key={row.team.id} className="border-t">
                                    <td
                                        className={cn(
                                            'border-l-4 border-transparent py-2 pl-2 text-xs font-semibold text-muted-foreground',
                                            qualifies &&
                                                'border-brand text-brand dark:text-blue-300',
                                        )}
                                    >
                                        {row.position}
                                    </td>
                                    <td className="py-2 pr-2">
                                        <span className="flex min-w-[7.5rem] items-center gap-2">
                                            <TeamAvatar
                                                team={row.team}
                                                className="size-6 shrink-0 text-[10px]"
                                            />
                                            <span className="max-w-[9rem] truncate font-medium sm:max-w-none">
                                                {row.team.name}
                                            </span>
                                        </span>
                                    </td>
                                    {keys.map((key) => (
                                        <td
                                            key={key}
                                            className={cn(
                                                'px-1 py-2 text-center text-xs sm:px-1.5 sm:text-sm',
                                                key === 'points'
                                                    ? 'pr-3 font-bold'
                                                    : 'text-muted-foreground',
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
