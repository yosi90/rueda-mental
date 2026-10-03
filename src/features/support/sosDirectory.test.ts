import { describe, expect, it } from "vitest";
import { detectSosCountry, OTHER_COUNTRY, SOS_COUNTRIES, toTelHref } from "./sosDirectory";

describe("sosDirectory", () => {
    it("cada país tiene su número de emergencias entre sus contactos y sin duplicados", () => {
        for (const country of SOS_COUNTRIES) {
            expect(country.contacts.map((c) => c.number), country.code).toContain(country.emergency);
            const keys = country.contacts.map((c) => `${c.number}-${c.kind}`);
            expect(new Set(keys).size, country.code).toBe(keys.length);
        }
    });

    it("no incluye Estados Unidos ni Israel", () => {
        const codes = SOS_COUNTRIES.map((c) => c.code);
        expect(codes).not.toContain("US");
        expect(codes).not.toContain("IL");
    });

    it("detecta el país por la región del navegador o, sin región, por el idioma", () => {
        expect(detectSosCountry(["es-ES"], "es")).toBe("ES");
        expect(detectSosCountry(["es-MX", "es"], "es")).toBe("MX");
        expect(detectSosCountry(["pt-BR"], "pt")).toBe("BR");
        expect(detectSosCountry(["de-CH"], "de")).toBe("CH");
        expect(detectSosCountry(["en"], "en")).toBe("GB");
        expect(detectSosCountry(["de"], "de")).toBe("DE");
        expect(detectSosCountry(["en-US"], "en")).toBe(OTHER_COUNTRY);
        expect(detectSosCountry(["he-IL"], "es")).toBe(OTHER_COUNTRY);
    });

    it("genera enlaces tel: sin espacios", () => {
        expect(toTelHref("0800 111 0 111")).toBe("tel:08001110111");
        expect(toTelHref("*4141")).toBe("tel:*4141");
    });
});
