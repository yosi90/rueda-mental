import type { ThemeClasses } from "../types/theme";

/**
 * Clases de tema basadas en los tokens de index.css (--ui-*), que cada tema/estilo redefine.
 * Los colores de SVG y gráficas también son variables CSS.
 */
export const theme: ThemeClasses = {
    bg: "bg-page",
    card: "bg-surface/90",
    cardSolid: "bg-surface",
    text: "text-fg",
    textMuted: "text-fg-muted",
    textLight: "text-fg-muted",
    border: "border-line",
    borderLight: "border-line-soft",
    input: "bg-field border-line text-fg",
    inputAlt: "bg-surface-alt border-line-soft text-fg",
    button: "bg-control hover:bg-control-hover",
    buttonPrimary: "bg-primary text-primary-fg hover:bg-primary-hover",
    subtle: "bg-subtle",
    focusRing: "focus:outline-none focus:ring-2 focus:ring-fg",
    overlay: "bg-overlay",
    svgBg: "var(--wheel-bg)",
    svgGrid: "var(--wheel-grid)",
    svgText: "var(--wheel-text)",
    svgCenter: "var(--wheel-center)",
    svgCenterBorder: "var(--wheel-center-border)",
    chartGrid: "var(--chart-grid)",
    chartText: "var(--chart-text)",
};

export const chartTooltipStyle = {
    backgroundColor: "var(--chart-tooltip-bg)",
    border: "1px solid var(--chart-tooltip-border)",
    borderRadius: "8px",
    color: "var(--chart-tooltip-text)",
} as const;
