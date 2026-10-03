import { useI18n } from "../../../shared/i18n/I18nContext";
import { LanguageFlag } from "./LanguageFlag";
import { theme } from "../../../shared/theme/theme";

export function LanguageSection() {
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
                                    ? "border-accent bg-accent-soft text-fg"
                                    : `${theme.border} ${theme.text} hover:bg-subtle`
                            }`}
                            title={option.name}
                            aria-pressed={isActive}
                            lang={option.code}
                        >
                            <LanguageFlag language={option.code} className="mr-2 align-[-2px]" />
                            {option.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
