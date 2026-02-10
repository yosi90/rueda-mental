function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

export function toDisplayScore(rawScore: number, ringCount: number, isScaleInverted: boolean): number {
    const clamped = clamp(rawScore, 0, ringCount);
    if (clamped <= 0) return 0;
    return isScaleInverted ? (ringCount + 1) - clamped : clamped;
}

export function toRawScore(displayScore: number, ringCount: number, isScaleInverted: boolean): number {
    const clamped = clamp(displayScore, 0, ringCount);
    if (clamped <= 0) return 0;
    return isScaleInverted ? (ringCount + 1) - clamped : clamped;
}

export function isBetterScore(candidate: number, reference: number, isScaleInverted: boolean): boolean {
    return isScaleInverted ? candidate < reference : candidate > reference;
}
