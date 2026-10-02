import { describe, expect, it } from "vitest";
import { getTranslation, SUPPORTED_LANGUAGES, TRANSLATIONS } from "./translations";

describe("translations", () => {
    it.each(SUPPORTED_LANGUAGES)("%s tiene todas las claves sin valores vacíos", (language) => {
        const keys = Object.keys(TRANSLATIONS.es);
        const values = TRANSLATIONS[language] as Record<string, string>;
        for (const key of keys) {
            expect(values[key], key).toBeTruthy();
        }
    });

    it("interpola parámetros", () => {
        expect(getTranslation("es", "sectors.deleteConfirm", { name: "Salud" })).toContain("«Salud»");
    });
});
