import { useI18n } from "../../../shared/i18n/I18nContext";
import { theme } from "../../../shared/theme/theme";
import { APP_STYLE_DEFINITIONS, APP_STYLES, type AppStyle } from "../../../shared/theme/styles";

interface ThemeSectionProps {
    style: AppStyle;
    setStyle: (style: AppStyle) => void;
}

/** Selector de estilo visual. Cada tarjeta es una vista previa real (lleva su propio data-style). */
export function ThemeSection({ style, setStyle }: ThemeSectionProps) {
    const { t } = useI18n();

    return (
        <div className={`mb-6 p-4 rounded-xl ${theme.inputAlt} ${theme.border} border`}>
            <div className={`text-sm font-medium ${theme.text}`}>{t("style.title")}</div>
            <div className={`text-xs ${theme.textLight} mt-1`}>{t("style.description")}</div>

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2" role="group" aria-label={t("style.title")}>
                {APP_STYLES.map((id) => {
                    const definition = APP_STYLE_DEFINITIONS[id];
                    const active = id === style;
                    return (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setStyle(id)}
                            aria-pressed={active}
                            aria-label={t(definition.labelKey)}
                            data-style={id}
                            data-theme={definition.mode}
                            className={`app-backdrop relative overflow-hidden rounded-xl border-2 p-2 text-left transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 motion-safe:hover:-translate-y-0.5 ${
                                active ? "border-accent" : "border-line"
                            }`}
                        >
                            <span className="flex h-16 flex-col justify-between rounded-lg bg-surface/85 p-2 text-fg shadow-sm" aria-hidden="true">
                                <span className="text-lg leading-none" style={{ fontFamily: "var(--font-display, system-ui, sans-serif)" }}>Aa</span>
                                <span className="flex items-center gap-1" aria-hidden="true">
                                    <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                                    <span className="h-2.5 w-6 rounded-full bg-primary" />
                                    <span className="h-2.5 w-4 rounded-full bg-line" />
                                </span>
                            </span>
                            <span className="mt-1.5 flex items-center justify-between gap-1 rounded-md bg-surface/85 px-1.5 py-0.5 text-xs font-semibold text-fg">
                                {t(definition.labelKey)}
                                {active && <span aria-hidden="true">✓</span>}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
