import type { CommentsByDate, DailySummary, DailySummaryByDate, ScoresByDate, Sector } from "../../shared/types/mentalWheel";
import { addDaysToDateInput } from "../../shared/utils/date";
import { isValidMood, summaryHasContent } from "../../shared/utils/summary";

export type ReportPeriod = 7 | 30 | 90 | "all";

export interface ReportSource {
    sectors: Sector[];
    scoresByDate: ScoresByDate;
    commentsByDate: CommentsByDate;
    dailySummaryByDate: DailySummaryByDate;
    /** Puntuación interna (1..N) → escala visible. */
    toDisplay: (raw: number) => number;
}

export interface ReportDay {
    date: string;
    /** Puntuaciones en escala visible; solo sectores puntuados. */
    scores: Record<string, number>;
    /** Media de los sectores puntuados (null si ese día no hay puntuaciones). */
    average: number | null;
    mood?: number;
    summary?: DailySummary;
    comments: Record<string, string>;
}

export interface SectorReportRow {
    sector: Sector;
    average: number | null;
    min: number | null;
    max: number | null;
    count: number;
    /** Media de la segunda mitad de los días puntuados menos la de la primera (null con menos de 4). */
    trend: number | null;
}

export interface ReportData {
    from: string;
    to: string;
    totalDays: number;
    days: ReportDay[];
    average: number | null;
    moodAverage: number | null;
    /** Estado de ánimo más frecuente (en empate, el más cercano a la media). */
    moodMode: number | null;
    /** Recuento por estado de ánimo: índice 0 = 1 (muy mal) … 4 = 5 (muy bien). */
    moodCounts: number[];
    /** Sectores con alguna puntuación en el periodo (activos y archivados), en su orden. */
    sectorRows: SectorReportRow[];
}

const average = (values: number[]): number | null =>
    values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

/** Todos los días con puntuaciones, resumen o comentarios, en orden ascendente. */
export function collectReportDays(source: ReportSource, from?: string, to?: string): ReportDay[] {
    const { scoresByDate, commentsByDate, dailySummaryByDate, toDisplay } = source;
    const dates = new Set([...Object.keys(scoresByDate), ...Object.keys(commentsByDate), ...Object.keys(dailySummaryByDate)]);
    const days: ReportDay[] = [];

    for (const date of [...dates].sort()) {
        if ((from && date < from) || (to && date > to)) continue;
        const scores: Record<string, number> = {};
        for (const [sectorId, raw] of Object.entries(scoresByDate[date] ?? {})) {
            if (raw > 0) scores[sectorId] = toDisplay(raw);
        }
        const summary = summaryHasContent(dailySummaryByDate[date]) ? dailySummaryByDate[date] : undefined;
        const comments = Object.fromEntries(
            Object.entries(commentsByDate[date] ?? {}).filter(([, text]) => text.trim().length > 0)
        );
        if (Object.keys(scores).length === 0 && !summary && Object.keys(comments).length === 0) continue;
        days.push({
            date,
            scores,
            average: average(Object.values(scores)),
            mood: isValidMood(summary?.mood) ? summary?.mood : undefined,
            summary,
            comments,
        });
    }
    return days;
}

export function buildReport(source: ReportSource, period: ReportPeriod, today: string): ReportData {
    const allDays = collectReportDays(source, undefined, today);
    const from = period === "all" ? (allDays[0]?.date ?? today) : addDaysToDateInput(today, -(period - 1));
    const days = allDays.filter((day) => day.date >= from);

    let totalDays = 1;
    for (let cursor = from; cursor < today; cursor = addDaysToDateInput(cursor, 1)) totalDays++;

    const moods = days.map((d) => d.mood).filter((m): m is number => m !== undefined);
    const moodCounts = [1, 2, 3, 4, 5].map((value) => moods.filter((m) => m === value).length);
    const moodAverage = average(moods);
    const maxCount = Math.max(...moodCounts);
    const moodMode = moods.length === 0 ? null : [1, 2, 3, 4, 5]
        .filter((value) => moodCounts[value - 1] === maxCount)
        .sort((a, b) => Math.abs(a - (moodAverage ?? 3)) - Math.abs(b - (moodAverage ?? 3)))[0];

    const sectorRows = source.sectors
        .map((sector): SectorReportRow => {
            const values = days.map((d) => d.scores[sector.id]).filter((v): v is number => v !== undefined);
            const half = Math.floor(values.length / 2);
            const firstHalf = average(values.slice(0, half));
            const secondHalf = average(values.slice(values.length - half));
            return {
                sector,
                average: average(values),
                min: values.length ? Math.min(...values) : null,
                max: values.length ? Math.max(...values) : null,
                count: values.length,
                trend: values.length >= 4 && firstHalf !== null && secondHalf !== null ? secondHalf - firstHalf : null,
            };
        })
        .filter((row) => row.count > 0);

    return {
        from,
        to: today,
        totalDays,
        days,
        average: average(days.map((d) => d.average).filter((v): v is number => v !== null)),
        moodAverage,
        moodMode,
        moodCounts,
        sectorRows,
    };
}
