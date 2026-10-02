import type { Sector, SectorWithAngles } from "../../../shared/types/mentalWheel";

export const RING_COUNT = 10; // 1..10 (0 = sin nota)
export const WHEEL_SIZE = 520; // lado del viewBox del SVG
const LABEL_PADDING = 70; // margen para las etiquetas exteriores
const SECTOR_GAP_DEG = 2;

export interface WheelGeometry {
    size: number;
    cx: number;
    cy: number;
    radius: number;
    centerRadius: number;
    levelOuterRadius: (level: number) => number;
    levelLabelRadius: (level: number) => number;
    distanceToLevel: (distance: number) => number;
}

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

export function normalizeDeg(d: number): number {
    return ((d % 360) + 360) % 360;
}

export function createWheelGeometry(size = WHEEL_SIZE, ringCount = RING_COUNT): WheelGeometry {
    const ringThickness = (size / 2 - LABEL_PADDING) / ringCount;
    const centerRadius = ringThickness * 0.6;
    return {
        size,
        cx: size / 2,
        cy: size / 2,
        radius: centerRadius + ringCount * ringThickness,
        centerRadius,
        levelOuterRadius: (level) => (level <= 0 ? 0 : centerRadius + level * ringThickness),
        levelLabelRadius: (level) => centerRadius + (level - 0.5) * ringThickness,
        distanceToLevel: (distance) => (
            distance <= 0 ? 0 : clamp(Math.ceil((distance - centerRadius) / ringThickness), 1, ringCount)
        ),
    };
}

/** Reparte la circunferencia entre los sectores empezando arriba (-90°), con un pequeño hueco entre ellos. */
export function computeSectorAngles(sectors: Sector[]): SectorWithAngles[] {
    const count = Math.max(1, sectors.length);
    const span = (360 - count * SECTOR_GAP_DEG) / count;
    return sectors.map((sector, index) => {
        const a0 = -90 + index * (span + SECTOR_GAP_DEG) + SECTOR_GAP_DEG / 2;
        const a1 = a0 + span;
        return { ...sector, a0, a1, mid: (a0 + a1) / 2, a0n: normalizeDeg(a0), a1n: normalizeDeg(a1) };
    });
}

/** `angle` en grados normalizados (0..360). Tiene en cuenta los sectores que cruzan 0°. */
export function isAngleInSector(angle: number, sector: SectorWithAngles): boolean {
    const { a0n, a1n } = sector;
    return a0n <= a1n ? angle >= a0n && angle <= a1n : angle >= a0n || angle <= a1n;
}
