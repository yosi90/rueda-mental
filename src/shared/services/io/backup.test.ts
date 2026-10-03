import { describe, expect, it } from "vitest";
import { DEFAULT_STATS_VISIBILITY } from "../../constants/mentalWheel";
import { parseBackup } from "./backup";

const validBackup = {
    version: 2,
    config: [{ id: "a", name: "Salud", color: "#ff0000" }],
    scoresByDate: { "2026-10-01": { a: 7 } },
    commentsByDate: { "2026-10-01": { a: "Bien" } },
    dailySummaryByDate: { "2026-10-01": { good: "x", bad: "", howFacedBad: "" } },
    scaleInverted: true,
    language: "de",
    statsVisibility: { enabled: false },
};

describe("parseBackup", () => {
    it("acepta una copia válida", () => {
        const backup = parseBackup(JSON.stringify(validBackup));
        expect(backup?.config).toEqual(validBackup.config);
        expect(backup?.scoresByDate).toEqual(validBackup.scoresByDate);
        expect(backup?.scaleInverted).toBe(true);
        expect(backup?.language).toBe("de");
        expect(backup?.statsVisibility).toEqual({ ...DEFAULT_STATS_VISIBILITY, enabled: false });
    });

    it.each([
        ["JSON mal formado", "{nope"],
        ["no es un objeto", "[1,2]"],
        ["sin datos", JSON.stringify({ darkMode: true })],
        ["sector sin id", JSON.stringify({ ...validBackup, config: [{ name: "X", color: "#000" }] })],
        ["puntuación no numérica", JSON.stringify({ ...validBackup, scoresByDate: { "2026-10-01": { a: "7" } } })],
        ["fecha inválida", JSON.stringify({ ...validBackup, scoresByDate: { "ayer": { a: 7 } } })],
        ["resumen incompleto", JSON.stringify({ ...validBackup, dailySummaryByDate: { "2026-10-01": { good: "x" } } })],
        ["estado de ánimo fuera de rango", JSON.stringify({ ...validBackup, dailySummaryByDate: { "2026-10-01": { good: "", bad: "", howFacedBad: "", mood: 9 } } })],
    ])("rechaza: %s", (_, raw) => {
        expect(parseBackup(raw)).toBeNull();
    });

    it("ignora un idioma no soportado", () => {
        expect(parseBackup(JSON.stringify({ ...validBackup, language: "fr" }))?.language).toBeUndefined();
    });
});
