import { describe, expect, it } from "vitest";
import { defaultSectors, hslFor, SECTOR_PALETTE, translateDefaultSectorName, withPaletteColors } from "./sectorUtils";

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

describe("colores de los sectores", () => {
    it("los sectores por defecto usan la paleta del icono y después colores automáticos", () => {
        expect(defaultSectors("es").map((s) => s.color)).toEqual([...SECTOR_PALETTE]);
        expect(hslFor(8)).toMatch(/^hsl\(/);
    });

    it("cambia solo los colores automáticos antiguos de los 8 primeros puestos", () => {
        const sectors = [
            { id: "a", name: "A", color: "hsl(0 70% 50%)" }, // antiguo del puesto 0
            { id: "b", name: "B", color: "#123456" }, // elegido por el usuario
            { id: "c", name: "C", color: "hsl(275 70% 50%)" }, // antiguo del puesto 2, aunque esté en otro sitio
        ];
        expect(withPaletteColors(sectors).map((s) => s.color)).toEqual([SECTOR_PALETTE[0], "#123456", SECTOR_PALETTE[2]]);
        const custom = [{ id: "b", name: "B", color: "#123456" }];
        expect(withPaletteColors(custom)).toBe(custom);
    });
});
