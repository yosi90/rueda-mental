import { describe, expect, it } from "vitest";
import { defaultSectors, translateDefaultSectorName } from "./sectorUtils";

describe("translateDefaultSectorName", () => {
    it("traduce nombres por defecto entre idiomas", () => {
        expect(translateDefaultSectorName("Salud", "de")).toBe("Gesundheit");
        expect(translateDefaultSectorName("Health", "pt")).toBe("Saúde");
    });

    it("reconoce nombres guardados sin tildes por versiones anteriores", () => {
        expect(translateDefaultSectorName("Saude", "es")).toBe("Salud");
        expect(translateDefaultSectorName("familia", "pt")).toBe("Família");
    });

    it("no traduce nombres personalizados", () => {
        expect(translateDefaultSectorName("Meditación", "en")).toBeNull();
    });
});

describe("defaultSectors", () => {
    it("crea 8 sectores con ids únicos", () => {
        const sectors = defaultSectors("es");
        expect(sectors).toHaveLength(8);
        expect(new Set(sectors.map((s) => s.id)).size).toBe(8);
    });
});
