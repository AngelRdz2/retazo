import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type SegmentedOption = {
    value: string;
    label: string;
    icon?: ReactNode;
};

/**
 * Pill group where one option is selected (e.g. "Próximos | Resultados").
 * Scrolls sideways on narrow screens instead of wrapping.
 */
export function SegmentedControl({
    options,
    value,
    onChange,
    label,
    className,
}: {
    options: SegmentedOption[];
    value: string;
    onChange: (value: string) => void;
    label: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'max-w-full [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden',
                className,
            )}
        >
            <div
                role="radiogroup"
                aria-label={label}
                className="inline-flex gap-1 rounded-full border border-white/10 bg-white/[0.06] p-1"
            >
                {options.map((option) => {
                    const selected = option.value === value;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => onChange(option.value)}
                            className={cn(
                                'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors sm:px-4 sm:text-sm [&_svg]:size-4',
                                selected
                                    ? 'bg-white text-slate-900 shadow'
                                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                            )}
                        >
                            {option.icon}
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
