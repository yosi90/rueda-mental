import type { TranslationKey } from "../i18n/translations";

export const APP_STYLES = ["light", "dark", "aurora", "beach", "rock", "mountain"] as const;

export type AppStyle = (typeof APP_STYLES)[number];

export interface AppStyleDefinition {
    id: AppStyle;
    /** Modo base: activa la variante dark: y el color-scheme del navegador. */
    mode: "light" | "dark";
    labelKey: TranslationKey;
}

export const APP_STYLE_DEFINITIONS: Record<AppStyle, AppStyleDefinition> = {
    light: { id: "light", mode: "light", labelKey: "style.light" },
    dark: { id: "dark", mode: "dark", labelKey: "style.dark" },
    aurora: { id: "aurora", mode: "dark", labelKey: "style.aurora" },
    beach: { id: "beach", mode: "light", labelKey: "style.beach" },
    rock: { id: "rock", mode: "dark", labelKey: "style.rock" },
    mountain: { id: "mountain", mode: "light", labelKey: "style.mountain" },
};

export function isAppStyle(value: unknown): value is AppStyle {
    return typeof value === "string" && (APP_STYLES as readonly string[]).includes(value);
}

/** Aplica el estilo al documento: data-theme (claro/oscuro) y data-style (paleta y fondo). */
export function applyAppStyle(style: AppStyle): void {
    const root = document.documentElement;
    root.dataset.theme = APP_STYLE_DEFINITIONS[style].mode;
    root.dataset.style = style;
}
