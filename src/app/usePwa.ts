import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useFeedback } from "../shared/feedback/FeedbackProvider";
import { useI18n } from "../shared/i18n/I18nContext";

/** Registra el service worker y avisa cuando la app está lista sin conexión o hay una versión nueva. */
export function usePwaUpdates(): void {
    const { t } = useI18n();
    const { notify } = useFeedback();
    const {
        needRefresh: [needRefresh],
        offlineReady: [offlineReady, setOfflineReady],
        updateServiceWorker,
    } = useRegisterSW();

    useEffect(() => {
        if (!needRefresh) return;
        notify({
            message: t("pwa.updateAvailable"),
            actionLabel: t("pwa.update"),
            onAction: () => void updateServiceWorker(true),
            persistent: true,
        });
    }, [needRefresh, notify, t, updateServiceWorker]);

    useEffect(() => {
        if (!offlineReady) return;
        notify({ message: t("pwa.offlineReady") });
        setOfflineReady(false);
    }, [offlineReady, notify, t, setOfflineReady]);
}

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Instalación de la app (navegadores Chromium). En iOS se instala desde «Compartir → Añadir a inicio». */
export function useInstallPrompt() {
    const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        const handleBeforeInstall = (event: Event) => {
            event.preventDefault();
            setPromptEvent(event as BeforeInstallPromptEvent);
        };
        const handleInstalled = () => setPromptEvent(null);
        window.addEventListener("beforeinstallprompt", handleBeforeInstall);
        window.addEventListener("appinstalled", handleInstalled);
        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
            window.removeEventListener("appinstalled", handleInstalled);
        };
    }, []);

    async function install(): Promise<void> {
        if (!promptEvent) return;
        await promptEvent.prompt();
        await promptEvent.userChoice;
        setPromptEvent(null);
    }

    return { canInstall: promptEvent !== null, install };
}
