import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { LifeBuoy } from "lucide-react";
import { theme } from "../../../shared/theme/theme";
import { useI18n } from "../../../shared/i18n/I18nContext";
import { useDialogA11y } from "../../../shared/hooks/useDialogA11y";
import { CloseIcon } from "../../../shared/components/CloseIcon";

export interface SettingsTab {
    id: string;
    label: string;
    Icon: LucideIcon;
    content: ReactNode;
}

interface SettingsDrawerProps {
    drawerOpen: boolean;
    onClose: () => void;
    onOpenSOS: () => void;
    /** Pestañas de configuración (la primera es la inicial; se recuerda la última abierta). */
    tabs: SettingsTab[];
}

export function SettingsDrawer({ drawerOpen, onClose, onOpenSOS, tabs }: SettingsDrawerProps) {
    const { t } = useI18n();
    const drawerRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const idPrefix = useId();
    const titleId = `${idPrefix}-title`;
    const [activeId, setActiveId] = useState(tabs[0]?.id);
    const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
    useDialogA11y(drawerOpen, onClose, drawerRef);

    // Patrón de pestañas: flechas, Inicio y Fin mueven el foco y activan la pestaña
    function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
        const last = tabs.length - 1;
        const next = event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
            : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
            : event.key === "Home" ? 0
            : event.key === "End" ? last
            : null;
        if (next === null) return;
        event.preventDefault();
        setActiveId(tabs[next].id);
        tabRefs.current[next]?.focus();
    }

    return (
        <>
            {drawerOpen && (
                <div
                    className={`fixed inset-0 ${theme.overlay} z-40 transition-opacity`}
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Cerrado: inert (fuera del orden de tabulación y de los lectores de pantalla) e invisible al terminar la animación */}
            <div
                ref={drawerRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                inert={!drawerOpen}
                className={`fixed top-0 right-0 h-full w-full max-w-lg ${theme.cardSolid} shadow-2xl z-50 transform transition-[transform,visibility] duration-300 ease-in-out motion-reduce:transition-none flex flex-col outline-none ${drawerOpen ? "visible" : "invisible"}`}
                style={{
                    transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
                }}
            >
                <div className={`border-b ${theme.borderLight} px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6`}>
                    <div className="flex items-center justify-between gap-3">
                        <h2 id={titleId} className={`text-2xl font-bold ${theme.text}`}>{t("settings.title")}</h2>
                        <div className="flex items-center gap-2">
                            {/* En móvil el botón SOS del panel no se muestra: acceso rápido aquí */}
                            <button
                                type="button"
                                onClick={onOpenSOS}
                                className="sm:hidden inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-3 min-h-9 text-sm font-semibold text-red-700 hover:bg-red-100 dark:border-red-400/40 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/60 transition-colors"
                                title={t("settings.quickSos.desc")}
                            >
                                <LifeBuoy size={16} aria-hidden="true" />
                                {t("settings.quickSos.button")}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className={`rounded-full p-2 ${theme.buttonPrimary} transition-colors`}
                                title={t("common.close")}
                                aria-label={t("common.close")}
                            >
                                <CloseIcon />
                            </button>
                        </div>
                    </div>

                    <div role="tablist" aria-label={t("settings.title")} className="mt-4 -mb-px flex gap-1 overflow-x-auto">
                        {tabs.map(({ id, label, Icon }, index) => {
                            const selected = id === active?.id;
                            return (
                                <button
                                    key={id}
                                    ref={(el) => { tabRefs.current[index] = el; }}
                                    type="button"
                                    role="tab"
                                    id={`${idPrefix}-tab-${id}`}
                                    aria-selected={selected}
                                    aria-controls={`${idPrefix}-panel-${id}`}
                                    tabIndex={selected ? 0 : -1}
                                    onClick={() => setActiveId(id)}
                                    onKeyDown={(e) => handleTabKeyDown(e, index)}
                                    className={`flex flex-1 min-w-fit flex-col items-center gap-1 border-b-2 px-2 pb-2 pt-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent sm:flex-row sm:justify-center sm:text-sm ${
                                        selected ? "border-accent text-fg" : `border-transparent ${theme.textMuted} hover:text-fg`
                                    }`}
                                >
                                    <Icon size={18} aria-hidden="true" />
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {active && (
                    <div
                        key={active.id}
                        role="tabpanel"
                        id={`${idPrefix}-panel-${active.id}`}
                        aria-labelledby={`${idPrefix}-tab-${active.id}`}
                        className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
                    >
                        {active.content}
                    </div>
                )}
            </div>
        </>
    );
}
