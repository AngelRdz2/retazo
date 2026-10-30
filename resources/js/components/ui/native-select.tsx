import type * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Plain <select>: on phones it opens the native picker, which is easier to use.
 */
function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
    return (
        <select
            data-slot="native-select"
            className={cn(
                'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 [&>option]:bg-background',
                className,
            )}
            {...props}
        />
    );
}

export { NativeSelect };
