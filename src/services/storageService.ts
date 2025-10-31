import type { Sector, ScoresByDate } from '../types';
import { generateDefaultSectors } from '../constants';

const CONFIG_KEY = 'mental-wheel-config-v1';
const SCORES_KEY = 'mental-wheel-scores-v1';
const DARK_MODE_KEY = 'mental-wheel-dark-mode';

// --- Configuración de sectores ---
export function loadConfig(): Sector[] | null {
    try {
        const raw = localStorage.getItem(CONFIG_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.error('Error al cargar la configuración:', error);
        return null;
    }
}

export function saveConfig(sectors: Sector[]): void {
    try {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(sectors));
    } catch (error) {
        console.error('Error al guardar la configuración:', error);
    }
}

export function loadConfigOrDefault(): Sector[] {
    return loadConfig() || generateDefaultSectors();
}

// --- Puntuaciones ---
export function loadScores(): ScoresByDate {
    try {
        const raw = localStorage.getItem(SCORES_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (error) {
        console.error('Error al cargar las puntuaciones:', error);
        return {};
    }
}

export function saveScores(data: ScoresByDate): void {
    try {
        localStorage.setItem(SCORES_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Error al guardar las puntuaciones:', error);
    }
}

// --- Tema oscuro ---
export function loadDarkMode(): boolean {
    try {
        const saved = localStorage.getItem(DARK_MODE_KEY);
        return saved ? JSON.parse(saved) : false;
    } catch (error) {
        console.error('Error al cargar el tema:', error);
        return false;
    }
}

export function saveDarkMode(darkMode: boolean): void {
    try {
        localStorage.setItem(DARK_MODE_KEY, JSON.stringify(darkMode));
    } catch (error) {
        console.error('Error al guardar el tema:', error);
    }
}