import { describe, expect, it } from "vitest";
import { computeSectorAngles, createWheelGeometry, isAngleInSector, RING_COUNT } from "./wheelGeometry";

const sectors = ["a", "b", "c", "d"].map((id) => ({ id, name: id, color: "#000" }));

describe("wheelGeometry", () => {
    const geometry = createWheelGeometry();

    it("convierte distancias en niveles 1..10 y vuelve a radios", () => {
        expect(geometry.distanceToLevel(0)).toBe(0);
        expect(geometry.distanceToLevel(geometry.centerRadius + 0.1)).toBe(1);
        expect(geometry.distanceToLevel(geometry.radius)).toBe(RING_COUNT);
        expect(geometry.distanceToLevel(geometry.radius * 2)).toBe(RING_COUNT);
        expect(geometry.levelOuterRadius(RING_COUNT)).toBeCloseTo(geometry.radius);
        for (let level = 1; level <= RING_COUNT; level++) {
            expect(geometry.distanceToLevel(geometry.levelLabelRadius(level))).toBe(level);
        }
    });

    it("reparte los sectores empezando arriba y en sentido horario", () => {
        const angles = computeSectorAngles(sectors);
        expect(angles[0].a0).toBeCloseTo(-89);
        expect(angles[1].a0).toBeCloseTo(angles[0].a1 + 2);
        expect(angles[3].a1).toBeCloseTo(269);
    });

    it("detecta el sector de un ángulo, incluido el que cruza 0°", () => {
        // Con 3 sectores el primero va de -89° a 29°: cruza 0°
        const angles = computeSectorAngles(sectors.slice(0, 3));
        expect(isAngleInSector(315, angles[0])).toBe(true);
        expect(isAngleInSector(10, angles[0])).toBe(true);
        expect(isAngleInSector(90, angles[0])).toBe(false);
        expect(isAngleInSector(90, angles[1])).toBe(true);
        expect(isAngleInSector(30, angles[1])).toBe(false); // hueco entre sectores
    });
});
