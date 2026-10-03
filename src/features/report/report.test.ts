import { describe, expect, it } from "vitest";
import { buildCsv, csvOptionsFor, type CsvLabels } from "./csv";
import { buildReport, collectReportDays, type ReportSource } from "./report";

const source: ReportSource = {
    sectors: [
        { id: "a", name: "Salud", color: "#f00" },
        { id: "b", name: "Ocio", color: "#0f0" },
        { id: "c", name: "Viejo", color: "#00f", archived: true },
        { id: "d", name: "Nunca", color: "#000", archived: true },
    ],
    scoresByDate: {
        "2026-09-01": { a: 2, b: 0, c: 5 },
        "2026-09-28": { a: 4, b: 6 },
        "2026-09-29": { a: 6 },
        "2026-09-30": { a: 8, b: 8 },
        "2026-10-01": { a: 10 },
        "2026-10-02": {},
    },
    commentsByDate: { "2026-10-02": { b: "Peli, con \"amigos\"" }, "2026-10-01": { a: "=SUMA(A1)" } },
    dailySummaryByDate: { "2026-09-30": { good: "Bien; mucho", bad: "", howFacedBad: "", mood: 4 }, "2026-10-01": { good: "", bad: "", howFacedBad: "", mood: 2 } },
    toDisplay: (raw) => raw,
};

describe("collectReportDays", () => {
    it("incluye días con puntuaciones, resumen o comentarios e ignora los ceros", () => {
        const days = collectReportDays(source);
        expect(days.map((d) => d.date)).toEqual(["2026-09-01", "2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02"]);
        expect(days[0].scores).toEqual({ a: 2, c: 5 });
        expect(days[0].average).toBe(3.5);
        expect(days[5].average).toBeNull();
    });
});

describe("buildReport", () => {
    it("limita al periodo y calcula medias, ánimo y tendencia", () => {
        const report = buildReport(source, 7, "2026-10-03");
        expect(report.from).toBe("2026-09-27");
        expect(report.totalDays).toBe(7);
        expect(report.days).toHaveLength(5);
        expect(report.moodCounts).toEqual([0, 1, 0, 1, 0]);
        expect(report.moodAverage).toBe(3);
        expect(report.moodMode).toBe(2); // empate 2 y 4, igual de cerca de la media: el primero
        const salud = report.sectorRows.find((r) => r.sector.id === "a");
        expect(salud).toMatchObject({ average: 7, min: 4, max: 10, count: 4, trend: 4 });
        // El archivado sin puntuaciones en el periodo no aparece
        expect(report.sectorRows.map((r) => r.sector.id)).toEqual(["a", "b"]);
    });

    it("«todo» empieza en el primer día con datos", () => {
        const report = buildReport(source, "all", "2026-10-03");
        expect(report.from).toBe("2026-09-01");
        expect(report.totalDays).toBe(33);
        expect(report.sectorRows.map((r) => r.sector.id)).toEqual(["a", "b", "c"]);
    });
});

describe("buildCsv", () => {
    const labels: CsvLabels = {
        date: "Fecha",
        average: "Media",
        mood: "Ánimo",
        summary: { good: "Lo bueno", bad: "Lo malo", howFacedBad: "Cómo" },
        comment: (name) => `Comentario: ${name}`,
        archived: (name) => `${name} (archivado)`,
    };

    it("usa «;» y coma decimal en español y «,» en inglés", () => {
        expect(csvOptionsFor("es-ES")).toEqual({ separator: ";", decimal: "," });
        expect(csvOptionsFor("en-GB")).toEqual({ separator: ",", decimal: "." });
    });

    it("genera cabecera, filas escapadas y sin fórmulas", () => {
        const csv = buildCsv(collectReportDays(source), source.sectors, labels, { separator: ";", decimal: "," });
        expect(csv.charCodeAt(0)).toBe(0xfeff);
        const lines = csv.slice(1).trimEnd().split("\r\n");
        expect(lines[0]).toBe("Fecha;Salud;Ocio;Viejo (archivado);Media;Ánimo;Lo bueno;Lo malo;Cómo;Comentario: Salud;Comentario: Ocio");
        expect(lines[1]).toBe("2026-09-01;2;;5;3,50;;;;;;");
        expect(lines[4]).toBe("2026-09-30;8;8;;8,00;4;\"Bien; mucho\";;;;");
        expect(lines[5]).toBe("2026-10-01;10;;;10,00;2;;;;'=SUMA(A1);");
        expect(lines[6]).toBe("2026-10-02;;;;;;;;;;\"Peli, con \"\"amigos\"\"\"");
    });
});
