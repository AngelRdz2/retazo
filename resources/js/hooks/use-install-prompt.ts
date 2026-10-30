import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
};

// The browser fires this once, early, so it is captured at module load.
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferred = event as BeforeInstallPromptEvent;
        notify();
    });
    window.addEventListener('appinstalled', () => {
        deferred = null;
        notify();
    });
}

/**
 * "Install app" support: true once the browser offers to add Retazo to the home screen.
 */
export function useInstallPrompt() {
    const [canInstall, setCanInstall] = useState(deferred !== null);

    useEffect(() => {
        const listener = () => setCanInstall(deferred !== null);
        listeners.add(listener);
        listener();

        return () => {
            listeners.delete(listener);
        };
    }, []);

    const install = async () => {
        if (!deferred) {
            return;
        }

        await deferred.prompt();
        deferred = null;
        notify();
    };

    return { canInstall, install };
}
