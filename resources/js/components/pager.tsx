import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

/**
 * "Anteriores · 2 de 5 · Siguientes" for the dark public pages.
 */
export function Pager({ page }: { page: Paginated<unknown> }) {
    if (page.last_page <= 1) {
        return null;
    }

    return (
        <nav
            className="mt-10 flex items-center justify-center gap-3"
            aria-label="Páginas"
        >
            <PageLink url={page.prev_page_url}>
                <ChevronLeft className="size-4" /> Anteriores
            </PageLink>
            <span className="text-sm text-white/50">
                {page.current_page} de {page.last_page}
            </span>
            <PageLink url={page.next_page_url}>
                Siguientes <ChevronRight className="size-4" />
            </PageLink>
        </nav>
    );
}

function PageLink({
    url,
    children,
}: {
    url: string | null;
    children: ReactNode;
}) {
    const className =
        'inline-flex items-center gap-1 rounded-full border border-white/20 px-4 py-2 text-sm font-medium';

    if (!url) {
        return <span className={cn(className, 'opacity-40')}>{children}</span>;
    }

    return (
        <Link
            href={url}
            preserveScroll
            className={cn(className, 'hover:bg-white/10')}
        >
            {children}
        </Link>
    );
}
