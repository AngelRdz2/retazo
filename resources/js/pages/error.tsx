import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import LandingLayout from '@/layouts/landing-layout';
import { dashboard, home } from '@/routes';

const messages: Record<number, { title: string; text: string }> = {
    403: {
        title: 'Sin acceso',
        text: 'Esta página es solo para el organizador del torneo y sus anotadores.',
    },
    404: {
        title: 'Página no encontrada',
        text: 'Puede que el enlace esté mal escrito o que el torneo ya no esté publicado.',
    },
    500: {
        title: 'Algo salió mal',
        text: 'Tuvimos un problema de nuestro lado. Intenta de nuevo en un momento.',
    },
    503: {
        title: 'En mantenimiento',
        text: 'Estamos haciendo ajustes. Vuelve en unos minutos.',
    },
};

/**
 * Error page of the app (403, 404 and, outside development, 500 and 503).
 */
export default function ErrorPage({ status }: { status: number }) {
    const { auth } = usePage().props;
    const message = messages[status] ?? messages[500];

    return (
        <LandingLayout>
            <Head title={message.title} />
            <section className="mx-auto flex max-w-xl flex-col items-center px-4 pt-14 pb-8 text-center sm:pt-24">
                <span className="font-display text-[7rem] leading-none tracking-wide text-brand-orange sm:text-[10rem]">
                    {status}
                </span>
                <h1 className="mt-2 font-display text-4xl tracking-wide uppercase sm:text-5xl">
                    {message.title}
                </h1>
                <p className="mt-3 text-sm text-white/65 sm:text-base">
                    {message.text}
                </p>
                {status === 403 && auth.user && (
                    <p className="mt-2 text-sm text-white/50">
                        Entraste como{' '}
                        <span className="font-semibold text-white/80">
                            {auth.user.name}
                        </span>
                        .
                    </p>
                )}

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    {auth.user && (
                        <Link
                            href={dashboard()}
                            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-white/90"
                        >
                            Ir a mi panel <ArrowRight className="size-4" />
                        </Link>
                    )}
                    <Link
                        href={home()}
                        className="inline-flex items-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold hover:bg-white/10"
                    >
                        Ir al inicio
                    </Link>
                </div>
            </section>
        </LandingLayout>
    );
}
