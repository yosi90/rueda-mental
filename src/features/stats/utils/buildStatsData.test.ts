import { afterEach, describe, expect, it } from "vitest";
import type { ScoresByDate, Sector } from "../../../shared/types/mentalWheel";
import { buildStatsData, calculateStreak } from "./buildStatsData";

const sectors: Sector[] = [
    { id: "a", name: "A", color: "#f00" },
    { id: "b", name: "B", color: "#0f0" },
];
const WEEK_DAYS: [string, string, string, string, string, string, string] = ["D", "L", "M", "X", "J", "V", "S"];
const originalTz = process.env.TZ;

afterEach(() => {
    process.env.TZ = originalTz;
});

function build(scoresByDate: ScoresByDate, todayStr = "2026-10-02", isScaleInverted = false) {
    return buildStatsData({
        scoresByDate,
        sectors,
        scores: scoresByDate[todayStr] ?? {},
        todayStr,
        ringCount: 10,
        isScaleInverted,
        locale: "es-ES",
        weekDaysShort: WEEK_DAYS,
        todayLabel: "Hoy",
    });
}

describe("calculateStreak", () => {
    it("cuenta días consecutivos hasta hoy", () => {
        expect(calculateStreak(new Set(["2026-09-30", "2026-10-01", "2026-10-02"]), "2026-10-02")).toBe(3);
    });

    it("si hoy no hay datos, cuenta desde ayer", () => {
        expect(calculateStreak(new Set(["2026-09-30", "2026-10-01"]), "2026-10-02")).toBe(2);
    });

    it("se corta con un hueco", () => {
        expect(calculateStreak(new Set(["2026-09-29", "2026-10-01", "2026-10-02"]), "2026-10-02")).toBe(2);
    });
});

describe("buildStatsData", () => {
    it("ignora días vacíos y fechas futuras", () => {
        const stats = build({
            "2026-09-30": {},
            "2026-10-01": { a: 4, b: 6 },
            "2026-10-02": { a: 0 },
            "2026-10-05": { a: 8 },
        });
        expect(stats.totalDays).toBe(1);
        expect(stats.dailyAverage).toEqual([expect.objectContaining({ date: "2026-10-01", media: 5 })]);
    });

    it("estado de ánimo: historial y media de la rueda por nivel", () => {
        const stats = buildStatsData({
            scoresByDate: { "2026-09-29": { a: 8, b: 6 }, "2026-09-30": { a: 4 }, "2026-10-01": { a: 6 } },
            dailySummaryByDate: {
                "2026-09-29": { good: "", bad: "", howFacedBad: "", mood: 4 },
                "2026-09-30": { good: "", bad: "", howFacedBad: "", mood: 2 },
                "2026-10-01": { good: "", bad: "", howFacedBad: "", mood: 4 },
                "2026-09-28": { good: "", bad: "", howFacedBad: "", mood: 3 }, // sin puntuaciones
                "2026-10-05": { good: "", bad: "", howFacedBad: "", mood: 5 }, // futuro
                "2026-09-27": { good: "x", bad: "", howFacedBad: "" }, // sin ánimo
            },
            sectors,
            scores: {},
            todayStr: "2026-10-02",
            ringCount: 10,
            isScaleInverted: false,
            locale: "es-ES",
            weekDaysShort: WEEK_DAYS,
            todayLabel: "Hoy",
        });
        expect(stats.moodHistory.map((p) => [p.date, p.mood, p.media])).toEqual([
            ["2026-09-28", 3, null],
            ["2026-09-29", 4, 7],
            ["2026-09-30", 2, 4],
            ["2026-10-01", 4, 6],
        ]);
        expect(stats.moodRelation).toEqual([
            { mood: 2, media: 4, days: 1 },
            { mood: 4, media: 6.5, days: 2 },
        ]);
    });

    it("la media diaria no cuenta sectores sin puntuar, también con escala invertida", () => {
        const stats = build({ "2026-10-01": { a: 2 } }, "2026-10-02", true);
        // Raw 2 en escala invertida (1..10) se muestra como 9; el sector sin puntuar no suma.
        expect(stats.dailyAverage[0].media).toBe(9);
    });

    it.each(["Europe/Madrid", "America/Mexico_City"])("racha y día de la semana correctos en %s", (timeZone) => {
        process.env.TZ = timeZone;
        const stats = build({
            "2026-10-01": { a: 5 },
            "2026-10-02": { a: 7 },
        });
        expect(stats.currentStreak).toBe(2);
        // 2026-10-02 es viernes (índice 5)
        expect(stats.weeklyData[5].media).toBe(7);
    });

    it("el heatmap cubre 60 días de calendario terminando hoy", () => {
        const stats = build({ "2026-09-15": { a: 5 } });
        expect(stats.heatMapData).toHaveLength(60);
        expect(stats.heatMapData[59].date).toBe("2026-10-02");
        expect(stats.heatMapData[0].date).toBe("2026-08-04");
        expect(stats.heatMapData.filter((d) => d.hasData).map((d) => d.date)).toEqual(["2026-09-15"]);
    });
});
