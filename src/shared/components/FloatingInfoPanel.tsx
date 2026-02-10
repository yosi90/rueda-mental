import type { ReactNode } from "react";

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
}: FloatingInfoPanelProps) {
    return (
        <div className="fixed top-4 left-4 z-40 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className={`rounded-xl sm:rounded-2xl ${cardClass} backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 shadow-lg w-fit min-w-40 sm:min-w-none`}>
                <div className={`text-xs sm:text-sm ${textMutedClass}`}>
                    {hasHoverInfo ? (
                        hoverInfoContent
                    ) : (
                        <span>Media del día: <b className={`text-base sm:text-lg ${textClass}`}>{avg}</b></span>
                    )}
                </div>
            </div>

            <div className={`rounded-xl sm:rounded-2xl ${cardClass} backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 mt-1 sm:mt-0 shadow-lg`}>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onPrevDay}
                        className={`${buttonClass} ${darkMode ? "hover:!bg-neutral-400 hover:!text-neutral-900" : ""} rounded-md px-2 py-1 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 ${darkMode ? "focus-visible:ring-neutral-100" : "focus-visible:ring-neutral-900"}`}
                        title="Día anterior"
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
                        title="Día siguiente"
                    >
                        &gt;
                    </button>

                    <button
                        onClick={onToday}
                        className={`${buttonPrimaryClass} rounded-md px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium transition-colors`}
                        title="Ir a hoy"
                    >
                        Hoy
                    </button>
                </div>
            </div>
        </div>
    );
}
