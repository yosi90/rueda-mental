import { describe, expect, it } from "vitest";
import { DEFAULT_SOS_COUNTRY, SOS_COUNTRIES, toTelHref } from "./sosDirectory";

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

    it("España es el país por defecto", () => {
        expect(DEFAULT_SOS_COUNTRY).toBe("ES");
        expect(SOS_COUNTRIES.map((c) => c.code)).toContain(DEFAULT_SOS_COUNTRY);
    });

    it("genera enlaces tel: sin espacios", () => {
        expect(toTelHref("0800 111 0 111")).toBe("tel:08001110111");
        expect(toTelHref("*4141")).toBe("tel:*4141");
    });
});
