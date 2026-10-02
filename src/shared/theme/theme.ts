import type { ThemeClasses } from "../types/theme";

/**
 * Clases de tema con la variante `dark:` (activada por data-theme="dark" en <html>).
 * Los colores de SVG y gráficas son variables CSS definidas en index.css.
 */
export const theme: ThemeClasses = {
    bg: "bg-neutral-200 dark:bg-neutral-700",
    card: "bg-white/90 dark:bg-neutral-800/90",
    cardSolid: "bg-white dark:bg-neutral-800",
    text: "text-neutral-900 dark:text-neutral-100",
    textMuted: "text-neutral-600 dark:text-neutral-300",
    textLight: "text-neutral-600 dark:text-neutral-300",
    border: "border-neutral-300 dark:border-neutral-600",
    borderLight: "border-neutral-200 dark:border-neutral-600",
    input: "bg-white border-neutral-300 text-neutral-900 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100",
    inputAlt: "bg-neutral-50 border-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100",
    button: "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-600 dark:hover:bg-neutral-500",
    buttonPrimary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-300 dark:text-neutral-900 dark:hover:bg-neutral-200",
    subtle: "bg-neutral-100 dark:bg-neutral-700",
    focusRing: "focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100",
    overlay: "bg-black/40 dark:bg-black/60",
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
