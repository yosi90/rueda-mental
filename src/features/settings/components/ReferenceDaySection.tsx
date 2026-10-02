import { useId } from "react";
import { ToggleSwitch } from "../../../shared/components/ToggleSwitch";
import { useI18n } from "../../../shared/i18n/I18nContext";
import { theme } from "../../../shared/theme/theme";

interface ReferenceDaySectionProps {
    showReference: boolean;
    setShowReference: (show: boolean) => void;
}

export function ReferenceDaySection({ showReference, setShowReference }: ReferenceDaySectionProps) {
    const { t } = useI18n();
    const descId = useId();

    return (
        <div className={`mb-6 p-4 rounded-xl ${theme.inputAlt} ${theme.border} border`}>
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 pr-2">
                    <div className={`text-sm font-medium ${theme.text}`}>{t("reference.title")}</div>
                    <div id={descId} className={`text-xs ${theme.textLight}`}>{t("reference.description")}</div>
                </div>
                <ToggleSwitch
                    checked={showReference}
                    onChange={setShowReference}
                    label={t("reference.title")}
                    describedBy={descId}
                />
            </div>
        </div>
    );
}
