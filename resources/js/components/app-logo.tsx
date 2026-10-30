import AppLogoIcon from '@/components/app-logo-icon';
import { cn } from '@/lib/utils';

/**
 * Full "RETAZO" wordmark. Inside a collapsed sidebar it falls back to the icon.
 */
export default function AppLogo({ className }: { className?: string }) {
    return (
        <>
            <AppLogoIcon className="hidden size-8 group-data-[collapsible=icon]:block" />
            <img
                src="/images/logo.png"
                alt="Retazo"
                className={cn(
                    'h-7 w-auto object-contain group-data-[collapsible=icon]:hidden',
                    className,
                )}
            />
        </>
    );
}
