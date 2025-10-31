import type { Sector } from '../types';

export const DEFAULT_SECTOR_NAMES = [
  "Familia",
  "Amigos",
  "Dinero",
  "Amor",
  "Trabajo",
  "Salud",
  "Ocio",
  "Aprendizaje",
];

export function generateDefaultSectors(): Sector[] {
  return DEFAULT_SECTOR_NAMES.map((name, i) => ({
    id: `sector-${Date.now()}-${i}`,
    name,
    color: `hsl(${(i * 360) / DEFAULT_SECTOR_NAMES.length} 70% 60%)`,
  }));
}