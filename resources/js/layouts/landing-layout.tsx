import type { PropsWithChildren } from 'react';
import { LandingFooter, LandingNav } from '@/components/landing';

/**
 * Dark public pages with the same look as the home page.
 */
export default function LandingLayout({ children }: PropsWithChildren) {
    return (
        <div className="dark relative min-h-svh overflow-x-hidden bg-[#04070d] font-sans text-white">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(80%_60%_at_50%_0%,#0e3a55_0%,#071827_45%,transparent_80%)]"
            />
            <div className="relative mx-auto max-w-6xl px-3 pt-3 sm:px-6 sm:pt-6">
                <LandingNav />
            </div>
            <main className="relative">{children}</main>
            <LandingFooter />
        </div>
    );
}
