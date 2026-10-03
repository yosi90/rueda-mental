import { useId } from "react";
import type { Language } from "../../../shared/i18n/translations";

/**
 * Banderas de idioma en SVG (los emojis de bandera no se dibujan en Windows: salen «ES», «GB»…).
 * Inglés = Reino Unido. Son decorativas: el nombre del idioma va siempre al lado.
 */
export function LanguageFlag({ language, className = "" }: { language: Language; className?: string }) {
    const clipId = useId();
    const common = {
        className: `inline-block h-4 w-6 shrink-0 rounded-[3px] ring-1 ring-black/15 ${className}`,
        "aria-hidden": true,
        focusable: false,
        preserveAspectRatio: "xMidYMid slice",
    } as const;

    switch (language) {
        case "es":
            return (
                <svg viewBox="0 0 3 2" {...common}>
                    <rect width="3" height="2" fill="#AA151B" />
                    <rect y="0.5" width="3" height="1" fill="#F1BF00" />
                </svg>
            );
        case "en":
            return (
                <svg viewBox="0 0 60 30" {...common}>
                    <clipPath id={`${clipId}-s`}>
                        <path d="M0,0 v30 h60 v-30 z" />
                    </clipPath>
                    <clipPath id={`${clipId}-t`}>
                        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
                    </clipPath>
                    <g clipPath={`url(#${clipId}-s)`}>
                        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
                        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
                        <path d="M0,0 L60,30 M60,0 L0,30" clipPath={`url(#${clipId}-t)`} stroke="#C8102E" strokeWidth="4" />
                        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
                        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
                    </g>
                </svg>
            );
        case "pt":
            return (
                <svg viewBox="0 0 30 20" {...common}>
                    <rect width="30" height="20" fill="#FF0000" />
                    <rect width="12" height="20" fill="#006600" />
                    <circle cx="12" cy="10" r="4.2" fill="#FFCC00" />
                    <circle cx="12" cy="10" r="3.1" fill="none" stroke="#006600" strokeWidth="0.5" />
                    <path d="M10.3 7.8 h3.4 v3.1 a1.7 1.7 0 0 1 -3.4 0 z" fill="#fff" stroke="#FF0000" strokeWidth="0.7" />
                </svg>
            );
        case "de":
            return (
                <svg viewBox="0 0 5 3" {...common}>
                    <rect width="5" height="1" fill="#000" />
                    <rect y="1" width="5" height="1" fill="#DD0000" />
                    <rect y="2" width="5" height="1" fill="#FFCE00" />
                </svg>
            );
    }
}
