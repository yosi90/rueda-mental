import { useEffect, useState } from "react";
import { defaultSectors, genId, hslFor, translateDefaultSectorName } from "../features/sectors/utils/sectorUtils";
import type { Language } from "../shared/i18n/translations";
import type { ParsedBackup } from "../shared/services/io/backup";
import {
    loadComments,
    loadConfig,
    loadDailySummary,
    loadScores,
    saveComments,
    saveConfig,
    saveDailySummary,
    saveScores,
} from "../shared/services/storage/mentalWheelStorage";
import type {
    CommentsByDate,
    DailySummary,
    DailySummaryByDate,
    ScoresByDate,
    Sector,
} from "../shared/types/mentalWheel";

/** Copia de los datos del usuario para poder deshacer una acción. */
export interface DataSnapshot {
    sectors: Sector[];
    scoresByDate: ScoresByDate;
    commentsByDate: CommentsByDate;
    dailySummaryByDate: DailySummaryByDate;
}

export const EMPTY_DAILY_SUMMARY: DailySummary = { good: "", bad: "", howFacedBad: "" };

function withoutKey<T>(record: Record<string, T>, key: string): Record<string, T> {
    if (!(key in record)) return record;
    const copy = { ...record };
    delete copy[key];
    return copy;
}

/**
 * Datos del usuario (sectores, puntuaciones, comentarios y resúmenes por día),
 * su persistencia en localStorage y las operaciones para modificarlos.
 * Las puntuaciones son internas (anillo 1..10, 0 = sin nota); la escala visible se aplica fuera.
 */
export function useMentalWheelData(language: Language) {
    const [sectors, setSectors] = useState<Sector[]>(() => loadConfig() || defaultSectors(language));
    const [scoresByDate, setScoresByDate] = useState<ScoresByDate>(() => loadScores());
    const [commentsByDate, setCommentsByDate] = useState<CommentsByDate>(() => loadComments());
    const [dailySummaryByDate, setDailySummaryByDate] = useState<DailySummaryByDate>(() => loadDailySummary());

    useEffect(() => saveConfig(sectors), [sectors]);
    useEffect(() => saveScores(scoresByDate), [scoresByDate]);
    useEffect(() => saveComments(commentsByDate), [commentsByDate]);
    useEffect(() => saveDailySummary(dailySummaryByDate), [dailySummaryByDate]);

    // Los sectores por defecto cambian de nombre con el idioma; los personalizados se respetan.
    useEffect(() => {
        setSectors((prev) => {
            let changed = false;
            const translated = prev.map((sector) => {
                const name = translateDefaultSectorName(sector.name, language);
                if (name && name !== sector.name) {
                    changed = true;
                    return { ...sector, name };
                }
                return sector;
            });
            return changed ? translated : prev;
        });
    }, [language]);

    // --- Sectores ---
    function addSector(name: string): void {
        setSectors((prev) => [
            ...prev,
            { id: genId(), name: name.trim() || `Sector ${prev.length + 1}`, color: hslFor(prev.length) },
        ]);
    }

    function updateSector(id: string, patch: Partial<Omit<Sector, "id">>): void {
        setSectors((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    }

    function moveSector(id: string, direction: number): void {
        setSectors((prev) => {
            const from = prev.findIndex((s) => s.id === id);
            const to = from + direction;
            if (from < 0 || to < 0 || to >= prev.length) return prev;
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
    }

    /** Elimina el sector y todas sus puntuaciones y comentarios. */
    function deleteSector(id: string): void {
        setSectors((prev) => prev.filter((s) => s.id !== id));
        setScoresByDate((prev) => Object.fromEntries(
            Object.entries(prev).map(([date, day]) => [date, withoutKey(day, id)])
        ));
        setCommentsByDate((prev) => Object.fromEntries(
            Object.entries(prev)
                .map(([date, day]) => [date, withoutKey(day, id)] as const)
                .filter(([, day]) => Object.keys(day).length > 0)
        ));
    }

    // --- Puntuaciones ---
    function setScore(date: string, sectorId: string, rawScore: number): void {
        setScoresByDate((prev) => ({ ...prev, [date]: { ...prev[date], [sectorId]: rawScore } }));
    }

    /** Vuelve a un valor anterior (undefined = el sector no tenía puntuación ese día). */
    function restoreScore(date: string, sectorId: string, previous: number | undefined): void {
        setScoresByDate((prev) => {
            const day = previous === undefined
                ? withoutKey(prev[date] ?? {}, sectorId)
                : { ...prev[date], [sectorId]: previous };
            return Object.keys(day).length === 0 ? withoutKey(prev, date) : { ...prev, [date]: day };
        });
    }

    function copyScores(fromDate: string, toDate: string): void {
        setScoresByDate((prev) => ({ ...prev, [toDate]: { ...prev[fromDate] } }));
    }

    // --- Comentarios ---
    function getComment(date: string, sectorId: string): string {
        return commentsByDate[date]?.[sectorId] ?? "";
    }

    function setComment(date: string, sectorId: string, text: string): void {
        setCommentsByDate((prev) => ({ ...prev, [date]: { ...(prev[date] ?? {}), [sectorId]: text } }));
    }

    function deleteComment(date: string, sectorId: string): void {
        setCommentsByDate((prev) => {
            const day = withoutKey(prev[date] ?? {}, sectorId);
            return Object.keys(day).length === 0 ? withoutKey(prev, date) : { ...prev, [date]: day };
        });
    }

    // --- Resumen diario ---
    function setSummaryField(date: string, field: keyof DailySummary, text: string): void {
        setDailySummaryByDate((prev) => {
            const updated = { ...(prev[date] ?? EMPTY_DAILY_SUMMARY), [field]: text };
            const hasContent = Object.values(updated).some((value) => value.trim().length > 0);
            return hasContent ? { ...prev, [date]: updated } : withoutKey(prev, date);
        });
    }

    // --- Día completo, deshacer e importación ---
    function resetDay(date: string): void {
        setScoresByDate((prev) => withoutKey(prev, date));
        setCommentsByDate((prev) => withoutKey(prev, date));
        setDailySummaryByDate((prev) => withoutKey(prev, date));
    }

    function takeSnapshot(): DataSnapshot {
        return { sectors, scoresByDate, commentsByDate, dailySummaryByDate };
    }

    function restoreSnapshot(snapshot: DataSnapshot): void {
        setSectors(snapshot.sectors);
        setScoresByDate(snapshot.scoresByDate);
        setCommentsByDate(snapshot.commentsByDate);
        setDailySummaryByDate(snapshot.dailySummaryByDate);
    }

    function importData(backup: ParsedBackup): void {
        if (backup.config) setSectors(backup.config);
        if (backup.scoresByDate) setScoresByDate(backup.scoresByDate);
        if (backup.commentsByDate) setCommentsByDate(backup.commentsByDate);
        if (backup.dailySummaryByDate) setDailySummaryByDate(backup.dailySummaryByDate);
    }

    return {
        sectors,
        scoresByDate,
        commentsByDate,
        dailySummaryByDate,
        addSector,
        updateSector,
        moveSector,
        deleteSector,
        setScore,
        restoreScore,
        copyScores,
        getComment,
        setComment,
        deleteComment,
        setSummaryField,
        resetDay,
        takeSnapshot,
        restoreSnapshot,
        importData,
    };
}

export type MentalWheelData = ReturnType<typeof useMentalWheelData>;
