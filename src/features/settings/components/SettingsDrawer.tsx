import { Children, Fragment, useId, useRef, type ReactNode } from "react";
import { theme } from "../../../shared/theme/theme";
import { useI18n } from "../../../shared/i18n/I18nContext";
import { useDialogA11y } from "../../../shared/hooks/useDialogA11y";
import { CloseIcon } from "../../../shared/components/CloseIcon";

interface SettingsDrawerProps {
    drawerOpen: boolean;
    onClose: () => void;
    onOpenSOS: () => void;
    /** Secciones de configuración; se muestran separadas por una línea. */
    children: ReactNode;
}

export function SettingsDrawer({ drawerOpen, onClose, onOpenSOS, children }: SettingsDrawerProps) {
    const { t } = useI18n();
    const drawerRef = useRef<HTMLDivElement>(null);
    const titleId = useId();
    useDialogA11y(drawerOpen, onClose, drawerRef);

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
                className={`fixed top-0 right-0 h-full w-full max-w-lg ${theme.cardSolid} shadow-2xl z-50 transform transition-[transform,visibility] duration-300 ease-in-out motion-reduce:transition-none overflow-y-auto outline-none ${drawerOpen ? "visible" : "invisible"}`}
                style={{
                    transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
                }}
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 id={titleId} className={`text-2xl font-bold ${theme.text}`}>{t("settings.title")}</h2>
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

                    {/* En móvil el botón SOS del panel no se muestra: acceso rápido aquí */}
                    <div className={`mb-6 p-4 rounded-xl border ${theme.border} sm:hidden`}>
                        <div className={`text-sm font-semibold ${theme.text}`}>{t("settings.quickSos.title")}</div>
                        <p className={`text-xs mt-1 ${theme.textLight}`}>
                            {t("settings.quickSos.desc")}
                        </p>
                        <button
                            type="button"
                            onClick={onOpenSOS}
                            className="mt-3 w-full rounded-lg border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-400/40 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/60 px-3 py-2 text-sm font-semibold transition-colors"
                        >
                            {t("settings.quickSos.button")}
                        </button>
                    </div>

                    {Children.toArray(children).map((section, index) => (
                        <Fragment key={index}>
                            <hr className={`my-6 ${theme.borderLight} border-t`} />
                            {section}
                        </Fragment>
                    ))}
                </div>
            </div>
        </>
    );
}
