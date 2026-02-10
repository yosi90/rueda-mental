import type { Dispatch, SetStateAction } from "react";
import { useI18n } from "../../../shared/i18n/I18nContext";
import type { ThemeClasses } from "../../../shared/types/theme";

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

    return (
        <div className={`mb-6 p-4 rounded-xl ${theme.inputAlt} ${theme.border} border`}>
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 pr-2">
                    <div className={`text-sm font-medium ${theme.text}`}>{t("scale.title")}</div>
                    <div className={`text-xs ${theme.textLight}`}>
                        {isScaleInverted
                            ? t("scale.enabledDesc")
                            : t("scale.disabledDesc")}
                    </div>
                </div>
                <button
                    onClick={() => setIsScaleInverted((prev) => !prev)}
                    className={`padding-esp flex-shrink-0 relative inline-flex h-8 w-14 items-center justify-start rounded-full transition-colors ${isScaleInverted ? "bg-green-500/70" : "bg-neutral-400/60"}`}
                    title={t("scale.toggleTitle")}
                >
                    <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${isScaleInverted ? "translate-x-6" : "translate-x-0"}`}
                    />
                </button>
            </div>
        </div>
    );
}
