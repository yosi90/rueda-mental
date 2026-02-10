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
    darkMode: "mental-wheel-dark-mode",
    tutorialShown: "mental-wheel-tutorial-shown",
    statsVisibility: "mental-wheel-stats-visibility-v1",
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
        return Boolean(localStorage.getItem(STORAGE_KEYS.tutorialShown));
    } catch {
        return false;
    }
}

export function markTutorialAsShown(): void {
    try {
        localStorage.setItem(STORAGE_KEYS.tutorialShown, "true");
    } catch {
        // noop
    }
}

export function loadStatsVisibility(defaultValue: StatsVisibility): StatsVisibility {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.statsVisibility);
        if (raw) return JSON.parse(raw);
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