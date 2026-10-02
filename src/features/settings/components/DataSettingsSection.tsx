import { Download } from "lucide-react";
import { theme } from "../../../shared/theme/theme";
import { useI18n } from "../../../shared/i18n/I18nContext";

interface DataSettingsSectionProps {
    resetDay: () => void;
    exportJSON: () => void;
    onImportFile: (file: File) => void;
    /** Momento de la última copia exportada (ms) o null si nunca. */
    lastBackupAt: number | null;
    /** El navegador ofrece instalar la app (Chromium). */
    canInstall: boolean;
    onInstall: () => void;
}

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () => window.matchMedia?.("(display-mode: standalone)").matches;

export function DataSettingsSection({
    resetDay,
    exportJSON,
    onImportFile,
    lastBackupAt,
    canInstall,
    onInstall,
}: DataSettingsSectionProps) {
    const { t, locale } = useI18n();
    const buttonClass = `flex-1 rounded-lg border ${theme.border} ${theme.button} px-3 py-2 text-sm transition-colors`;
    const lastBackupLabel = lastBackupAt
        ? t("data.lastBackup", { date: new Date(lastBackupAt).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }) })
        : t("data.neverBackedUp");

    return (
        <div className={`mb-6 p-4 rounded-xl ${theme.inputAlt} ${theme.border} border`}>
            <div className="mb-3">
                <div className={`text-lg font-semibold ${theme.text}`}>{t("data.title")}</div>
                <div className={`text-xs ${theme.textLight}`}>{t("data.description")}</div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
                <button type="button" onClick={resetDay} className={buttonClass}>
                    {t("data.resetDay")}
                </button>
                <button type="button" onClick={exportJSON} className={buttonClass}>
                    {t("data.exportJson")}
                </button>
                <label className={`${buttonClass} cursor-pointer text-center focus-within:ring-2 focus-within:ring-blue-500`}>
                    {t("data.importJson")}
                    <input
                        type="file"
                        accept="application/json"
                        className="sr-only"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (file) onImportFile(file);
                        }}
                    />
                </label>
            </div>
            <p className={`mt-2 text-xs ${theme.textLight}`}>{lastBackupLabel}</p>

            {!isStandalone() && (canInstall || isIos()) && (
                <div className={`mt-3 border-t ${theme.borderLight} pt-3`}>
                    <p className={`text-xs ${theme.textLight}`}>{t("data.installHint")}</p>
                    {canInstall ? (
                        <button
                            type="button"
                            onClick={onInstall}
                            className={`mt-2 inline-flex items-center gap-2 rounded-lg ${theme.buttonPrimary} px-3 py-2 text-sm font-medium transition-colors`}
                        >
                            <Download size={16} aria-hidden="true" />
                            {t("data.install")}
                        </button>
                    ) : (
                        <p className={`mt-1 text-xs ${theme.text}`}>{t("data.installIos")}</p>
                    )}
                </div>
            )}
        </div>
    );
}
