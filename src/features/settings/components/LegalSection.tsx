import { useI18n } from "../../../shared/i18n/I18nContext";
import type { ThemeClasses } from "../../../shared/types/theme";

interface LegalSectionProps {
    theme: Pick<ThemeClasses, "inputAlt" | "border" | "text" | "textLight">;
}

export function LegalSection({ theme }: LegalSectionProps) {
    const { t } = useI18n();

    return (
        <div className={`mb-2 p-4 rounded-xl ${theme.inputAlt} ${theme.border} border`}>
            <div className={`text-sm font-medium ${theme.text}`}>{t("legal.title")}</div>
            <p className={`text-xs ${theme.textLight} mt-2 leading-relaxed`}>
                {t("legal.p1")}
            </p>
            <p className={`text-xs ${theme.textLight} mt-2 leading-relaxed`}>
                {t("legal.p2")}
            </p>
            <p className={`text-xs ${theme.textLight} mt-2 leading-relaxed`}>
                {t("legal.p3")}
            </p>
        </div>
    );
}
