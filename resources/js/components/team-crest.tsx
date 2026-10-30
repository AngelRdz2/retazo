import { cn } from '@/lib/utils';
import type { GameTeam } from '@/types/tournament';

const sizes = {
    sm: 'size-10 text-base',
    md: 'size-14 text-xl',
    lg: 'size-[4.5rem] text-3xl',
    xl: 'size-24 text-4xl sm:size-36 sm:text-6xl',
};

/**
 * Shield in the team color with its initials (or its logo), used as a crest.
 */
export function TeamCrest({
    team,
    size = 'md',
    className,
}: {
    team: Pick<GameTeam, 'name' | 'color' | 'logo_url'>;
    size?: keyof typeof sizes;
    className?: string;
}) {
    const initials = team.name
        .split(/\s+/)
        .filter((word) => word.length > 2 || /^[A-Z0-9]/.test(word))
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase();

    return (
        <span
            className={cn(
                'relative inline-flex shrink-0 items-center justify-center',
                sizes[size],
                className,
            )}
            title={team.name}
        >
            <svg
                viewBox="0 0 64 72"
                className="absolute inset-0 size-full drop-shadow-[0_6px_10px_rgb(0_0_0/0.45)]"
                aria-hidden
            >
                <path
                    d="M32 3 59 11v23c0 18-12 30-27 35C17 64 5 52 5 34V11Z"
                    fill={team.color ?? '#64748b'}
                    stroke="white"
                    strokeOpacity="0.9"
                    strokeWidth="3"
                    strokeLinejoin="round"
                />
                <path
                    d="M10 15 32 9l22 6v6H10Z"
                    fill="white"
                    fillOpacity="0.22"
                />
                <path
                    d="M32 9 54 15v19c0 15-10 25-22 30Z"
                    fill="black"
                    fillOpacity="0.14"
                />
            </svg>
            {team.logo_url ? (
                <img
                    src={team.logo_url}
                    alt=""
                    className="relative size-[52%] rounded-full bg-white object-contain"
                />
            ) : (
                <span className="relative mt-[8%] font-display leading-none tracking-wide text-white drop-shadow">
                    {initials || '?'}
                </span>
            )}
        </span>
    );
}
