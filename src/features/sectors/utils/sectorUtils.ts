import type { Sector } from "../../../shared/types/mentalWheel";

export function genId(): string {
    return Math.random().toString(36).slice(2, 10);
}

export function hslFor(i: number): string {
    const goldenAngle = 137.508;
    const hue = Math.round((i * goldenAngle) % 360);
    return `hsl(${hue} 70% 50%)`;
}

export function defaultSectors(): Sector[] {
    const names = [
        "Familia",
        "Amigos",
        "Dinero",
        "Amor",
        "Trabajo",
        "Salud",
        "Ocio",
        "Aprendizaje",
    ];
    return names.map((name, i) => ({ id: genId(), name, color: hslFor(i) }));
}