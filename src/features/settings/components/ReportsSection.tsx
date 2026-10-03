import { FileSpreadsheet, FileText } from "lucide-react";
import { theme } from "../../../shared/theme/theme";
import { useI18n } from "../../../shared/i18n/I18nContext";

interface ReportsSectionProps {
    onOpenReport: () => void;
    onExportCsv: () => void;
}

export function ReportsSection({ onOpenReport, onExportCsv }: ReportsSectionProps) {
    const { t } = useI18n();
    const buttonClass = `flex-1 inline-flex items-center justify-center gap-2 rounded-lg border ${theme.border} ${theme.button} px-3 py-2 text-sm transition-colors`;

    return (
        <div className={`mb-6 p-4 rounded-xl ${theme.inputAlt} ${theme.border} border`}>
            <div className="mb-3">
                <div className={`text-lg font-semibold ${theme.text}`}>{t("report.sectionTitle")}</div>
                <div className={`text-xs ${theme.textLight}`}>{t("report.sectionHint")}</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <button type="button" onClick={onOpenReport} className={buttonClass}>
                    <FileText size={16} aria-hidden="true" />
                    {t("report.open")}
                </button>
                <button type="button" onClick={onExportCsv} className={buttonClass}>
                    <FileSpreadsheet size={16} aria-hidden="true" />
                    {t("report.exportCsv")}
                </button>
            </div>
        </div>
    );
}
