import type { TranslationKey } from "../i18n/translations";

export const APP_STYLES = ["light", "dark", "aurora", "beach", "rock", "mountain"] as const;

export type AppStyle = (typeof APP_STYLES)[number];

export interface AppStyleDefinition {
    id: AppStyle;
    /** Modo base: activa la variante dark: y el color-scheme del navegador. */
    mode: "light" | "dark";
    labelKey: TranslationKey;
    /** Tiene fondo con imagen (si no, solo el fondo CSS). */
    hasPhoto: boolean;
}

export const APP_STYLE_DEFINITIONS: Record<AppStyle, AppStyleDefinition> = {
    light: { id: "light", mode: "light", labelKey: "style.light", hasPhoto: false },
    dark: { id: "dark", mode: "dark", labelKey: "style.dark", hasPhoto: false },
    aurora: { id: "aurora", mode: "dark", labelKey: "style.aurora", hasPhoto: true },
    beach: { id: "beach", mode: "light", labelKey: "style.beach", hasPhoto: true },
    rock: { id: "rock", mode: "dark", labelKey: "style.rock", hasPhoto: true },
    mountain: { id: "mountain", mode: "light", labelKey: "style.mountain", hasPhoto: true },
};

export function isAppStyle(value: unknown): value is AppStyle {
    return typeof value === "string" && (APP_STYLES as readonly string[]).includes(value);
}

/**
 * Aplica el estilo al documento: data-theme (claro/oscuro), data-style (paleta y fondo)
 * y data-bg-image (fondo con imagen o solo CSS).
 */
export function applyAppStyle(style: AppStyle, backgroundImage: boolean): void {
    const root = document.documentElement;
    root.dataset.theme = APP_STYLE_DEFINITIONS[style].mode;
    root.dataset.style = style;
    root.dataset.bgImage = backgroundImage ? "on" : "off";
}
