import type { Scores, ScoresByDate } from "../types/mentalWheel";

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
