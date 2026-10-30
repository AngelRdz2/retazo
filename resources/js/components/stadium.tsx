import { cn } from '@/lib/utils';
import type { SportValue } from '@/types/tournament';

const surfaces: Record<SportValue, string> = {
    football:
        'bg-[repeating-linear-gradient(90deg,#11612e_0_90px,#0d5326_90px_180px)]',
    volleyball:
        'bg-[repeating-linear-gradient(90deg,#a9532a_0_90px,#9c4c27_90px_180px)]',
    basketball:
        'bg-[repeating-linear-gradient(90deg,#8a5a2b_0_26px,#7b4f25_26px_52px)]',
};

/**
 * Night stadium: floodlights, stands and a pitch in perspective (or a photo, when there is one).
 * Sits behind the page; `className` sets how tall it is.
 */
export function Stadium({
    image,
    sport = 'football',
    className,
}: {
    image: string | null;
    sport?: SportValue;
    className?: string;
}) {
    return (
        <div
            aria-hidden
            className={cn(
                'pointer-events-none absolute inset-x-0 top-0 h-[1150px] overflow-hidden',
                className,
            )}
        >
            {image ? (
                <img
                    src={image}
                    alt=""
                    className="absolute inset-0 size-full object-cover object-top opacity-80"
                />
            ) : (
                <>
                    <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_0%,#0e4d6e_0%,#08263b_38%,#04070d_78%)]" />
                    {/* Floodlights and their beams. */}
                    <div className="absolute -top-16 left-[6%] h-44 w-80 rounded-full bg-cyan-100/35 blur-3xl" />
                    <div className="absolute -top-16 right-[6%] h-44 w-80 rounded-full bg-cyan-100/35 blur-3xl" />
                    <div className="absolute top-0 left-[18%] h-[620px] w-44 origin-top rotate-[22deg] bg-gradient-to-b from-white/14 to-transparent blur-2xl" />
                    <div className="absolute top-0 right-[18%] h-[620px] w-44 origin-top -rotate-[22deg] bg-gradient-to-b from-white/14 to-transparent blur-2xl" />
                    {/* Crowd in the stands. */}
                    <div className="absolute inset-x-0 top-[200px] h-56 bg-[radial-gradient(rgb(255_255_255/0.16)_1px,transparent_1.6px)] [mask-image:linear-gradient(to_bottom,transparent,black_40%,black_60%,transparent)] bg-[size:8px_8px]" />
                    {/* Pitch in perspective, right behind the hero. */}
                    <div className="absolute inset-x-[-50%] bottom-[430px] h-[1100px] origin-bottom [transform:perspective(600px)_rotateX(62deg)]">
                        <div
                            className={cn('absolute inset-0', surfaces[sport])}
                        />
                        <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-white/45" />
                        <div className="absolute top-1/2 left-1/2 size-[360px] -translate-1/2 rounded-full border-4 border-white/45" />
                        <div className="absolute inset-x-0 top-0 h-1 bg-white/45" />
                    </div>
                    {/* The near edge of the pitch fades into the night. */}
                    <div className="absolute inset-x-0 bottom-[430px] h-40 bg-gradient-to-b from-transparent to-[#04070d]" />
                </>
            )}
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-b from-transparent via-[#04070d]/70 to-[#04070d]" />
        </div>
    );
}
