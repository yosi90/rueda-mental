// Funciones matemáticas básicas
export const clamp = (v: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, v));

export const toRad = (deg: number): number =>
    (deg * Math.PI) / 180;

export const toDeg = (rad: number): number =>
    (rad * 180) / Math.PI;

// Normaliza un ángulo al rango 0..360
export const normDeg = (d: number): number =>
    ((d % 360) + 360) % 360;