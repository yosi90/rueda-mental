import type { CommentsByDate, DailySummaryByDate, Scores, ScoresByDate } from "../types/mentalWheel";
import { summaryHasContent } from "./summary";

/** Un día cuenta como registrado si al menos un sector tiene nota (0 = sin nota). */
export function dayHasScores(dayScores: Scores | undefined): boolean {
    return Boolean(dayScores) && Object.values(dayScores!).some((score) => score > 0);
}

/** Fecha más reciente anterior a `dateStr` con puntuaciones, o null. */
export function findPreviousDateWithScores(scoresByDate: ScoresByDate, dateStr: string): string | null {
    let best: string | null = null;
    for (const date of Object.keys(scoresByDate)) {
        if (date < dateStr && (best === null || date > best) && dayHasScores(scoresByDate[date])) {
            best = date;
        }
    }
    return best;
}

/** Días con alguna puntuación, comentario o resumen (para marcarlos en el calendario). */
export function collectDaysWithData(
    scoresByDate: ScoresByDate,
    commentsByDate: CommentsByDate,
    dailySummaryByDate: DailySummaryByDate
): Set<string> {
    const days = new Set<string>();
    for (const [date, dayScores] of Object.entries(scoresByDate)) {
        if (dayHasScores(dayScores)) days.add(date);
    }
    for (const [date, dayComments] of Object.entries(commentsByDate)) {
        if (Object.values(dayComments).some((text) => text.trim().length > 0)) days.add(date);
    }
    for (const [date, summary] of Object.entries(dailySummaryByDate)) {
        if (summaryHasContent(summary)) days.add(date);
    }
    return days;
}
