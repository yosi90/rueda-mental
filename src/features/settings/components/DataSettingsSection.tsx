import type { ChangeEvent } from "react";
import { useI18n } from "../../../shared/i18n/I18nContext";
import type { ThemeClasses } from "../../../shared/types/theme";

interface DataSettingsSectionProps {
    theme: Pick<ThemeClasses, "inputAlt" | "border" | "text" | "textLight" | "button">;
    resetDay: () => void;
    exportJSON: () => void;
    importJSON: (evt: ChangeEvent<HTMLInputElement>) => void;
}

export function DataSettingsSection({
    theme,
    resetDay,
    exportJSON,
    importJSON,
}: DataSettingsSectionProps) {
    const { t } = useI18n();

    return (
        <div className={`mb-6 p-4 rounded-xl ${theme.inputAlt} ${theme.border} border`}>
            <div className="flex items-center justify-between mb-3">
                <div>
                    <div className={`text-lg font-semibold ${theme.text}`}>{t("data.title")}</div>
                    <div className={`text-xs ${theme.textLight}`}>
                        {t("data.description")}
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
                <button
                    onClick={() => {
                        if (confirm(t("data.confirmReset"))) {
                            resetDay();
                        }
                    }}
                    className={`flex-1 rounded-lg border ${theme.border} ${theme.button} px-3 py-2 text-sm transition-colors`}
                >
                    {t("data.resetDay")}
                </button>

                <button
                    onClick={exportJSON}
                    className={`flex-1 rounded-lg border ${theme.border} ${theme.button} px-3 py-2 text-sm transition-colors`}
                >
                    {t("data.exportJson")}
                </button>

                <label className={`flex-1 rounded-lg border ${theme.border} ${theme.button} px-3 py-2 text-sm cursor-pointer text-center transition-colors`}>
                    {t("data.importJson")}
                    <input type="file" accept="application/json" className="hidden" onChange={importJSON} />
                </label>
            </div>
        </div>
    );
}
