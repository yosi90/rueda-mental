import { DEFAULT_STATS_VISIBILITY } from "../constants/mentalWheel";
import type { StatsVisibility } from "../types/mentalWheel";

export function isObjectRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Completa con los valores por defecto cualquier opción ausente o con un tipo incorrecto.
export function normalizeStatsVisibility(
    value: unknown,
    defaults: StatsVisibility = DEFAULT_STATS_VISIBILITY
): StatsVisibility | null {
    if (!isObjectRecord(value)) return null;
    const keys = Object.keys(defaults) as (keyof StatsVisibility)[];
    return Object.fromEntries(
        keys.map((key) => [key, typeof value[key] === "boolean" ? value[key] : defaults[key]])
    ) as StatsVisibility;
}
