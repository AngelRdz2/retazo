import { router, useForm } from '@inertiajs/react';
import { Hand, Shuffle } from 'lucide-react';
import GroupController from '@/actions/App/Http/Controllers/GroupController';
import { TeamAvatar } from '@/components/team-avatar';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import type { Team, Tournament } from '@/types/tournament';

type GroupTeam = Pick<Team, 'id' | 'name' | 'color' | 'logo_url'> & {
    group_id: number | null;
};

/**
 * Draw or hand-pick which teams play in each group (before generating the schedule).
 */
export function GroupsPanel({
    tournament,
    groups,
    teams,
}: {
    tournament: Tournament;
    groups: { id: number; name: string }[];
    teams: GroupTeam[];
}) {
    const form = useForm<{ assignments: Record<number, number | null> }>(
        GroupController.update(tournament),
        {
            assignments: Object.fromEntries(
                teams.map((t) => [t.id, t.group_id]),
            ),
        },
    );
    const assignments = form.data.assignments;
    const columns = [
        ...groups.map((g) => ({ id: g.id as number | null, name: g.name })),
        { id: null, name: 'Sin grupo' },
    ];

    const draw = () =>
        router.visit(GroupController.draw(tournament), {
            preserveScroll: true,
        });
    const manual = () =>
        router.visit(GroupController.manual(tournament), {
            preserveScroll: true,
        });

    if (groups.length === 0) {
        return (
            <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                    Reparte los {teams.length} equipos en{' '}
                    {tournament.settings.groups_count} grupos. Clasifican{' '}
                    {tournament.settings.qualifiers_per_group} por grupo.
                </p>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={draw}>
                        <Shuffle /> Sortear grupos
                    </Button>
                    <Button variant="outline" onClick={manual}>
                        <Hand /> Armar a mano
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
                {columns.map((column) => {
                    const members = teams.filter(
                        (t) => (assignments[t.id] ?? null) === column.id,
                    );

                    if (column.id === null && members.length === 0) {
                        return null;
                    }

                    return (
                        <div
                            key={column.name}
                            className="rounded-xl border p-3"
                        >
                            <p className="mb-2 text-sm font-semibold">
                                {column.name}{' '}
                                <span className="font-normal text-muted-foreground">
                                    ({members.length})
                                </span>
                            </p>
                            <ul className="space-y-2">
                                {members.map((team) => (
                                    <li
                                        key={team.id}
                                        className="flex items-center gap-2"
                                    >
                                        <TeamAvatar
                                            team={team}
                                            className="size-6 text-xs"
                                        />
                                        <span className="flex-1 truncate text-sm">
                                            {team.name}
                                        </span>
                                        <NativeSelect
                                            aria-label={`Grupo de ${team.name}`}
                                            className="h-8 w-28"
                                            value={assignments[team.id] ?? ''}
                                            onChange={(e) => {
                                                const groupId = e.target.value
                                                    ? Number(e.target.value)
                                                    : null;
                                                form.setData((data) => ({
                                                    assignments: {
                                                        ...data.assignments,
                                                        [team.id]: groupId,
                                                    },
                                                }));
                                            }}
                                        >
                                            {groups.map((g) => (
                                                <option key={g.id} value={g.id}>
                                                    {g.name}
                                                </option>
                                            ))}
                                            <option value="">Sin grupo</option>
                                        </NativeSelect>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>
            <div className="flex flex-wrap gap-2">
                <Button
                    onClick={() => form.submit({ preserveScroll: true })}
                    disabled={!form.isDirty || form.processing}
                >
                    {form.processing && <Spinner />}
                    Guardar grupos
                </Button>
                <Button variant="outline" onClick={draw}>
                    <Shuffle /> Volver a sortear
                </Button>
            </div>
        </div>
    );
}
