import type { ReactNode } from "react";
import { useI18n } from "../i18n/I18nContext";

interface FloatingInfoPanelProps {
    cardClass: string;
    textMutedClass: string;
    textClass: string;
    buttonClass: string;
    buttonPrimaryClass: string;
    darkMode: boolean;
    dateStr: string;
    avg: string;
    hoverInfoContent: ReactNode;
    hasHoverInfo: boolean;
    onDateChange: (date: string) => void;
    onPrevDay: () => void;
    onNextDay: () => void;
    onToday: () => void;
    onOpenSos: () => void;
}

export function FloatingInfoPanel({
    cardClass,
    textMutedClass,
    textClass,
    buttonClass,
    buttonPrimaryClass,
    darkMode,
    dateStr,
    avg,
    hoverInfoContent,
    hasHoverInfo,
    onDateChange,
    onPrevDay,
    onNextDay,
    onToday,
    onOpenSos,
}: FloatingInfoPanelProps) {
    const { t } = useI18n();
    const sosButtonClass = darkMode
        ? "border border-red-400/40 bg-neutral-800/95 text-red-200 hover:bg-neutral-700"
        : "border border-red-300 bg-white/95 text-red-700 hover:bg-red-50";

    return (
        <div className="fixed top-4 left-4 z-40 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
            <div className="flex flex-col gap-2 w-fit">
                <div className={`rounded-xl sm:rounded-2xl ${cardClass} backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 shadow-lg min-w-40 sm:min-w-none`}>
                    <div className={`text-xs sm:text-sm ${textMutedClass}`}>
                        {hasHoverInfo ? (
                            hoverInfoContent
                        ) : (
                            <span>{t("panel.dailyAverage")}: <b className={`text-base sm:text-lg ${textClass}`}>{avg}</b></span>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onOpenSos}
                    className={`hidden sm:inline-flex self-start items-center justify-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold shadow-md transition-colors ${sosButtonClass}`}
                    title={t("panel.openEmergencyResources")}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    {t("panel.helpSos")}
                </button>
            </div>

            <div className={`rounded-xl sm:rounded-2xl ${cardClass} backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 mt-1 sm:mt-0 shadow-lg`}>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onPrevDay}
                        className={`${buttonClass} ${darkMode ? "hover:!bg-neutral-400 hover:!text-neutral-900" : ""} rounded-md px-2 py-1 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 ${darkMode ? "focus-visible:ring-neutral-100" : "focus-visible:ring-neutral-900"}`}
                        title={t("panel.prevDay")}
                    >
                        &lt;
                    </button>

                    <input
                        type="date"
                        value={dateStr}
                        onChange={(e) => onDateChange(e.target.value)}
                        className={`text-xs sm:text-sm border-0 bg-transparent p-0 cursor-pointer focus:outline-none focus:ring-2 ${darkMode ? "focus:ring-neutral-100" : "focus:ring-neutral-900"} rounded ${textClass}`}
                        style={{ fontFamily: "inherit", colorScheme: darkMode ? "dark" : "light" }}
                    />

                    <button
                        onClick={onNextDay}
                        className={`${buttonClass} ${darkMode ? "hover:!bg-neutral-400 hover:!text-neutral-900" : ""} rounded-md px-2 py-1 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 ${darkMode ? "focus-visible:ring-neutral-100" : "focus-visible:ring-neutral-900"}`}
                        title={t("panel.nextDay")}
                    >
                        &gt;
                    </button>

                    <button
                        onClick={onToday}
                        className={`${buttonPrimaryClass} rounded-md px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium transition-colors`}
                        title={t("panel.goToday")}
                    >
                        {t("common.today")}
                    </button>
                </div>
            </div>
        </div>
    );
}
