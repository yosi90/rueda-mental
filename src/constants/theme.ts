export interface ThemeColors {
    bg: string;
    bgAlt: string;
    text: string;
    textLight: string;
    textMuted: string;
    border: string;
    borderLight: string;
    input: string;
    inputAlt: string;
    button: string;
    buttonHover: string;
    card: string;
    cardHover: string;
}

export const LIGHT_THEME: ThemeColors = {
    bg: "bg-white",
    bgAlt: "bg-neutral-50",
    text: "text-neutral-900",
    textLight: "text-neutral-600",
    textMuted: "text-neutral-500",
    border: "border-neutral-300",
    borderLight: "border-neutral-200",
    input: "bg-white border-neutral-300 text-neutral-900",
    inputAlt: "bg-neutral-50",
    button: "bg-white hover:bg-neutral-100",
    buttonHover: "hover:bg-neutral-100",
    card: "bg-white",
    cardHover: "hover:bg-neutral-50",
};

export const DARK_THEME: ThemeColors = {
    bg: "bg-neutral-900",
    bgAlt: "bg-neutral-800",
    text: "text-neutral-100",
    textLight: "text-neutral-300",
    textMuted: "text-neutral-400",
    border: "border-neutral-700",
    borderLight: "border-neutral-800",
    input: "bg-neutral-800 border-neutral-700 text-neutral-100",
    inputAlt: "bg-neutral-800",
    button: "bg-neutral-800 hover:bg-neutral-700",
    buttonHover: "hover:bg-neutral-700",
    card: "bg-neutral-800",
    cardHover: "hover:bg-neutral-750",
};

export function getTheme(darkMode: boolean): ThemeColors {
    return darkMode ? DARK_THEME : LIGHT_THEME;
}