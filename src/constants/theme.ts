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
    buttonPrimary: string;
    card: string;
    cardHover: string;
    overlay: string;
}

export const LIGHT_THEME: ThemeColors = {
    bg: "bg-neutral-300",
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
    buttonPrimary: "bg-neutral-100 text-black hover:bg-neutral-200",
    card: "bg-white/90",
    cardHover: "hover:bg-neutral-50",
    overlay: "bg-black/40",
};

export const DARK_THEME: ThemeColors = {
    bg: "bg-neutral-600",
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
    buttonPrimary: "bg-neutral-400 text-neutral-900 hover:bg-neutral-200",
    card: "bg-neutral-800/90",
    cardHover: "hover:bg-neutral-750",
    overlay: "bg-black/60",
};

export function getTheme(darkMode: boolean): ThemeColors {
    return darkMode ? DARK_THEME : LIGHT_THEME;
}