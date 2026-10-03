import type { DailySummary } from "../types/mentalWheel";

export const SUMMARY_TEXT_FIELDS = ["good", "bad", "howFacedBad"] as const;
export type SummaryTextField = (typeof SUMMARY_TEXT_FIELDS)[number];

export const MOOD_MIN = 1;
export const MOOD_MAX = 5;

export function isValidMood(value: unknown): value is number {
    return Number.isInteger(value) && (value as number) >= MOOD_MIN && (value as number) <= MOOD_MAX;
}

/** Un resumen cuenta si tiene algún texto o un estado de ánimo elegido. */
export function summaryHasContent(summary: DailySummary | undefined): boolean {
    if (!summary) return false;
    return isValidMood(summary.mood) || SUMMARY_TEXT_FIELDS.some((field) => (summary[field] ?? "").trim().length > 0);
}
