import { describe, expect, it } from "vitest";
import { dayHasScores, findPreviousDateWithScores } from "./scores";

describe("scores", () => {
    it("dayHasScores ignora días vacíos o solo con ceros", () => {
        expect(dayHasScores(undefined)).toBe(false);
        expect(dayHasScores({})).toBe(false);
        expect(dayHasScores({ a: 0 })).toBe(false);
        expect(dayHasScores({ a: 0, b: 3 })).toBe(true);
    });

    it("findPreviousDateWithScores busca el día anterior más reciente con datos", () => {
        const scores = {
            "2026-09-28": { a: 5 },
            "2026-09-30": { a: 0 },
            "2026-10-01": {},
            "2026-10-02": { a: 7 },
        };
        expect(findPreviousDateWithScores(scores, "2026-10-02")).toBe("2026-09-28");
        expect(findPreviousDateWithScores(scores, "2026-10-03")).toBe("2026-10-02");
        expect(findPreviousDateWithScores(scores, "2026-09-28")).toBeNull();
    });
});
