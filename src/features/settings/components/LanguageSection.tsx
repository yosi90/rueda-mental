import { useI18n } from "../../../shared/i18n/I18nContext";
import type { ThemeClasses } from "../../../shared/types/theme";

interface LanguageSectionProps {
    theme: Pick<ThemeClasses, "inputAlt" | "border" | "text" | "textLight">;
}

export function LanguageSection({ theme }: LanguageSectionProps) {
    const { language, setLanguage, languages, t } = useI18n();

    return (
        <div className={`mb-6 p-4 rounded-xl ${theme.inputAlt} ${theme.border} border`}>
            <div className={`text-sm font-medium ${theme.text}`}>{t("language.title")}</div>
            <div className={`text-xs ${theme.textLight} mt-1`}>
                {t("language.description")}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
                {languages.map((option) => {
                    const isActive = option.code === language;
                    return (
                        <button
                            key={option.code}
                            type="button"
                            onClick={() => setLanguage(option.code)}
                            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                isActive
                                    ? "border-blue-500 bg-blue-100 text-blue-900"
                                    : `${theme.border} ${theme.text} hover:bg-neutral-100/60 dark:hover:bg-neutral-700/60`
                            }`}
                            title={option.name}
                        >
                            <span className="mr-2" aria-hidden="true">{option.flag}</span>
                            {option.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
