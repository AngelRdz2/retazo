import { Dribbble, Goal, Volleyball } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { SportValue } from '@/types/tournament';

const icons = {
    football: Goal,
    volleyball: Volleyball,
    basketball: Dribbble,
} as const;

export function SportIcon({
    sport,
    ...props
}: LucideProps & { sport: SportValue }) {
    const Icon = icons[sport];

    return <Icon {...props} />;
}
