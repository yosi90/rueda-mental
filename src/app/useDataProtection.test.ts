import { describe, expect, it } from "vitest";
import { shouldRemindBackup } from "./useDataProtection";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 2);

describe("shouldRemindBackup", () => {
    it("no recuerda con pocos días de datos", () => {
        expect(shouldRemindBackup(3, null, null, NOW)).toBe(false);
    });

    it("recuerda si nunca se hizo copia o es antigua", () => {
        expect(shouldRemindBackup(10, null, null, NOW)).toBe(true);
        expect(shouldRemindBackup(10, NOW - 40 * DAY, null, NOW)).toBe(true);
        expect(shouldRemindBackup(10, NOW - 5 * DAY, null, NOW)).toBe(false);
    });

    it("como mucho un recordatorio por semana", () => {
        expect(shouldRemindBackup(10, null, NOW - 2 * DAY, NOW)).toBe(false);
        expect(shouldRemindBackup(10, null, NOW - 8 * DAY, NOW)).toBe(true);
    });
});
