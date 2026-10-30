import { cn } from '@/lib/utils';
import type { TournamentStatus } from '@/types/tournament';

const styles: Record<TournamentStatus, string> = {
    draft: 'bg-muted text-muted-foreground',
    registration_open:
        'bg-brand-orange/15 text-orange-700 dark:text-orange-300',
    in_progress: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    finished: 'bg-brand/10 text-brand dark:text-blue-300',
};

export function StatusBadge({
    status,
    label,
    className,
}: {
    status: TournamentStatus;
    label: string;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
                styles[status],
                className,
            )}
        >
            {status === 'in_progress' && (
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            )}
            {label}
        </span>
    );
}
