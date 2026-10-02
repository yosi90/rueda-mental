import type { Scores, ScoresByDate, Sector } from "../../../shared/types/mentalWheel";
import { toDisplayScore } from "../../../shared/utils/scoreScale";
import { addDaysToDateInput, parseDateInput } from "../../../shared/utils/date";
import type { Last7AllSectorsPoint, StatsData } from "../types/stats";
import { getSectorSeriesKey } from "./sectorSeriesKey";

interface BuildStatsDataParams {
    scoresByDate: ScoresByDate;
    sectors: Sector[];
    scores: Scores;
    todayStr: string;
    ringCount: number;
    isScaleInverted: boolean;
    locale: string;
    weekDaysShort: [string, string, string, string, string, string, string];
    todayLabel: string;
}

const HEAT_MAP_DAYS = 60;

function hasScores(dayScores: Scores | undefined): boolean {
    return Boolean(dayScores) && Object.values(dayScores!).some((score) => score > 0);
}

function average(values: number[]): number {
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

// Días consecutivos con datos hasta hoy. Si hoy aún no hay datos, la racha se cuenta desde ayer.
export function calculateStreak(datesWithData: ReadonlySet<string>, todayStr: string): number {
    let cursor = datesWithData.has(todayStr) ? todayStr : addDaysToDateInput(todayStr, -1);
    let streak = 0;
    while (datesWithData.has(cursor)) {
        streak++;
        cursor = addDaysToDateInput(cursor, -1);
    }
    return streak;
}

export function buildStatsData({
    scoresByDate,
    sectors,
    scores,
    todayStr,
    ringCount,
    isScaleInverted,
    locale,
    weekDaysShort,
    todayLabel,
}: BuildStatsDataParams): StatsData {
    const mapScore = (score: number): number => toDisplayScore(score, ringCount, isScaleInverted);
    const formatShort = (date: string): string => parseDateInput(date).toLocaleDateString(locale, {
        day: "2-digit",
        month: "short",
    });
    // Media de un día: solo sectores puntuados (0 = sin nota).
    const dayAverage = (date: string): number => average(
        Object.values(scoresByDate[date] ?? {}).filter((score) => score > 0).map(mapScore)
    );

    const dates = Object.keys(scoresByDate)
        .filter((date) => date <= todayStr && hasScores(scoresByDate[date]))
        .sort();
    const datesWithData = new Set(dates);

    const dailyAverage = dates.map((date) => ({
        date,
        media: parseFloat(dayAverage(date).toFixed(2)),
        displayDate: formatShort(date),
    }));

    const sectorProgress = (sectorId: string) => dates.map((date) => ({
        date,
        puntuacion: mapScore(scoresByDate[date][sectorId] || 0),
        displayDate: formatShort(date),
    }));

    const sectorComparison = sectors.map((sector) => {
        const avg = average(dates.map((date) => mapScore(scoresByDate[date][sector.id] || 0)));
        return {
            sector: sector.name,
            actual: mapScore(scores[sector.id] || 0),
            promedio: parseFloat(avg.toFixed(2)),
            color: sector.color,
        };
    });

    const todayScores = scoresByDate[todayStr] || {};
    const todaySectorScores = sectors.map((sector) => ({
        sector: sector.name,
        score: mapScore(todayScores[sector.id] || 0),
    }));

    const historicalSectorScores = sectors.map((sector) => {
        const avg = average(dates
            .map((date) => scoresByDate[date][sector.id] || 0)
            .filter((s) => s > 0)
            .map(mapScore));
        return {
            sector: sector.name,
            score: parseFloat(avg.toFixed(2)),
        };
    });

    const weeklyData = weekDaysShort.map((day, index) => {
        const weekScores = dates
            .filter((date) => parseDateInput(date).getDay() === index)
            .flatMap((date) => Object.values(scoresByDate[date]).filter((s) => s > 0).map(mapScore));
        return {
            dia: day,
            media: parseFloat(average(weekScores).toFixed(2)),
        };
    });

    // Últimos 60 días de calendario (incluidos los días sin registro) para ver la constancia.
    const heatMapData = Array.from({ length: HEAT_MAP_DAYS }, (_, index) => {
        const date = addDaysToDateInput(todayStr, index - (HEAT_MAP_DAYS - 1));
        const hasData = datesWithData.has(date);
        return {
            date,
            displayDate: parseDateInput(date).toLocaleDateString(locale, {
                day: "2-digit",
                month: "2-digit",
            }),
            value: hasData ? parseFloat(dayAverage(date).toFixed(2)) : 0,
            day: parseDateInput(date).getDay(),
            week: Math.floor(index / 7),
            hasData,
        };
    });

    const bestHistoricalDay = dailyAverage.length > 0
        ? dailyAverage.reduce((prev, current) => (
            isScaleInverted
                ? (current.media < prev.media ? current : prev)
                : (current.media > prev.media ? current : prev)
        ))
        : null;

    const last7DaysAllSectors = () => {
        if (dates.length < 7) return null;

        return dates.slice(-7).map((date) => {
            const isToday = date === todayStr;
            const dataPoint: Last7AllSectorsPoint = {
                date,
                displayDate: isToday ? todayLabel : formatShort(date),
                isToday,
            };

            sectors.forEach((sector) => {
                dataPoint[getSectorSeriesKey(sector.id)] = mapScore(scoresByDate[date][sector.id] || 0);
            });

            return dataPoint;
        });
    };

    return {
        todaySectorScores,
        historicalSectorScores,
        dailyAverage,
        sectorProgress,
        sectorComparison,
        weeklyData,
        heatMapData,
        bestHistoricalDay,
        last7DaysAllSectors: last7DaysAllSectors(),
        totalDays: dates.length,
        currentStreak: calculateStreak(datesWithData, todayStr),
    };
}
