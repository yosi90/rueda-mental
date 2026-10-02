import { theme } from "../../../shared/theme/theme";
import { useI18n } from "../../../shared/i18n/I18nContext";

interface DataSettingsSectionProps {
    resetDay: () => void;
    exportJSON: () => void;
    onImportFile: (file: File) => void;
}

export function DataSettingsSection({
    resetDay,
    exportJSON,
    onImportFile,
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
                    type="button"
                    onClick={resetDay}
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

                <label className={`flex-1 rounded-lg border ${theme.border} ${theme.button} px-3 py-2 text-sm cursor-pointer text-center transition-colors focus-within:ring-2 focus-within:ring-blue-500`}>
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
        </div>
    );
}
