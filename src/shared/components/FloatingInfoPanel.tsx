import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useI18n } from "../i18n/I18nContext";
import { theme } from "../theme/theme";
import { formatDateInput } from "../utils/date";

interface FloatingInfoPanelProps {
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
    /** Día anterior con puntuaciones que se puede copiar al día actual (si este está vacío). */
    copySource: { label: string; onCopy: () => void } | null;
    /** Fecha (ya formateada) dibujada como contorno discontinuo en la rueda, si la hay. */
    referenceLabel: string | null;
}

export function FloatingInfoPanel({
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
    copySource,
    referenceLabel,
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

    const dayLabelFormatter = useMemo(() => (
        new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    ), [locale]);

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
                label: dayLabelFormatter.format(date),
            };
        });
    }, [calendarMonth, firstDayOfWeek, dayLabelFormatter]);

    const sosButtonClass = "border border-red-300 bg-white/95 text-red-700 hover:bg-red-50 dark:border-red-400/40 dark:bg-neutral-800/95 dark:text-red-200 dark:hover:bg-neutral-700";

    return (
        <div className="fixed z-40 inset-x-0 top-0 flex flex-col gap-2 sm:inset-x-auto sm:top-4 sm:left-4 sm:flex-row sm:items-start sm:gap-3">
            {/* Media del día y SOS: solo desde sm (en móvil, SOS está en Configuración) */}
            <div className="hidden sm:flex flex-col gap-2 w-fit">
                <div className={`rounded-xl sm:rounded-2xl ${theme.card} backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 shadow-lg min-w-40 sm:min-w-none`}>
                    <div className={`text-xs sm:text-sm ${theme.textMuted}`}>
                        {hasHoverInfo ? (
                            hoverInfoContent
                        ) : (
                            <span>{t("panel.dailyAverage")}: <b className={`text-base sm:text-lg ${theme.text}`}>{avg}</b></span>
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

            <div className="flex flex-col gap-2">
            {/* En móvil, barra superior a todo el ancho; desde sm, tarjeta flotante */}
            <div className={`border-b ${theme.borderLight} bg-white dark:bg-neutral-800 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:rounded-2xl sm:border-0 sm:bg-white/90 sm:dark:bg-neutral-800/90 sm:backdrop-blur-sm sm:px-4 sm:py-3 sm:shadow-lg`}>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onPrevDay}
                        className={`${theme.button} dark:hover:!bg-neutral-400 dark:hover:!text-neutral-900 inline-flex items-center justify-center min-h-9 min-w-9 sm:min-h-0 sm:min-w-0 rounded-md px-2 py-1 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100`}
                        title={`${t("panel.prevDay")} (←)`}
                        aria-keyshortcuts="ArrowLeft"
                        aria-label={t("panel.prevDay")}
                    >
                        <span aria-hidden="true">&lt;</span>
                    </button>

                    <div className="relative flex flex-1 justify-center sm:flex-none" ref={calendarRef}>
                        <button
                            type="button"
                            onClick={() => setCalendarOpen((prev) => !prev)}
                            className={`text-sm min-h-9 border-0 bg-transparent px-2 py-0.5 rounded ${theme.text} flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100`}
                            aria-label={`${t("panel.selectDate")}: ${formattedDate}`}
                            aria-haspopup="dialog"
                            aria-expanded={calendarOpen}
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
                            <div
                                role="dialog"
                                aria-label={monthLabel}
                                className={`absolute top-full left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-2 z-50 rounded-xl border p-3 shadow-xl backdrop-blur-sm ${theme.card} min-w-[250px]`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <button
                                        type="button"
                                        onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                                        className={`rounded-md min-h-8 min-w-8 px-2 text-sm font-bold ${theme.button}`}
                                        title={t("panel.prevMonth")}
                                        aria-label={t("panel.prevMonth")}
                                    >
                                        <span aria-hidden="true">&lt;</span>
                                    </button>
                                    <div className={`text-sm font-semibold capitalize ${theme.text}`} aria-live="polite">{monthLabel}</div>
                                    <button
                                        type="button"
                                        onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                                        className={`rounded-md min-h-8 min-w-8 px-2 text-sm font-bold ${theme.button}`}
                                        title={t("panel.nextMonth")}
                                        aria-label={t("panel.nextMonth")}
                                    >
                                        <span aria-hidden="true">&gt;</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-7 gap-1 mb-1" aria-hidden="true">
                                    {weekDayLabels.map((label) => (
                                        <div key={label} className={`text-xs text-center uppercase ${theme.textMuted}`}>
                                            {label}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-1">
                                    {calendarCells.map((cell, index) => {
                                        if (!cell) {
                                            return <div key={`empty-${index}`} className="h-8" />;
                                        }

                                        const isSelected = cell.iso === dateStr;
                                        const isToday = cell.iso === todayStr;
                                        const hasData = daysWithData.has(cell.iso);
                                        const isFuture = cell.iso > todayStr;
                                        const selectedClass = isSelected ? `${theme.buttonPrimary} font-semibold` : `${theme.button}`;
                                        const todayClass = isToday ? "ring-1 ring-inset ring-amber-500/90 dark:ring-amber-300/90" : "";
                                        const hasDataClass = hasData && !isSelected ? "!bg-emerald-600/10 dark:!bg-emerald-500/15" : "";
                                        const futureClass = isFuture ? "opacity-50 cursor-not-allowed" : "";

                                        return (
                                            <button
                                                key={cell.iso}
                                                type="button"
                                                disabled={isFuture}
                                                aria-label={cell.label}
                                                aria-pressed={isSelected}
                                                aria-current={isToday ? "date" : undefined}
                                                onClick={() => {
                                                    if (isFuture) return;
                                                    onDateChange(cell.iso);
                                                    setCalendarOpen(false);
                                                }}
                                                className={`relative h-8 rounded-md text-xs transition-colors ${selectedClass} ${todayClass} ${hasDataClass} ${futureClass}`}
                                            >
                                                {cell.day}
                                                {hasData && (
                                                    <span
                                                        className={`pointer-events-none absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                                                            isSelected
                                                                ? "bg-neutral-900"
                                                                : "bg-emerald-700 dark:bg-emerald-300"
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
                        type="button"
                        onClick={onNextDay}
                        className={`${theme.button} dark:hover:!bg-neutral-400 dark:hover:!text-neutral-900 inline-flex items-center justify-center min-h-9 min-w-9 sm:min-h-0 sm:min-w-0 rounded-md px-2 py-1 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100`}
                        title={`${t("panel.nextDay")} (→)`}
                        aria-keyshortcuts="ArrowRight"
                        aria-label={t("panel.nextDay")}
                    >
                        <span aria-hidden="true">&gt;</span>
                    </button>

                    <button
                        type="button"
                        onClick={onToday}
                        className={`${theme.buttonPrimary} min-h-9 sm:min-h-0 rounded-md px-3 py-1 text-sm font-medium transition-colors`}
                        title={`${t("panel.goToday")} (T)`}
                        aria-keyshortcuts="T"
                    >
                        {t("common.today")}
                    </button>
                </div>
            </div>

            {referenceLabel && (
                <div className={`mx-3 sm:mx-0 self-start inline-flex items-center gap-2 rounded-xl ${theme.card} backdrop-blur-sm px-3 py-1 text-xs shadow-md ${theme.textMuted}`}>
                    <svg width="18" height="4" aria-hidden="true" className="shrink-0">
                        <line x1="1" y1="2" x2="17" y2="2" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
                    </svg>
                    {t("reference.legend", { date: referenceLabel })}
                </div>
            )}

            {copySource && (
                <button
                    type="button"
                    onClick={copySource.onCopy}
                    title={t("panel.copyFromTitle", { date: copySource.label })}
                    className={`mx-3 sm:mx-0 self-start inline-flex items-center gap-1.5 rounded-xl ${theme.card} backdrop-blur-sm min-h-8 px-3 text-xs font-medium shadow-md transition-colors ${theme.text} hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
                >
                    <span aria-hidden="true">↺</span>
                    {t("panel.copyFrom", { date: copySource.label })}
                </button>
            )}
            </div>
        </div>
    );
}
