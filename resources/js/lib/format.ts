/**
 * "2026-11-05" → "5 de noviembre de 2026". Date-only strings are read as local dates.
 */
export function formatDate(
    value: string,
    options?: Intl.DateTimeFormatOptions,
) {
    const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);

    return date.toLocaleDateString(
        'es',
        options ?? { day: 'numeric', month: 'long', year: 'numeric' },
    );
}

/**
 * plural(1, 'equipo', 'equipos') → "1 equipo".
 */
export function plural(count: number, one: string, many: string) {
    return `${count} ${count === 1 ? one : many}`;
}

/**
 * Example volleyball results for each scoring case, e.g. best of 3 → win "2-0".
 */
export function setResultExamples(bestOf: number): Record<string, string> {
    const toWin = Math.floor(bestOf / 2) + 1;
    const clear = Array.from({ length: toWin - 1 }, (_, lost) => lost);

    return {
        win: clear.map((lost) => `${toWin}-${lost}`).join(' / '),
        win_close: `${toWin}-${toWin - 1}`,
        loss_close: `${toWin - 1}-${toWin}`,
        loss: clear.map((won) => `${won}-${toWin}`).join(' / '),
    };
}

/**
 * "2026-11-07T09:00" → "sáb, 7 nov · 09:00" (venue's local time, no timezone).
 */
export function formatGameTime(value: string) {
    const date = new Date(value);
    const day = date.toLocaleDateString('es', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
    const time = date.toLocaleTimeString('es', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    return `${day} · ${time}`;
}
