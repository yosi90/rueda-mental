import type { CommentsByDate, DailySummary, DailySummaryByDate } from "../../shared/types/mentalWheel";
import { SUMMARY_TEXT_FIELDS, summaryHasContent } from "../../shared/utils/summary";

export interface JournalComment {
    sectorId: string;
    text: string;
}

export interface JournalEntry {
    date: string;
    summary?: DailySummary;
    comments: JournalComment[];
}

export type JournalFilter = "all" | "summaries" | "comments";

/**
 * Días con resumen o comentarios, del más reciente al más antiguo.
 * Los comentarios siguen el orden de los sectores (los de sectores desconocidos, al final).
 */
export function buildJournalEntries(
    summaries: DailySummaryByDate,
    comments: CommentsByDate,
    sectorOrder: readonly string[],
): JournalEntry[] {
    const order = new Map(sectorOrder.map((id, index) => [id, index]));
    const dates = new Set([...Object.keys(summaries), ...Object.keys(comments)]);
    const entries: JournalEntry[] = [];

    for (const date of dates) {
        const summary = summaryHasContent(summaries[date]) ? summaries[date] : undefined;
        const dayComments = Object.entries(comments[date] ?? {})
            .filter(([, text]) => text.trim().length > 0)
            .map(([sectorId, text]) => ({ sectorId, text }))
            .sort((a, b) => (order.get(a.sectorId) ?? Infinity) - (order.get(b.sectorId) ?? Infinity));
        if (summary || dayComments.length > 0) entries.push({ date, summary, comments: dayComments });
    }
    return entries.sort((a, b) => b.date.localeCompare(a.date));
}

/** Minúsculas y sin tildes, carácter a carácter (misma longitud que el original). */
function foldChar(char: string): string {
    const folded = char.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return folded.length === 1 ? folded : char.toLowerCase().charAt(0);
}

export function foldForSearch(text: string): string {
    return Array.from(text, foldChar).join("");
}

/** Tramos [inicio, fin) del texto original que coinciden con la búsqueda (sin distinguir tildes ni mayúsculas). */
export function findMatches(text: string, query: string): Array<[number, number]> {
    const needle = foldForSearch(query.trim());
    if (!needle) return [];
    const chars = Array.from(text);
    const haystack = chars.map(foldChar).join("");
    // Índices de cada carácter en el texto original (UTF-16)
    const offsets: number[] = [];
    let offset = 0;
    for (const char of chars) {
        offsets.push(offset);
        offset += char.length;
    }
    offsets.push(offset);

    const matches: Array<[number, number]> = [];
    let from = 0;
    while (from <= haystack.length - needle.length) {
        const index = haystack.indexOf(needle, from);
        if (index === -1) break;
        matches.push([offsets[index], offsets[index + needle.length]]);
        from = index + needle.length;
    }
    return matches;
}

/**
 * Aplica el filtro de tipo y la búsqueda. Una búsqueda conserva el día entero si algo coincide
 * (texto del resumen, comentario o nombre del sector comentado).
 */
export function filterJournal(
    entries: readonly JournalEntry[],
    query: string,
    filter: JournalFilter,
    sectorName: (id: string) => string,
): JournalEntry[] {
    const needle = foldForSearch(query.trim());
    const result: JournalEntry[] = [];

    for (const entry of entries) {
        const summary = filter === "comments" ? undefined : entry.summary;
        const comments = filter === "summaries" ? [] : entry.comments;
        if (!summary && comments.length === 0) continue;

        if (needle) {
            const texts = [
                ...(summary ? SUMMARY_TEXT_FIELDS.map((field) => summary[field] ?? "") : []),
                ...comments.flatMap((c) => [c.text, sectorName(c.sectorId)]),
            ];
            if (!texts.some((text) => foldForSearch(text).includes(needle))) continue;
        }
        result.push({ date: entry.date, summary, comments });
    }
    return result;
}
