import type { SectorWithAngles } from '../types';

// Verifica si un ángulo está dentro de un sector
export function inSector(ang: number, s: SectorWithAngles): boolean {
    const a0 = s.a0n;
    const a1 = s.a1n;

    // Si a0 <= a1, es un sector normal
    // Si a0 > a1, es un sector que cruza 360°
    return a0 <= a1
        ? (ang >= a0 && ang <= a1)
        : (ang >= a0 || ang <= a1);
}