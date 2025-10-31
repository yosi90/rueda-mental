import type { Sector } from './Sector';

export interface SectorWithAngles extends Sector {
  a0: number;      // ángulo inicial
  a1: number;      // ángulo final
  mid: number;     // ángulo medio
  a0n: number;     // ángulo inicial normalizado
  a1n: number;     // ángulo final normalizado
}