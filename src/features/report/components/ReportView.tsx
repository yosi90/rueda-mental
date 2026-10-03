import { useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import { useI18n } from "../../../shared/i18n/I18nContext";
import type { TranslationKey } from "../../../shared/i18n/translations";
import { useDialogA11y } from "../../../shared/hooks/useDialogA11y";
import { CloseIcon } from "../../../shared/components/CloseIcon";
import { theme } from "../../../shared/theme/theme";
import { parseDateInput } from "../../../shared/utils/date";
import { MOODS, PROMPTS } from "../../summary/summaryDefinitions";
import { buildReport, type ReportPeriod, type ReportSource } from "../report";

interface ReportViewProps {
    source: ReportSource;
    today: string;
    ringCount: number;
    onClose: () => void;
}

const PERIODS: ReadonlyArray<{ value: ReportPeriod; labelKey: TranslationKey }> = [
    { value: 7, labelKey: "report.period.7" },
    { value: 30, labelKey: "report.period.30" },
    { value: 90, labelKey: "report.period.90" },
    { value: "all", labelKey: "report.period.all" },
];

/** Por debajo de esta diferencia la tendencia se considera estable. */
const STABLE_TREND = 0.5;

/**
 * Informe imprimible (o «Guardar como PDF» desde el diálogo de impresión).
 * La hoja usa colores fijos claros para que se imprima igual con cualquier estilo.
 */
export function ReportView({ source, today, ringCount, onClose }: ReportViewProps) {
    const { t, locale } = useI18n();
    const dialogRef = useRef<HTMLDivElement>(null);
    const titleId = useId();
    const [period, setPeriod] = useState<ReportPeriod>(30);
    const [includeNotes, setIncludeNotes] = useState(false);
    useDialogA11y(true, onClose, dialogRef);

    const report = useMemo(() => buildReport(source, period, today), [source, period, today]);
    const sectorById = new Map(source.sectors.map((s) => [s.id, s]));
    const fmt = (value: number | null, digits = 1) => (value === null ? "–" : value.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }));
    const longDate = (date: string) => parseDateInput(date).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
    const shortDate = (date: string) => parseDateInput(date).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
    const moodLabel = (value: number | null | undefined) => {
        if (value === null || value === undefined) return null;
        return t(MOODS[Math.min(4, Math.max(0, Math.round(value) - 1))].labelKey);
    };
    const totalMoods = report.moodCounts.reduce((a, b) => a + b, 0);
    const maxMoodCount = Math.max(1, ...report.moodCounts);
    const notesDays = report.days.filter((d) => d.summary || Object.keys(d.comments).length > 0);

    return createPortal(
        <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={`print-report fixed inset-0 z-[70] overflow-y-auto ${theme.overlay} outline-none`}
        >
            {/* Barra de opciones (no se imprime) */}
            <div className={`no-print sticky top-0 z-10 border-b ${theme.borderLight} ${theme.cardSolid} ${theme.text} px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6`}>
                <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2">
                    <h2 className="mr-auto text-lg font-bold">{t("report.toolbarTitle")}</h2>
                    <div role="group" aria-label={t("report.periodLabel")} className={`inline-flex rounded-lg p-1 ${theme.subtle}`}>
                        {PERIODS.map(({ value, labelKey }) => (
                            <button
                                key={value}
                                type="button"
                                aria-pressed={period === value}
                                onClick={() => setPeriod(value)}
                                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                                    period === value ? "bg-surface text-fg shadow-sm" : `${theme.textMuted} hover:text-fg`
                                }`}
                            >
                                {t(labelKey)}
                            </button>
                        ))}
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={includeNotes} onChange={(e) => setIncludeNotes(e.target.checked)} className="h-4 w-4" />
                        {t("report.includeNotes")}
                    </label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
                        >
                            <Printer size={16} aria-hidden="true" />
                            {t("report.print")}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className={`rounded-full p-2 ${theme.buttonPrimary} transition-colors`}
                            title={t("common.close")}
                            aria-label={t("common.close")}
                        >
                            <CloseIcon />
                        </button>
                    </div>
                </div>
            </div>

            {/* Hoja */}
            <article className="report-paper mx-auto my-4 max-w-[210mm] bg-white px-5 py-6 text-[13px] leading-snug text-neutral-900 shadow-xl sm:my-8 sm:rounded sm:px-10 sm:py-10">
                <header className="border-b-2 border-neutral-900 pb-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Día a día</p>
                    <h1 id={titleId} className="mt-1 text-2xl font-bold">{t("report.title")}</h1>
                    <p className="mt-1 text-neutral-700">
                        {t("report.range", { from: longDate(report.from), to: longDate(report.to) })}
                    </p>
                </header>

                {report.days.length === 0 ? (
                    <p className="mt-8 text-center text-neutral-600">{t("report.empty")}</p>
                ) : (
                    <>
                        <section className="mt-5 grid grid-cols-3 gap-3 print-avoid-break">
                            <Kpi label={t("report.daysRecorded")} value={`${report.days.length}`} hint={t("report.ofDays", { count: report.totalDays })} />
                            <Kpi label={t("report.average")} value={fmt(report.average)} hint={`/${ringCount}`} />
                            <Kpi label={t("report.moodAverage")} value={moodLabel(report.moodMode) ?? "–"} hint={totalMoods ? t("report.moodDays", { count: totalMoods }) : ""} />
                        </section>

                        {report.sectorRows.length > 0 && (
                            <section className="mt-6 print-avoid-break">
                                <h2 className="mb-2 text-base font-bold">{t("report.sectors")}</h2>
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-300 text-left text-xs text-neutral-500">
                                            <th scope="col" className="py-1.5 pr-2 font-semibold">{t("report.col.sector")}</th>
                                            <th scope="col" className="py-1.5 pr-2 font-semibold">{t("report.col.average")}</th>
                                            <th scope="col" className="py-1.5 pr-2 font-semibold whitespace-nowrap">{t("report.col.range")}</th>
                                            <th scope="col" className="py-1.5 pr-2 font-semibold">{t("report.col.days")}</th>
                                            <th scope="col" className="py-1.5 font-semibold">{t("report.col.trend")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.sectorRows.map(({ sector, average, min, max, count, trend }) => (
                                            <tr key={sector.id} className="border-b border-neutral-200">
                                                <th scope="row" className="py-1.5 pr-2 text-left font-medium">
                                                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ backgroundColor: sector.color }} aria-hidden="true" />
                                                    {sector.name}
                                                    {sector.archived && <span className="ml-1 text-xs font-normal text-neutral-500">({t("report.archived")})</span>}
                                                </th>
                                                <td className="py-1.5 pr-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-8 tabular-nums">{fmt(average)}</span>
                                                        <span className="hidden h-2 flex-1 rounded-full bg-neutral-200 sm:block" aria-hidden="true">
                                                            <span className="block h-2 rounded-full" style={{ width: `${((average ?? 0) / ringCount) * 100}%`, backgroundColor: sector.color }} />
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-1.5 pr-2 tabular-nums whitespace-nowrap">{min}–{max}</td>
                                                <td className="py-1.5 pr-2 tabular-nums">{count}</td>
                                                <td className="py-1.5 tabular-nums whitespace-nowrap">{trendLabel(trend, fmt, t)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <p className="mt-1.5 text-xs text-neutral-500">{t("report.trendHint")}</p>
                            </section>
                        )}

                        {totalMoods > 0 && (
                            <section className="mt-6 print-avoid-break">
                                <h2 className="mb-2 text-base font-bold">{t("report.mood")}</h2>
                                <ul className="space-y-1">
                                    {MOODS.map(({ value, Icon, labelKey }, index) => (
                                        <li key={value} className="flex items-center gap-2">
                                            <Icon size={16} className="text-neutral-600" aria-hidden="true" />
                                            <span className="w-20">{t(labelKey)}</span>
                                            <span className="h-2 flex-1 rounded-full bg-neutral-200" aria-hidden="true">
                                                <span className="block h-2 rounded-full bg-neutral-700" style={{ width: `${(report.moodCounts[index] / maxMoodCount) * 100}%` }} />
                                            </span>
                                            <span className="w-8 text-right tabular-nums">{report.moodCounts[index]}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        <section className="mt-6">
                            <h2 className="mb-2 text-base font-bold">{t("report.byDay")}</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-neutral-300 text-left text-neutral-500">
                                            <th scope="col" className="py-1 pr-2 font-semibold">{t("report.col.date")}</th>
                                            <th scope="col" className="py-1 pr-2 font-semibold">{t("report.col.mood")}</th>
                                            <th scope="col" className="py-1 pr-2 font-semibold">{t("report.col.average")}</th>
                                            {report.sectorRows.map(({ sector }) => (
                                                <th key={sector.id} scope="col" className="py-1 pr-2 font-semibold">
                                                    <span className="block max-w-[5.5rem] truncate" title={sector.name}>{sector.name}</span>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.days.map((day) => (
                                            <tr key={day.date} className="border-b border-neutral-200 print-avoid-break">
                                                <th scope="row" className="py-1 pr-2 text-left font-medium whitespace-nowrap">{shortDate(day.date)}</th>
                                                <td className="py-1 pr-2 whitespace-nowrap">{moodLabel(day.mood) ?? ""}</td>
                                                <td className="py-1 pr-2 tabular-nums font-semibold">{day.average === null ? "" : fmt(day.average)}</td>
                                                {report.sectorRows.map(({ sector }) => (
                                                    <td key={sector.id} className="py-1 pr-2 tabular-nums">{day.scores[sector.id] ?? ""}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {includeNotes && notesDays.length > 0 && (
                            <section className="mt-6">
                                <h2 className="mb-2 text-base font-bold">{t("report.notes")}</h2>
                                <div className="space-y-3">
                                    {notesDays.map((day) => (
                                        <div key={day.date} className="border-l-2 border-neutral-300 pl-3 print-avoid-break">
                                            <h3 className="font-semibold">{longDate(day.date)}</h3>
                                            {PROMPTS.map(({ field, labelKey }) => {
                                                const text = day.summary?.[field]?.trim();
                                                return text ? (
                                                    <p key={field} className="mt-0.5 whitespace-pre-line">
                                                        <span className="font-medium text-neutral-600">{t(labelKey)}:</span> {text}
                                                    </p>
                                                ) : null;
                                            })}
                                            {Object.entries(day.comments).map(([sectorId, text]) => (
                                                <p key={sectorId} className="mt-0.5">
                                                    <span className="font-medium text-neutral-600">{sectorById.get(sectorId)?.name ?? t("journal.unknownSector")}:</span> {text}
                                                </p>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}

                <footer className="mt-8 border-t border-neutral-300 pt-2 text-[11px] text-neutral-500">
                    {t("report.footer", { date: longDate(today) })}
                </footer>
            </article>
        </div>,
        document.body
    );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
    return (
        <div className="rounded-lg border border-neutral-300 p-3">
            <p className="text-xs text-neutral-500">{label}</p>
            <p className="mt-0.5 text-xl font-bold">{value}</p>
            {hint && <p className="text-xs text-neutral-500">{hint}</p>}
        </div>
    );
}

function trendLabel(trend: number | null, fmt: (value: number | null) => string, t: (key: TranslationKey) => string): string {
    if (trend === null) return "–";
    if (Math.abs(trend) < STABLE_TREND) return `= ${t("report.stable")}`;
    return `${trend > 0 ? "↑ +" : "↓ −"}${fmt(Math.abs(trend))}`;
}
