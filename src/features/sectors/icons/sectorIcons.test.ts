import { describe, expect, it } from "vitest";
import { DEFAULT_SECTOR_ICONS, getSectorIcon, searchSectorIcons, SECTOR_ICONS } from "./sectorIcons";
import { withDefaultIcons } from "../utils/sectorUtils";

describe("sectorIcons", () => {
    it("tiene ids únicos y los iconos por defecto existen", () => {
        expect(new Set(SECTOR_ICONS.map((i) => i.id)).size).toBe(SECTOR_ICONS.length);
        for (const id of DEFAULT_SECTOR_ICONS) expect(getSectorIcon(id), id).toBeDefined();
    });

    it("busca por palabras clave sin tildes y filtra por categoría", () => {
        expect(searchSectorIcons("montaña").map((i) => i.id)).toContain("mountain");
        expect(searchSectorIcons("music").map((i) => i.id)).toContain("music");
        expect(searchSectorIcons("", "food").every((i) => i.category === "food")).toBe(true);
        expect(searchSectorIcons("zzzz")).toEqual([]);
    });
});

describe("withDefaultIcons", () => {
    it("asigna icono a los sectores predefinidos sin icono y respeta el resto", () => {
        const result = withDefaultIcons([
            { id: "1", name: "Saude", color: "#000" },
            { id: "2", name: "Meditación", color: "#000" },
            { id: "3", name: "Trabajo", color: "#000", icon: "" },
            { id: "4", name: "Amor", color: "#000", icon: "star" },
        ]);
        expect(result.map((s) => s.icon)).toEqual(["heart-pulse", undefined, "", "star"]);
    });
});
