import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * What Retazo is not: no betting, no money, nothing professional.
 * Kept in one place so every page shows the same wording.
 */
export const DISCLAIMER =
    'Retazo es solo una herramienta para organizar y llevar el control de torneos deportivos amateur. ' +
    'No es una casa de apuestas: no acepta apuestas, no cobra inscripciones, no paga premios ni maneja dinero de ningún tipo. ' +
    'Tampoco está afiliado a ligas, federaciones ni competiciones profesionales. ' +
    'Cualquier cuota o premio de un torneo es un acuerdo entre los equipos y su organizador, ajeno a Retazo.';

export const MONEY_NOTE =
    'Retazo no cobra inscripciones ni maneja dinero. Si el torneo tiene una cuota, se arregla directamente con el organizador.';

/**
 * Notice shown at the bottom of the public pages.
 */
export function Disclaimer({ className }: { className?: string }) {
    return (
        <aside
            aria-label="Aviso"
            className={cn(
                'flex gap-3 text-left text-xs leading-relaxed',
                className,
            )}
        >
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            <p>
                <strong className="font-semibold">Aviso:</strong> {DISCLAIMER}
            </p>
        </aside>
    );
}

/**
 * Short reminder for places where money may come up (e.g. team registration).
 */
export function MoneyNote({ className }: { className?: string }) {
    return (
        <p
            className={cn(
                'flex gap-2 rounded-xl border border-brand/20 bg-brand/5 p-3 text-xs leading-relaxed text-muted-foreground',
                className,
            )}
        >
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand dark:text-blue-300" />
            {MONEY_NOTE}
        </p>
    );
}
