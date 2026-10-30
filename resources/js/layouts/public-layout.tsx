import { Link, usePage } from '@inertiajs/react';
import { Download } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { Button } from '@/components/ui/button';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { dashboard, home, login, register } from '@/routes';

/**
 * Header and footer for pages anyone can see without logging in.
 */
export default function PublicLayout({ children }: PropsWithChildren) {
    const { auth } = usePage().props;
    const { canInstall, install } = useInstallPrompt();

    return (
        <div className="flex min-h-svh flex-col bg-background">
            <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
                    <Link href={home()} className="shrink-0">
                        <img
                            src="/images/logo.png"
                            alt="Retazo"
                            className="h-6 w-auto sm:h-7"
                        />
                    </Link>
                    <nav className="flex items-center gap-1.5">
                        {canInstall && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={install}
                                aria-label="Instalar app"
                                title="Instalar app"
                            >
                                <Download />
                            </Button>
                        )}
                        {auth.user ? (
                            <Button asChild size="sm">
                                <Link href={dashboard()}>Mi panel</Link>
                            </Button>
                        ) : (
                            <>
                                <Button asChild variant="ghost" size="sm">
                                    <Link href={login()}>Iniciar sesión</Link>
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    className="hidden bg-brand-orange text-white hover:bg-brand-orange/90 sm:inline-flex"
                                >
                                    <Link href={register()}>Crear cuenta</Link>
                                </Button>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <main className="flex-1">{children}</main>

            <footer className="border-t">
                <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
                    <div className="flex flex-col items-center gap-3 sm:flex-row">
                        <img
                            src="/images/logo-icon.png"
                            alt=""
                            className="h-8 w-auto"
                        />
                        <p className="text-sm text-muted-foreground">
                            Torneos de fútbol, vóley y básquet para ligas de
                            barrio, colegios y empresas.
                        </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} Retazo
                    </p>
                </div>
            </footer>
        </div>
    );
}
