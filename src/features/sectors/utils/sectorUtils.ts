import type { Language } from "../../../shared/i18n/translations";
import type { Sector } from "../../../shared/types/mentalWheel";
import { DEFAULT_SECTOR_ICONS, suggestSectorIcon } from "../icons/sectorIcons";

export function genId(): string {
    // randomUUID solo existe en contextos seguros (https/localhost)
    return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10);
}

/** Colores del icono (pétalos en el sentido de las agujas del reloj desde arriba): los de los primeros sectores. */
export const SECTOR_PALETTE = ["#fda4af", "#fdba74", "#fde047", "#86efac", "#5eead4", "#7dd3fc", "#a5b4fc", "#f0abfc"] as const;

/** Color automático anterior a la paleta del icono (se sigue usando a partir del noveno sector). */
function goldenHsl(i: number): string {
    const goldenAngle = 137.508;
    const hue = Math.round((i * goldenAngle) % 360);
    return `hsl(${hue} 70% 50%)`;
}

export function hslFor(i: number): string {
    return SECTOR_PALETTE[i] ?? goldenHsl(i);
}

/**
 * Cambia los colores automáticos antiguos de los 8 primeros puestos por los de la paleta del icono.
 * Los colores elegidos por el usuario no se tocan.
 */
export function withPaletteColors(sectors: Sector[]): Sector[] {
    let changed = false;
    const result = sectors.map((sector) => {
        const index = SECTOR_PALETTE.findIndex((_, i) => goldenHsl(i) === sector.color);
        if (index < 0) return sector;
        changed = true;
        return { ...sector, color: SECTOR_PALETTE[index] };
    });
    return changed ? result : sectors;
}

const DEFAULT_SECTOR_LABELS: Record<Language, readonly string[]> = {
    es: [
        "Familia",
        "Amigos",
        "Dinero",
        "Amor",
        "Trabajo",
        "Salud",
        "Ocio",
        "Aprendizaje",
    ],
    en: [
        "Family",
        "Friends",
        "Money",
        "Love",
        "Work",
        "Health",
        "Leisure",
        "Learning",
    ],
    pt: [
        "Família",
        "Amigos",
        "Dinheiro",
        "Amor",
        "Trabalho",
        "Saúde",
        "Lazer",
        "Aprendizagem",
    ],
    de: [
        "Familie",
        "Freunde",
        "Geld",
        "Liebe",
        "Arbeit",
        "Gesundheit",
        "Freizeit",
        "Lernen",
    ],
};

// Sin tildes para reconocer también los nombres guardados por versiones anteriores ("Saude" = "Saúde").
function normalizeLabel(label: string): string {
    return label.trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function defaultSectors(language: Language = "es"): Sector[] {
    const names = DEFAULT_SECTOR_LABELS[language];
    return names.map((name, i) => ({ id: genId(), name, color: hslFor(i), icon: DEFAULT_SECTOR_ICONS[i] }));
}

function defaultSectorIndex(name: string): number {
    const normalizedName = normalizeLabel(name);
    return DEFAULT_SECTOR_LABELS.es.findIndex((_, index) =>
        Object.values(DEFAULT_SECTOR_LABELS).some((labels) => normalizeLabel(labels[index]) === normalizedName)
    );
}

export function translateDefaultSectorName(name: string, targetLanguage: Language): string | null {
    const index = defaultSectorIndex(name);
    return index >= 0 ? DEFAULT_SECTOR_LABELS[targetLanguage][index] : null;
}

/**
 * Asigna icono a los sectores que nunca lo han tenido (datos anteriores a los iconos):
 * el suyo a los predefinidos y uno sugerido por el nombre al resto. Respeta los iconos elegidos o quitados.
 */
export function withDefaultIcons(sectors: Sector[]): Sector[] {
    let changed = false;
    const result = sectors.map((sector) => {
        if (sector.icon !== undefined) return sector;
        const index = defaultSectorIndex(sector.name);
        const icon = index >= 0 ? DEFAULT_SECTOR_ICONS[index] : suggestSectorIcon(sector.name);
        if (!icon) return sector;
        changed = true;
        return { ...sector, icon };
    });
    return changed ? result : sectors;
}
