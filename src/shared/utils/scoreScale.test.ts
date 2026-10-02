import { describe, expect, it } from "vitest";
import { isBetterScore, toDisplayScore, toRawScore } from "./scoreScale";

describe("scoreScale", () => {
    it("escala normal: el valor se muestra tal cual", () => {
        expect(toDisplayScore(7, 10, false)).toBe(7);
        expect(toRawScore(7, 10, false)).toBe(7);
    });

    it("escala invertida: 1 ↔ 10 y 0 sigue siendo «sin nota»", () => {
        expect(toDisplayScore(1, 10, true)).toBe(10);
        expect(toDisplayScore(10, 10, true)).toBe(1);
        expect(toDisplayScore(0, 10, true)).toBe(0);
        expect(toRawScore(toDisplayScore(3, 10, true), 10, true)).toBe(3);
    });

    it("limita valores fuera de rango", () => {
        expect(toDisplayScore(15, 10, false)).toBe(10);
        expect(toDisplayScore(-2, 10, false)).toBe(0);
    });

    it("isBetterScore respeta la dirección de la escala", () => {
        expect(isBetterScore(8, 5, false)).toBe(true);
        expect(isBetterScore(8, 5, true)).toBe(false);
    });
});
