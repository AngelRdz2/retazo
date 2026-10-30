import { cn } from '@/lib/utils';
import type { Team } from '@/types/tournament';

/**
 * Team logo, or a circle with the team color and initial when there is no logo.
 */
export function TeamAvatar({
    team,
    className,
}: {
    team: Pick<Team, 'name' | 'color' | 'logo_url'>;
    className?: string;
}) {
    if (team.logo_url) {
        return (
            <img
                src={team.logo_url}
                alt=""
                className={cn(
                    'size-8 shrink-0 rounded-full bg-white object-contain',
                    className,
                )}
            />
        );
    }

    return (
        <span
            className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white',
                className,
            )}
            style={{ backgroundColor: team.color ?? '#64748b' }}
        >
            {team.name.charAt(0).toUpperCase()}
        </span>
    );
}
