import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useI18n } from "../i18n/I18nContext";
import { formatDateInput } from "../utils/date";

interface FloatingInfoPanelProps {
    cardClass: string;
    textMutedClass: string;
    textClass: string;
    buttonClass: string;
    buttonPrimaryClass: string;
    darkMode: boolean;
    dateStr: string;
    locale: string;
    avg: string;
    hoverInfoContent: ReactNode;
    hasHoverInfo: boolean;
    onDateChange: (date: string) => void;
    onPrevDay: () => void;
    onNextDay: () => void;
    onToday: () => void;
    onOpenSos: () => void;
    todayStr: string;
    daysWithData: ReadonlySet<string>;
}

export function FloatingInfoPanel({
    cardClass,
    textMutedClass,
    textClass,
    buttonClass,
    buttonPrimaryClass,
    darkMode,
    dateStr,
    locale,
    avg,
    hoverInfoContent,
    hasHoverInfo,
    onDateChange,
    onPrevDay,
    onNextDay,
    onToday,
    onOpenSos,
    todayStr,
    daysWithData,
}: FloatingInfoPanelProps) {
    const { t } = useI18n();
    const [calendarOpen, setCalendarOpen] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);
    const parsedDate = useMemo(() => {
        const date = new Date(`${dateStr}T00:00:00`);
        return Number.isNaN(date.getTime()) ? new Date() : date;
    }, [dateStr]);
    const [calendarMonth, setCalendarMonth] = useState<Date>(() =>
        new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1)
    );

    useEffect(() => {
        setCalendarMonth(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1));
    }, [parsedDate]);

    useEffect(() => {
        if (!calendarOpen) return;

        const handlePointerDown = (event: PointerEvent) => {
            if (!calendarRef.current) return;
            const targetNode = event.target as Node;
            if (!calendarRef.current.contains(targetNode)) {
                setCalendarOpen(false);
            }
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setCalendarOpen(false);
        };

        window.addEventListener("pointerdown", handlePointerDown);
        window.addEventListener("keydown", handleEscape);
        return () => {
            window.removeEventListener("pointerdown", handlePointerDown);
            window.removeEventListener("keydown", handleEscape);
        };
    }, [calendarOpen]);

    const firstDayOfWeek = useMemo<number>(() => (
        locale.toLowerCase().startsWith("en-us") ? 0 : 1
    ), [locale]);

    const formattedDate = useMemo(() => {
        return new Intl.DateTimeFormat(locale, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(parsedDate);
    }, [parsedDate, locale]);

    const monthLabel = useMemo(() => (
        new Intl.DateTimeFormat(locale, {
            month: "long",
            year: "numeric",
        }).format(calendarMonth)
    ), [locale, calendarMonth]);

    const weekDayLabels = useMemo(() => {
        const startSunday = new Date(2024, 0, 7);
        const labels = Array.from({ length: 7 }, (_, index) => {
            const day = new Date(startSunday);
            day.setDate(startSunday.getDate() + index);
            return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(day);
        });
        return [...labels.slice(firstDayOfWeek), ...labels.slice(0, firstDayOfWeek)];
    }, [locale, firstDayOfWeek]);

    const calendarCells = useMemo(() => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const monthStart = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const leadingSlots = (monthStart.getDay() - firstDayOfWeek + 7) % 7;
        const totalSlots = Math.ceil((leadingSlots + daysInMonth) / 7) * 7;

        return Array.from({ length: totalSlots }, (_, index) => {
            const dayNumber = index - leadingSlots + 1;
            if (dayNumber < 1 || dayNumber > daysInMonth) return null;
            const date = new Date(year, month, dayNumber);
            return {
                day: dayNumber,
                iso: formatDateInput(date),
            };
        });
    }, [calendarMonth, firstDayOfWeek]);

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

                    <div className="relative" ref={calendarRef}>
                        <button
                            type="button"
                            onClick={() => setCalendarOpen((prev) => !prev)}
                            className={`text-xs sm:text-sm border-0 bg-transparent px-1 py-0.5 rounded ${textClass} flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 ${darkMode ? "focus-visible:ring-neutral-100" : "focus-visible:ring-neutral-900"}`}
                            aria-label={t("panel.selectDate")}
                            title={t("panel.selectDate")}
                        >
                            <span>{formattedDate}</span>
                            <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </button>

                        {calendarOpen && (
                            <div className={`absolute top-full left-0 mt-2 z-50 rounded-xl border p-3 shadow-xl backdrop-blur-sm ${cardClass} min-w-[250px]`}>
                                <div className="flex items-center justify-between mb-2">
                                    <button
                                        type="button"
                                        onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                                        className={`rounded-md px-2 py-1 text-sm font-bold ${buttonClass}`}
                                        title={t("panel.prevDay")}
                                    >
                                        &lt;
                                    </button>
                                    <div className={`text-sm font-semibold capitalize ${textClass}`}>{monthLabel}</div>
                                    <button
                                        type="button"
                                        onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                                        className={`rounded-md px-2 py-1 text-sm font-bold ${buttonClass}`}
                                        title={t("panel.nextDay")}
                                    >
                                        &gt;
                                    </button>
                                </div>

                                <div className="grid grid-cols-7 gap-1 mb-1">
                                    {weekDayLabels.map((label) => (
                                        <div key={label} className={`text-[10px] text-center uppercase ${textMutedClass}`}>
                                            {label}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-1">
                                    {calendarCells.map((cell, index) => {
                                        if (!cell) {
                                            return <div key={`empty-${index}`} className="h-7" />;
                                        }

                                        const isSelected = cell.iso === dateStr;
                                        const isToday = cell.iso === todayStr;
                                        const hasData = daysWithData.has(cell.iso);
                                        const isFuture = cell.iso > todayStr;
                                        const selectedClass = isSelected ? `${buttonPrimaryClass} font-semibold` : `${buttonClass}`;
                                        const todayClass = isToday
                                            ? darkMode
                                                ? "ring-1 ring-inset ring-amber-300/90"
                                                : "ring-1 ring-inset ring-amber-500/90"
                                            : "";
                                        const hasDataClass = hasData && !isSelected
                                            ? darkMode
                                                ? "bg-emerald-500/15"
                                                : "bg-emerald-600/10"
                                            : "";
                                        const futureClass = isFuture
                                            ? darkMode
                                                ? "opacity-50 text-neutral-400 cursor-not-allowed"
                                                : "opacity-50 text-neutral-500 cursor-not-allowed"
                                            : "";

                                        return (
                                            <button
                                                key={cell.iso}
                                                type="button"
                                                disabled={isFuture}
                                                onClick={() => {
                                                    if (isFuture) return;
                                                    onDateChange(cell.iso);
                                                    setCalendarOpen(false);
                                                }}
                                                className={`relative h-7 rounded-md text-xs transition-colors ${selectedClass} ${todayClass} ${hasDataClass} ${futureClass}`}
                                            >
                                                {cell.day}
                                                {hasData && (
                                                    <span
                                                        className={`pointer-events-none absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                                                            isSelected
                                                                ? darkMode ? "bg-neutral-900" : "bg-neutral-900"
                                                                : darkMode ? "bg-emerald-300" : "bg-emerald-700"
                                                        }`}
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

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
