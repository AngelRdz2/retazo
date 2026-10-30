import { Link, usePage } from '@inertiajs/react';
import { Download } from 'lucide-react';
import type { ReactNode } from 'react';
import MatchController from '@/actions/App/Http/Controllers/Public/MatchController';
import PageController from '@/actions/App/Http/Controllers/Public/PageController';
import PublicTournamentController from '@/actions/App/Http/Controllers/Public/TournamentController';
import TournamentController from '@/actions/App/Http/Controllers/TournamentController';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { cn } from '@/lib/utils';
import { dashboard, login, register } from '@/routes';

/**
 * Top bar of the dark public pages: logo, pill menu and account buttons.
 */
export function LandingNav({ className }: { className?: string }) {
    const { auth } = usePage().props;
    const { canInstall, install } = useInstallPrompt();

    return (
        <header
            className={cn(
                'flex items-center justify-between gap-3 p-3 sm:p-4',
                className,
            )}
        >
            <Link href="/" className="shrink-0 pl-1">
                <img
                    src="/images/logo.png"
                    alt="Retazo"
                    className="h-6 w-auto sm:h-8"
                />
            </Link>

            <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-black/40 p-1 text-sm backdrop-blur md:flex">
                <NavLink href="/">Inicio</NavLink>
                <NavLink href={PublicTournamentController.index.url()}>
                    Torneos
                </NavLink>
                <NavLink href={MatchController.index.url()}>Partidos</NavLink>
                <NavLink href={PageController.howItWorks.url()}>
                    Cómo funciona
                </NavLink>
            </nav>

            <div className="flex items-center gap-2">
                {canInstall && (
                    <button
                        type="button"
                        onClick={install}
                        className="flex size-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
                        aria-label="Instalar app"
                        title="Instalar app"
                    >
                        <Download className="size-4" />
                    </button>
                )}
                {auth.user ? (
                    <Link
                        href={dashboard()}
                        className="rounded-full bg-white px-4 py-2 text-sm font-semibold whitespace-nowrap text-slate-900 hover:bg-white/90 sm:px-5"
                    >
                        Mi panel
                    </Link>
                ) : (
                    <>
                        <Link
                            href={login()}
                            className="rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap text-white/85 hover:text-white"
                        >
                            Entrar
                        </Link>
                        <Link
                            href={register()}
                            className="rounded-full bg-white px-4 py-2 text-sm font-semibold whitespace-nowrap text-slate-900 hover:bg-white/90 sm:px-5"
                        >
                            Crear cuenta
                        </Link>
                    </>
                )}
            </div>
        </header>
    );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
    const { url } = usePage();
    const path = url.split(/[?#]/)[0];
    const active = !href.includes('#') && path === href;
    const className = cn(
        'rounded-full px-4 py-1.5 transition-colors hover:bg-white/10 hover:text-white',
        active ? 'bg-white/15 text-white' : 'text-white/75',
    );

    // Links to a section of the home page are plain anchors so the browser scrolls to them.
    return href.includes('#') ? (
        <a href={href} className={className}>
            {children}
        </a>
    ) : (
        <Link href={href} className={className}>
            {children}
        </Link>
    );
}

export function LandingFooter() {
    const { auth } = usePage().props;
    const columns = [
        {
            title: 'Explorar',
            links: [
                { label: 'Inicio', href: '/' },
                {
                    label: 'Torneos',
                    href: PublicTournamentController.index.url(),
                },
                { label: 'Partidos', href: MatchController.index.url() },
                {
                    label: 'Cómo funciona',
                    href: PageController.howItWorks.url(),
                },
            ],
        },
        {
            title: 'Organizadores',
            links: auth.user
                ? [
                      { label: 'Mi panel', href: dashboard.url() },
                      {
                          label: 'Crear torneo',
                          href: TournamentController.create.url(),
                      },
                  ]
                : [
                      { label: 'Crear cuenta', href: register.url() },
                      { label: 'Iniciar sesión', href: login.url() },
                  ],
        },
    ];

    return (
        <footer className="relative mt-16 border-t border-white/10">
            <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[1.5fr_1fr_1fr] sm:px-6">
                <div className="space-y-3">
                    <img
                        src="/images/logo.png"
                        alt="Retazo"
                        className="h-8 w-auto"
                    />
                    <p className="max-w-xs text-sm text-white/60">
                        Torneos de fútbol, vóley y básquet para ligas de barrio,
                        colegios y empresas.
                    </p>
                </div>
                {columns.map((column) => (
                    <div key={column.title}>
                        <p className="text-sm font-semibold">{column.title}</p>
                        <ul className="mt-3 space-y-2 text-sm text-white/60">
                            {column.links.map((link) => (
                                <li key={link.label}>
                                    {link.href.includes('#') ? (
                                        <a
                                            href={link.href}
                                            className="hover:text-white"
                                        >
                                            {link.label}
                                        </a>
                                    ) : (
                                        <Link
                                            href={link.href}
                                            className="hover:text-white"
                                        >
                                            {link.label}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <p className="border-t border-white/10 py-5 text-center text-xs text-white/40">
                © {new Date().getFullYear()} Retazo
            </p>
        </footer>
    );
}
