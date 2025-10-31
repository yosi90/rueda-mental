// Configuración base de la rueda
export const RING_COUNT = 10; // 0..10 (0 = sin nota)
export const SIZE = 520; // tamaño SVG
export const PADDING = 70; // margen para etiquetas externas

// Valores calculados
export const cx = SIZE / 2;
export const cy = SIZE / 2;
export const radius = (SIZE / 2) - PADDING;
export const ringThickness = radius / RING_COUNT;