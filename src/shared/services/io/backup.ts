import { isLanguage, type Language } from "../../i18n/translations";
import { isAppStyle, type AppStyle } from "../../theme/styles";
import type {
    CommentsByDate,
    DailySummary,
    DailySummaryByDate,
    MentalWheelBackup,
    Scores,
    ScoresByDate,
    Sector,
    StatsVisibility,
} from "../../types/mentalWheel";
import { isObjectRecord, normalizeStatsVisibility } from "../../utils/statsVisibility";
import { isValidMood, SUMMARY_TEXT_FIELDS } from "../../utils/summary";

export interface ParsedBackup {
    config?: Sector[];
    scoresByDate?: ScoresByDate;
    commentsByDate?: CommentsByDate;
    dailySummaryByDate?: DailySummaryByDate;
    scaleInverted?: boolean;
    darkMode?: boolean;
    style?: AppStyle;
    language?: Language;
    tutorialShown?: boolean;
    statsVisibility?: StatsVisibility;
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

function isSector(value: unknown): value is Sector {
    return isObjectRecord(value)
        && typeof value.id === "string" && value.id.length > 0
        && typeof value.name === "string"
        && typeof value.color === "string"
        && (value.icon === undefined || typeof value.icon === "string")
        && (value.archived === undefined || typeof value.archived === "boolean");
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
    return isObjectRecord(day)
        && SUMMARY_TEXT_FIELDS.every((k) => typeof day[k] === "string")
        && (day.mood === undefined || isValidMood(day.mood));
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
    if (isAppStyle(data.style)) result.style = data.style;
    if (typeof data.language === "string" && isLanguage(data.language)) result.language = data.language;
    if (typeof data.tutorialShown === "boolean") result.tutorialShown = data.tutorialShown;
    const statsVisibility = normalizeStatsVisibility(data.statsVisibility);
    if (statsVisibility) result.statsVisibility = statsVisibility;

    const hasData = result.config || result.scoresByDate || result.commentsByDate || result.dailySummaryByDate;
    return hasData ? result : null;
}

/** Descarga la copia de seguridad como archivo JSON. */
export function downloadBackup(backup: MentalWheelBackup, filename: string): void {
    downloadFile(JSON.stringify(backup, null, 2), filename, "application/json");
}

/** Descarga un texto como archivo. */
export function downloadFile(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

/** Lee y valida un archivo de copia de seguridad; null si no es válido. */
export async function readBackupFile(file: File): Promise<ParsedBackup | null> {
    try {
        return parseBackup(await file.text());
    } catch {
        return null;
    }
}
