import type {
    CommentsByDate,
    DailySummaryByDate,
    ScoresByDate,
    Sector,
    StatsVisibility,
} from "../../types/mentalWheel";
import { APP_STYLE_DEFINITIONS, isAppStyle, type AppStyle } from "../../theme/styles";
import { normalizeStatsVisibility } from "../../utils/statsVisibility";

const STORAGE_KEYS = {
    config: "mental-wheel-config-v1",
    scores: "mental-wheel-scores-v1",
    comments: "mental-wheel-comments-v1",
    dailySummary: "mental-wheel-daily-summary-v1",
    scaleInverted: "mental-wheel-scale-inverted-v1",
    darkMode: "mental-wheel-dark-mode",
    style: "mental-wheel-style-v1",
    backgroundImage: "mental-wheel-background-image-v1",
    lastBackupAt: "mental-wheel-last-backup-v1",
    backupReminderAt: "mental-wheel-backup-reminder-v1",
    persistRequested: "mental-wheel-persist-requested-v1",
    stylePickerDone: "mental-wheel-style-picker-done-v1",
    sosCountry: "mental-wheel-sos-country-v1",
    tutorialShown: "mental-wheel-tutorial-shown",
    statsVisibility: "mental-wheel-stats-visibility-v1",
    language: "mental-wheel-language-v1",
    showReference: "mental-wheel-show-reference-v1",
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
        return raw ? removeEmptyDays(JSON.parse(raw)) : {};
    } catch {
        return {};
    }
}

// Versiones anteriores guardaban `{}` en cada fecha visitada; se descartan al cargar.
function removeEmptyDays(data: ScoresByDate): ScoresByDate {
    return Object.fromEntries(
        Object.entries(data).filter(([, dayScores]) => Object.keys(dayScores ?? {}).length > 0)
    );
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

/** Tema guardado; en la primera visita, el del sistema operativo. */
export function loadDarkMode(): boolean {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.darkMode);
        if (saved) return JSON.parse(saved);
    } catch {
        // noop
    }
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
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
        if (raw) return normalizeStatsVisibility(JSON.parse(raw), defaultValue) ?? defaultValue;
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

/** Idioma guardado, o null si el usuario aún no ha elegido ninguno. */
export function loadLanguage(): string | null {
    try {
        return localStorage.getItem(STORAGE_KEYS.language);
    } catch {
        return null;
    }
}

export function saveLanguage(language: string): void {
    try {
        localStorage.setItem(STORAGE_KEYS.language, language);
    } catch {
        // noop
    }
}

/** Mostrar el último día registrado como referencia en la rueda (por defecto, sí). */
export function loadShowReference(): boolean {
    try {
        return localStorage.getItem(STORAGE_KEYS.showReference) !== "false";
    } catch {
        return true;
    }
}

export function saveShowReference(show: boolean): void {
    try {
        localStorage.setItem(STORAGE_KEYS.showReference, String(show));
    } catch {
        // noop
    }
}

/** Estilo visual guardado; si no hay (versiones anteriores), se deriva del modo oscuro guardado o del sistema. */
export function loadAppStyle(): AppStyle {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.style);
        if (isAppStyle(saved)) return saved;
    } catch {
        // noop
    }
    return loadDarkMode() ? "dark" : "light";
}

export function saveAppStyle(style: AppStyle): void {
    try {
        localStorage.setItem(STORAGE_KEYS.style, style);
        // Se mantiene también el modo oscuro por compatibilidad con copias y versiones anteriores
        saveDarkMode(APP_STYLE_DEFINITIONS[style].mode === "dark");
    } catch {
        // noop
    }
}

/** Fondo con imagen en los estilos que lo tienen (por defecto, sí). */
export function loadBackgroundImage(): boolean {
    try {
        return localStorage.getItem(STORAGE_KEYS.backgroundImage) !== "false";
    } catch {
        return true;
    }
}

export function saveBackgroundImage(enabled: boolean): void {
    try {
        localStorage.setItem(STORAGE_KEYS.backgroundImage, String(enabled));
    } catch {
        // noop
    }
}

function loadTimestamp(key: string): number | null {
    try {
        const value = Number(localStorage.getItem(key));
        return Number.isFinite(value) && value > 0 ? value : null;
    } catch {
        return null;
    }
}

function saveTimestamp(key: string, time = Date.now()): void {
    try {
        localStorage.setItem(key, String(time));
    } catch {
        // noop
    }
}

/** Momento de la última copia exportada (ms) o null si nunca. */
export const loadLastBackupAt = () => loadTimestamp(STORAGE_KEYS.lastBackupAt);
export const saveLastBackupAt = () => saveTimestamp(STORAGE_KEYS.lastBackupAt);
/** Última vez que se mostró el recordatorio de copia. */
export const loadBackupReminderAt = () => loadTimestamp(STORAGE_KEYS.backupReminderAt);
export const saveBackupReminderAt = () => saveTimestamp(STORAGE_KEYS.backupReminderAt);
/** Si ya se pidió al navegador almacenamiento persistente. */
export const loadPersistRequestedAt = () => loadTimestamp(STORAGE_KEYS.persistRequested);
export const savePersistRequestedAt = () => saveTimestamp(STORAGE_KEYS.persistRequested);

/** El usuario ya eligió (o descartó) estilo en el selector de bienvenida o en Configuración. */
export const loadStylePickerDoneAt = () => loadTimestamp(STORAGE_KEYS.stylePickerDone);
export const saveStylePickerDoneAt = () => saveTimestamp(STORAGE_KEYS.stylePickerDone);

/** País elegido en el SOS (null: se detecta del navegador). */
export function loadSosCountry(): string | null {
    try {
        return localStorage.getItem(STORAGE_KEYS.sosCountry);
    } catch {
        return null;
    }
}

export function saveSosCountry(code: string): void {
    try {
        localStorage.setItem(STORAGE_KEYS.sosCountry, code);
    } catch {
        // noop
    }
}
