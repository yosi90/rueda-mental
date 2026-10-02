import { isLanguage, type Language } from "../../i18n/translations";
import type {
    CommentsByDate,
    DailySummary,
    DailySummaryByDate,
    Scores,
    ScoresByDate,
    Sector,
    StatsVisibility,
} from "../../types/mentalWheel";
import { isObjectRecord, normalizeStatsVisibility } from "../../utils/statsVisibility";

export interface ParsedBackup {
    config?: Sector[];
    scoresByDate?: ScoresByDate;
    commentsByDate?: CommentsByDate;
    dailySummaryByDate?: DailySummaryByDate;
    scaleInverted?: boolean;
    darkMode?: boolean;
    language?: Language;
    tutorialShown?: boolean;
    statsVisibility?: StatsVisibility;
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

function isSector(value: unknown): value is Sector {
    return isObjectRecord(value)
        && typeof value.id === "string" && value.id.length > 0
        && typeof value.name === "string"
        && typeof value.color === "string";
}

function isByDate<T>(value: unknown, isDay: (day: unknown) => day is T): value is Record<string, T> {
    return isObjectRecord(value)
        && Object.entries(value).every(([date, day]) => DATE_KEY.test(date) && isDay(day));
}

function isScoresDay(day: unknown): day is Scores {
    return isObjectRecord(day) && Object.values(day).every((v) => typeof v === "number" && Number.isFinite(v));
}

function isCommentsDay(day: unknown): day is Record<string, string> {
    return isObjectRecord(day) && Object.values(day).every((v) => typeof v === "string");
}

function isSummaryDay(day: unknown): day is DailySummary {
    return isObjectRecord(day) && ["good", "bad", "howFacedBad"].every((k) => typeof day[k] === "string");
}

/**
 * Valida una copia de seguridad completa. Devuelve null si algún campo presente
 * tiene una estructura inválida, para no importar datos a medias.
 */
export function parseBackup(raw: string): ParsedBackup | null {
    let data: unknown;
    try {
        data = JSON.parse(raw);
    } catch {
        return null;
    }
    if (!isObjectRecord(data)) return null;

    const result: ParsedBackup = {};

    if (data.config !== undefined) {
        if (!Array.isArray(data.config) || !data.config.every(isSector)) return null;
        result.config = data.config;
    }
    if (data.scoresByDate !== undefined) {
        if (!isByDate(data.scoresByDate, isScoresDay)) return null;
        result.scoresByDate = data.scoresByDate;
    }
    if (data.commentsByDate !== undefined) {
        if (!isByDate(data.commentsByDate, isCommentsDay)) return null;
        result.commentsByDate = data.commentsByDate;
    }
    if (data.dailySummaryByDate !== undefined) {
        if (!isByDate(data.dailySummaryByDate, isSummaryDay)) return null;
        result.dailySummaryByDate = data.dailySummaryByDate;
    }

    if (typeof data.scaleInverted === "boolean") result.scaleInverted = data.scaleInverted;
    if (typeof data.darkMode === "boolean") result.darkMode = data.darkMode;
    if (typeof data.language === "string" && isLanguage(data.language)) result.language = data.language;
    if (typeof data.tutorialShown === "boolean") result.tutorialShown = data.tutorialShown;
    const statsVisibility = normalizeStatsVisibility(data.statsVisibility);
    if (statsVisibility) result.statsVisibility = statsVisibility;

    const hasData = result.config || result.scoresByDate || result.commentsByDate || result.dailySummaryByDate;
    return hasData ? result : null;
}
