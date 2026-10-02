import { useId, type Dispatch, type SetStateAction } from "react";
import { useI18n } from "../../../shared/i18n/I18nContext";
import type { ThemeClasses } from "../../../shared/types/theme";
import { ToggleSwitch } from "../../../shared/components/ToggleSwitch";

interface ScaleDirectionSectionProps {
    theme: Pick<ThemeClasses, "inputAlt" | "border" | "text" | "textLight">;
    isScaleInverted: boolean;
    setIsScaleInverted: Dispatch<SetStateAction<boolean>>;
}

export function ScaleDirectionSection({
    theme,
    isScaleInverted,
    setIsScaleInverted,
}: ScaleDirectionSectionProps) {
    const { t } = useI18n();
    const descId = useId();

    return (
        <div className={`mb-6 p-4 rounded-xl ${theme.inputAlt} ${theme.border} border`}>
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 pr-2">
                    <div className={`text-sm font-medium ${theme.text}`}>{t("scale.title")}</div>
                    <div id={descId} className={`text-xs ${theme.textLight}`}>
                        {isScaleInverted
                            ? t("scale.enabledDesc")
                            : t("scale.disabledDesc")}
                    </div>
                </div>
                <ToggleSwitch
                    checked={isScaleInverted}
                    onChange={setIsScaleInverted}
                    label={t("scale.title")}
                    describedBy={descId}
                    title={t("scale.toggleTitle")}
                />
            </div>
        </div>
    );
}
