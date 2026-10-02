import { useI18n } from "../../../shared/i18n/I18nContext";
import { theme } from "../../../shared/theme/theme";

interface TutorialSectionProps {
    onRestartTutorial: () => void;
}

export function TutorialSection({ onRestartTutorial }: TutorialSectionProps) {
    const { t } = useI18n();

    return (
        <div className={`mb-6 p-4 rounded-xl ${theme.inputAlt} ${theme.border} border`}>
            <div className="flex items-center justify-between">
                <div>
                    <div className={`text-sm font-medium ${theme.text}`}>{t("tutorial.section.title")}</div>
                    <div className={`text-xs ${theme.textLight}`}>
                        {t("tutorial.section.description")}
                    </div>
                </div>
                <button
                    onClick={onRestartTutorial}
                    className={`${theme.buttonPrimary} rounded-md px-3 py-2 text-sm font-semibold transition-colors`}
                >
                    {t("tutorial.section.restart")}
                </button>
            </div>
        </div>
    );
}
