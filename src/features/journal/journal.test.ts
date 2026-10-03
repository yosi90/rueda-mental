import { describe, expect, it } from "vitest";
import { buildJournalEntries, filterJournal, findMatches } from "./journal";

const summaries = {
    "2026-10-01": { good: "Paseo por el monte", bad: "", howFacedBad: "" },
    "2026-10-02": { good: "", bad: "", howFacedBad: "", mood: 2 },
    "2026-09-30": { good: "", bad: "", howFacedBad: "" }, // vacío: no cuenta
};
const comments = {
    "2026-10-02": { b: "Discusión tonta", a: "Llamé a mamá" },
    "2026-09-29": { a: "   " }, // solo espacios: no cuenta
    "2026-09-28": { z: "Sector borrado" },
};
const names: Record<string, string> = { a: "Familia", b: "Trabajo" };
const sectorName = (id: string) => names[id] ?? "";

describe("buildJournalEntries", () => {
    it("lista los días con contenido, del más reciente al más antiguo", () => {
        const entries = buildJournalEntries(summaries, comments, ["a", "b"]);
        expect(entries.map((e) => e.date)).toEqual(["2026-10-02", "2026-10-01", "2026-09-28"]);
    });

    it("ordena los comentarios como los sectores", () => {
        const [day] = buildJournalEntries(summaries, comments, ["a", "b"]);
        expect(day.comments.map((c) => c.sectorId)).toEqual(["a", "b"]);
        expect(day.summary?.mood).toBe(2);
    });
});

describe("filterJournal", () => {
    const entries = buildJournalEntries(summaries, comments, ["a", "b"]);

    it("busca sin distinguir tildes ni mayúsculas", () => {
        expect(filterJournal(entries, "DISCUSION", "all", sectorName).map((e) => e.date)).toEqual(["2026-10-02"]);
        expect(filterJournal(entries, "mamá", "all", sectorName).map((e) => e.date)).toEqual(["2026-10-02"]);
    });

    it("encuentra por nombre de sector", () => {
        expect(filterJournal(entries, "trabajo", "all", sectorName).map((e) => e.date)).toEqual(["2026-10-02"]);
    });

    it("filtra por tipo", () => {
        const onlySummaries = filterJournal(entries, "", "summaries", sectorName);
        expect(onlySummaries.map((e) => e.date)).toEqual(["2026-10-02", "2026-10-01"]);
        expect(onlySummaries.every((e) => e.comments.length === 0)).toBe(true);
        const onlyComments = filterJournal(entries, "", "comments", sectorName);
        expect(onlyComments.map((e) => e.date)).toEqual(["2026-10-02", "2026-09-28"]);
        expect(onlyComments.every((e) => e.summary === undefined)).toBe(true);
        expect(filterJournal(entries, "monte", "comments", sectorName)).toEqual([]);
    });
});

describe("findMatches", () => {
    it("devuelve los tramos del texto original", () => {
        expect(findMatches("Canción y cancion", "cancion")).toEqual([[0, 7], [10, 17]]);
        expect(findMatches("Hola", "  ")).toEqual([]);
        expect(findMatches("😀 árbol", "arbol")).toEqual([[3, 8]]);
    });
});
