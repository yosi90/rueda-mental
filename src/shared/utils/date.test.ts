import { afterEach, describe, expect, it } from "vitest";
import { addDaysToDateInput, formatDateInput, parseDateInput } from "./date";

const TIME_ZONES = ["Europe/Madrid", "America/Mexico_City", "America/Sao_Paulo", "Pacific/Auckland"];
const originalTz = process.env.TZ;

afterEach(() => {
    process.env.TZ = originalTz;
});

describe.each(TIME_ZONES)("fechas en %s", (timeZone) => {
    it("parseDateInput conserva el día local", () => {
        process.env.TZ = timeZone;
        const date = parseDateInput("2026-10-02");
        expect(date.getDate()).toBe(2);
        expect(date.getDay()).toBe(5); // viernes
        expect(formatDateInput(date)).toBe("2026-10-02");
    });

    it("addDaysToDateInput avanza y retrocede un día exacto", () => {
        process.env.TZ = timeZone;
        expect(addDaysToDateInput("2026-10-02", -1)).toBe("2026-10-01");
        expect(addDaysToDateInput("2026-10-02", 1)).toBe("2026-10-03");
        expect(addDaysToDateInput("2026-03-01", -1)).toBe("2026-02-28");
        expect(addDaysToDateInput("2026-12-31", 1)).toBe("2027-01-01");
    });
});
