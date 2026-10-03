import type { Sector } from "../../shared/types/mentalWheel";
import { SUMMARY_TEXT_FIELDS, type SummaryTextField } from "../../shared/utils/summary";
import type { ReportDay } from "./report";

export interface CsvLabels {
    date: string;
    average: string;
    mood: string;
    summary: Record<SummaryTextField, string>;
    /** Cabecera de la columna de comentarios de un sector. */
    comment: (sectorName: string) => string;
    archived: (sectorName: string) => string;
}

export interface CsvOptions {
    /** «;» donde la coma es el separador decimal (es, pt, de); «,» en inglés. */
    separator: string;
    decimal: string;
}

/** Separador y decimal que Excel espera según el idioma. */
export function csvOptionsFor(locale: string): CsvOptions {
    const decimal = (1.5).toLocaleString(locale).charAt(1);
    return decimal === "," ? { separator: ";", decimal: "," } : { separator: ",", decimal: "." };
}

/** Escapa una celda; evita que una hoja de cálculo interprete el texto como fórmula. */
function cell(value: string, separator: string): string {
    const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
    return /["\r\n]/.test(safe) || safe.includes(separator) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/**
 * CSV con una fila por día: puntuación de cada sector, media, estado de ánimo (1-5),
 * textos del resumen y una columna de comentarios por sector que tenga alguno.
 */
export function buildCsv(days: readonly ReportDay[], sectors: readonly Sector[], labels: CsvLabels, options: CsvOptions): string {
    const { separator, decimal } = options;
    const number = (value: number | null | undefined, digits = 0) =>
        value === null || value === undefined ? "" : value.toFixed(digits).replace(".", decimal);
    const scoredSectors = sectors.filter((s) => !s.archived || days.some((d) => d.scores[s.id] !== undefined));
    const commentedSectors = sectors.filter((s) => days.some((d) => d.comments[s.id]));
    const sectorHeader = (s: Sector) => (s.archived ? labels.archived(s.name) : s.name);

    const header = [
        labels.date,
        ...scoredSectors.map(sectorHeader),
        labels.average,
        labels.mood,
        ...SUMMARY_TEXT_FIELDS.map((field) => labels.summary[field]),
        ...commentedSectors.map((s) => labels.comment(sectorHeader(s))),
    ];
    const rows = days.map((day) => [
        day.date,
        ...scoredSectors.map((s) => number(day.scores[s.id])),
        number(day.average, 2),
        number(day.mood),
        ...SUMMARY_TEXT_FIELDS.map((field) => day.summary?.[field]?.trim() ?? ""),
        ...commentedSectors.map((s) => day.comments[s.id] ?? ""),
    ]);

    // BOM para que Excel lea el UTF-8 (tildes) correctamente
    return "\uFEFF" + [header, ...rows].map((row) => row.map((v) => cell(v, separator)).join(separator)).join("\r\n") + "\r\n";
}
