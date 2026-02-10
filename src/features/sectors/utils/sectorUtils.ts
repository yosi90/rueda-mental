import type { Language } from "../../../shared/i18n/translations";
import type { Sector } from "../../../shared/types/mentalWheel";

export function genId(): string {
    return Math.random().toString(36).slice(2, 10);
}

export function hslFor(i: number): string {
    const goldenAngle = 137.508;
    const hue = Math.round((i * goldenAngle) % 360);
    return `hsl(${hue} 70% 50%)`;
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
        "Familia",
        "Amigos",
        "Dinheiro",
        "Amor",
        "Trabalho",
        "Saude",
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

function normalizeLabel(label: string): string {
    return label.trim().toLowerCase();
}

export function defaultSectors(language: Language = "es"): Sector[] {
    const names = DEFAULT_SECTOR_LABELS[language];
    return names.map((name, i) => ({ id: genId(), name, color: hslFor(i) }));
}

export function translateDefaultSectorName(name: string, targetLanguage: Language): string | null {
    const normalizedName = normalizeLabel(name);
    const targetLabels = DEFAULT_SECTOR_LABELS[targetLanguage];

    for (let index = 0; index < targetLabels.length; index += 1) {
        const matchesAnyLanguage = Object.values(DEFAULT_SECTOR_LABELS).some((labels) =>
            normalizeLabel(labels[index]) === normalizedName
        );
        if (matchesAnyLanguage) {
            return targetLabels[index];
        }
    }

    return null;
}
