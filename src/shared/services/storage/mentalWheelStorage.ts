import type {
    CommentsByDate,
    DailySummaryByDate,
    ScoresByDate,
    Sector,
    StatsVisibility,
} from "../../types/mentalWheel";

const STORAGE_KEYS = {
    config: "mental-wheel-config-v1",
    scores: "mental-wheel-scores-v1",
    comments: "mental-wheel-comments-v1",
    dailySummary: "mental-wheel-daily-summary-v1",
    scaleInverted: "mental-wheel-scale-inverted-v1",
    darkMode: "mental-wheel-dark-mode",
    tutorialShown: "mental-wheel-tutorial-shown",
    statsVisibility: "mental-wheel-stats-visibility-v1",
    language: "mental-wheel-language-v1",
} as const;

export function loadConfig(): Sector[] | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.config);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function saveConfig(cfg: Sector[]): void {
    try {
        localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(cfg));
    } catch (error) {
        console.error("Error al guardar la configuración:", error);
    }
}

export function loadScores(): ScoresByDate {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.scores);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

export function saveScores(data: ScoresByDate): void {
    try {
        localStorage.setItem(STORAGE_KEYS.scores, JSON.stringify(data));
    } catch (error) {
        console.error("Error al guardar las puntuaciones:", error);
    }
}

export function loadComments(): CommentsByDate {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.comments);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

export function saveComments(data: CommentsByDate): void {
    try {
        localStorage.setItem(STORAGE_KEYS.comments, JSON.stringify(data));
    } catch (error) {
        console.error("Error al guardar comentarios:", error);
    }
}

export function loadDailySummary(): DailySummaryByDate {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.dailySummary);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

export function saveDailySummary(data: DailySummaryByDate): void {
    try {
        localStorage.setItem(STORAGE_KEYS.dailySummary, JSON.stringify(data));
    } catch (error) {
        console.error("Error al guardar el resumen diario:", error);
    }
}

export function loadScaleInverted(): boolean {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.scaleInverted);
        return raw ? JSON.parse(raw) : false;
    } catch {
        return false;
    }
}

export function saveScaleInverted(scaleInverted: boolean): void {
    try {
        localStorage.setItem(STORAGE_KEYS.scaleInverted, JSON.stringify(scaleInverted));
    } catch (error) {
        console.error("Error al guardar la dirección de escala:", error);
    }
}

export function loadDarkMode(): boolean {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.darkMode);
        return saved ? JSON.parse(saved) : false;
    } catch {
        return false;
    }
}

export function saveDarkMode(darkMode: boolean): void {
    try {
        localStorage.setItem(STORAGE_KEYS.darkMode, JSON.stringify(darkMode));
    } catch (error) {
        console.error("Error al guardar el tema:", error);
    }
}

export function hasTutorialBeenShown(): boolean {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.tutorialShown);
        if (raw === null) return false;
        if (raw === "false") return false;
        return true;
    } catch {
        return false;
    }
}

export function markTutorialAsShown(): void {
    saveTutorialShown(true);
}

export function saveTutorialShown(shown: boolean): void {
    try {
        if (shown) {
            localStorage.setItem(STORAGE_KEYS.tutorialShown, "true");
        } else {
            localStorage.removeItem(STORAGE_KEYS.tutorialShown);
        }
    } catch {
        // noop
    }
}

export function loadStatsVisibility(defaultValue: StatsVisibility): StatsVisibility {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.statsVisibility);
        if (raw) {
            const parsed = JSON.parse(raw) as Partial<StatsVisibility>;
            return {
                enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : defaultValue.enabled,
                showDailyAverage: typeof parsed.showDailyAverage === "boolean" ? parsed.showDailyAverage : defaultValue.showDailyAverage,
                showSectorProgress: typeof parsed.showSectorProgress === "boolean" ? parsed.showSectorProgress : defaultValue.showSectorProgress,
                showLast7AllSectors: typeof parsed.showLast7AllSectors === "boolean" ? parsed.showLast7AllSectors : defaultValue.showLast7AllSectors,
                showComparison: typeof parsed.showComparison === "boolean" ? parsed.showComparison : defaultValue.showComparison,
                showWeeklyTrend: typeof parsed.showWeeklyTrend === "boolean" ? parsed.showWeeklyTrend : defaultValue.showWeeklyTrend,
                showHeatMap: typeof parsed.showHeatMap === "boolean" ? parsed.showHeatMap : defaultValue.showHeatMap,
                showInsights: typeof parsed.showInsights === "boolean" ? parsed.showInsights : defaultValue.showInsights,
            };
        }
    } catch {
        // noop
    }
    return defaultValue;
}

export function saveStatsVisibility(statsVisibility: StatsVisibility): void {
    try {
        localStorage.setItem(STORAGE_KEYS.statsVisibility, JSON.stringify(statsVisibility));
    } catch {
        // noop
    }
}

export function loadLanguage(defaultLanguage = "es"): string {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.language);
        return raw || defaultLanguage;
    } catch {
        return defaultLanguage;
    }
}

export function saveLanguage(language: string): void {
    try {
        localStorage.setItem(STORAGE_KEYS.language, language);
    } catch {
        // noop
    }
}
