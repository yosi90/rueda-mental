import type { TranslationKey } from "../../shared/i18n/translations";

/**
 * Directorio de teléfonos de urgencia y apoyo por país.
 * Verificado el 2026-10-03 con fuentes oficiales (ministerios, servicios de salud y las propias líneas).
 * Antes de añadir o cambiar un número, verificarlo en su fuente oficial.
 */

export type SupportKind = "emergency" | "medical" | "police" | "crisis" | "support" | "violence";

export interface SupportContact {
    /** Número tal como se muestra. */
    number: string;
    /** Nombre propio del servicio (no se traduce). */
    name?: string;
    kind: SupportKind;
    available24?: boolean;
    /** Horario si no es 24 h (formato neutro, p. ej. «15:30–00:30»). */
    hours?: string;
    free?: boolean;
    /** Zona desde la que se puede llamar (nombre propio, no se traduce). */
    area?: string;
    nationwide?: boolean;
    mobileOnly?: boolean;
    /** Nota traducida adicional. */
    noteKey?: TranslationKey;
}

export interface SupportCountry {
    code: string;
    /** Número principal de emergencias (botón «Llamar al …»). */
    emergency: string;
    contacts: SupportContact[];
}

export const SOS_COUNTRIES: readonly SupportCountry[] = [
    {
        code: "ES",
        emergency: "112",
        contacts: [
            { number: "112", kind: "emergency", available24: true, free: true },
            { number: "024", name: "Línea 024", kind: "crisis", available24: true, free: true },
            { number: "900 107 917", name: "Cruz Roja Te Escucha", kind: "support", free: true, noteKey: "sos.contact.emotional.availability" },
            { number: "016", kind: "violence", available24: true, free: true, noteKey: "sos.contact.016.extra" },
            { number: "091", name: "Policía Nacional", kind: "police", available24: true },
            { number: "062", name: "Guardia Civil", kind: "police", available24: true },
        ],
    },
    {
        code: "PT",
        emergency: "112",
        contacts: [
            { number: "112", kind: "emergency", available24: true, free: true },
            { number: "1411", name: "Linha Nacional de Prevenção do Suicídio", kind: "crisis", available24: true, free: true },
            { number: "808 24 24 24", name: "SNS 24 · Aconselhamento Psicológico", kind: "support", available24: true },
            { number: "213 544 545", name: "SOS Voz Amiga", kind: "support", hours: "15:30–00:30" },
        ],
    },
    {
        code: "BR",
        emergency: "192",
        contacts: [
            { number: "192", name: "SAMU", kind: "medical", available24: true, free: true },
            { number: "190", kind: "police", available24: true, free: true },
            { number: "188", name: "CVV · Centro de Valorização da Vida", kind: "crisis", available24: true, free: true },
            { number: "180", name: "Central de Atendimento à Mulher", kind: "violence", available24: true, free: true },
        ],
    },
    {
        code: "DE",
        emergency: "112",
        contacts: [
            { number: "112", kind: "emergency", available24: true, free: true },
            { number: "110", kind: "police", available24: true, free: true },
            { number: "0800 111 0 111", name: "TelefonSeelsorge", kind: "crisis", available24: true, free: true },
            { number: "116 016", name: "Hilfetelefon Gewalt gegen Frauen", kind: "violence", available24: true, free: true },
        ],
    },
    {
        code: "AT",
        emergency: "144",
        contacts: [
            { number: "144", name: "Rettung", kind: "medical", available24: true, free: true },
            { number: "133", kind: "police", available24: true, free: true },
            { number: "142", name: "TelefonSeelsorge", kind: "crisis", available24: true, free: true },
            { number: "0800 222 555", name: "Frauenhelpline gegen Gewalt", kind: "violence", available24: true, free: true },
        ],
    },
    {
        code: "CH",
        emergency: "144",
        contacts: [
            { number: "144", kind: "medical", available24: true, free: true },
            { number: "117", kind: "police", available24: true, free: true },
            { number: "143", name: "Die Dargebotene Hand", kind: "crisis", available24: true },
            { number: "142", name: "Opferhilfe", kind: "violence", available24: true, free: true },
        ],
    },
    {
        code: "GB",
        emergency: "999",
        contacts: [
            { number: "999", kind: "emergency", available24: true, free: true },
            { number: "116 123", name: "Samaritans", kind: "crisis", available24: true, free: true },
            { number: "0808 2000 247", name: "National Domestic Abuse Helpline", kind: "violence", available24: true, free: true },
        ],
    },
    {
        code: "MX",
        emergency: "911",
        contacts: [
            { number: "911", kind: "emergency", available24: true, free: true },
            { number: "800 911 2000", name: "Línea de la Vida", kind: "crisis", available24: true, free: true },
        ],
    },
    {
        code: "AR",
        emergency: "911",
        contacts: [
            { number: "911", kind: "emergency", available24: true, free: true },
            { number: "107", name: "SAME", kind: "medical", available24: true, free: true },
            { number: "135", name: "Centro de Asistencia al Suicida", kind: "crisis", free: true, area: "CABA y Gran Buenos Aires" },
            { number: "0800 345 1435", name: "Centro de Asistencia al Suicida", kind: "crisis", free: true, nationwide: true },
            { number: "144", kind: "violence", available24: true, free: true },
        ],
    },
    {
        code: "CO",
        emergency: "123",
        contacts: [
            { number: "123", kind: "emergency", available24: true, free: true },
            { number: "106", name: "Línea 106", kind: "support", available24: true, free: true },
            { number: "155", kind: "violence", available24: true, free: true },
        ],
    },
    {
        code: "CL",
        emergency: "131",
        contacts: [
            { number: "131", name: "SAMU", kind: "medical", available24: true, free: true },
            { number: "133", name: "Carabineros", kind: "police", available24: true, free: true },
            { number: "*4141", name: "Línea de Prevención del Suicidio", kind: "crisis", available24: true, free: true, mobileOnly: true, noteKey: "sos.dialManually" },
            { number: "1455", kind: "violence", hours: "08:00–24:00", free: true },
        ],
    },
];

export const OTHER_COUNTRY = "OTHER";

const BY_CODE = new Map(SOS_COUNTRIES.map((country) => [country.code, country]));

export function getSosCountry(code: string): SupportCountry | undefined {
    return BY_CODE.get(code);
}

/** País por defecto del idioma de la app cuando el navegador no indica región. */
const LANGUAGE_DEFAULT: Record<string, string> = { es: "ES", pt: "PT", de: "DE", en: "GB" };

/**
 * País sugerido a partir de las preferencias del navegador (p. ej. es-MX → MX).
 * Si la región indicada no está en el directorio, «otro país»; si no hay región, el del idioma de la app.
 */
export function detectSosCountry(browserLanguages: readonly string[], appLanguage: string): string {
    for (const tag of browserLanguages) {
        const region = tag.split(/[-_]/)[1]?.toUpperCase();
        if (region && /^[A-Z]{2}$/.test(region)) return BY_CODE.has(region) ? region : OTHER_COUNTRY;
    }
    return LANGUAGE_DEFAULT[appLanguage] ?? OTHER_COUNTRY;
}

/** Cadena para enlaces tel: (sin espacios). El «*» se deja tal cual (iOS no marca solo esos números: se ven y se marcan a mano). */
export function toTelHref(number: string): string {
    return `tel:${number.replace(/\s+/g, "")}`;
}
