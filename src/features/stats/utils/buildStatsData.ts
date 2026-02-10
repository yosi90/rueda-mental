import type { Scores, ScoresByDate, Sector } from "../../../shared/types/mentalWheel";
import { toDisplayScore } from "../../../shared/utils/scoreScale";
import { formatDateInput } from "../../../shared/utils/date";
import type { Last7AllSectorsPoint, StatsData } from "../types/stats";
import { getSectorSeriesKey } from "./sectorSeriesKey";

interface BuildStatsDataParams {
    scoresByDate: ScoresByDate;
    sectors: Sector[];
    scores: Scores;
    todayStr: string;
    ringCount: number;
    isScaleInverted: boolean;
}

function calculateStreak(sortedDates: string[]): number {
    if (sortedDates.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = sortedDates.length - 1; i >= 0; i--) {
        const date = new Date(sortedDates[i]);
        date.setHours(0, 0, 0, 0);

        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - streak);

        if (date.getTime() === expectedDate.getTime()) {
            streak++;
        } else {
            break;
        }
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
}: BuildStatsDataParams): StatsData {
    const allDates = Object.keys(scoresByDate).sort();
    const mapScore = (score: number): number => toDisplayScore(score, ringCount, isScaleInverted);

    const firstDateWithData = allDates.find((date) => {
        const dayScores = scoresByDate[date];
        const values = Object.values(dayScores);
        return values.some((score) => score > 0);
    });

    const dates = firstDateWithData
        ? allDates.filter((date) => date >= firstDateWithData)
        : [];

    const dailyAverage = dates.map((date) => {
        const dayScores = scoresByDate[date];
        const values = Object.values(dayScores).map(mapScore);
        const avg = values.length > 0
            ? values.reduce((a, b) => a + b, 0) / values.length
            : 0;
        return {
            date,
            media: parseFloat(avg.toFixed(2)),
            displayDate: new Date(date).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "short",
            }),
        };
    });

    const sectorProgress = (sectorId: string) => {
        return dates.map((date) => {
            const score = mapScore(scoresByDate[date][sectorId] || 0);
            return {
                date,
                puntuacion: score,
                displayDate: new Date(date).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                }),
            };
        });
    };

    const sectorComparison = sectors.map((sector) => {
        const allScores = dates.map((date) => mapScore(scoresByDate[date][sector.id] || 0));
        const avg = allScores.length > 0
            ? allScores.reduce((a, b) => a + b, 0) / allScores.length
            : 0;
        const current = mapScore(scores[sector.id] || 0);
        return {
            sector: sector.name,
            actual: current,
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
        const allScores = dates
            .map((date) => scoresByDate[date][sector.id] || 0)
            .filter((s) => s > 0)
            .map(mapScore);
        const avg = allScores.length > 0
            ? allScores.reduce((a, b) => a + b, 0) / allScores.length
            : 0;
        return {
            sector: sector.name,
            score: parseFloat(avg.toFixed(2)),
        };
    });

    const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const weeklyData = weekDays.map((day, index) => {
        const daysData = dates.filter((date) => new Date(date).getDay() === index);
        const weekScores = daysData.flatMap((date) => Object.values(scoresByDate[date]).map(mapScore));
        const avg = weekScores.length > 0
            ? weekScores.reduce((a, b) => a + b, 0) / weekScores.length
            : 0;
        return {
            dia: day,
            media: parseFloat(avg.toFixed(2)),
        };
    });

    const heatMapData = dates.slice(-60).map((date) => {
        const dayScores = scoresByDate[date];
        const values = Object.values(dayScores).map(mapScore);
        const avg = values.length > 0
            ? values.reduce((a, b) => a + b, 0) / values.length
            : 0;
        const dayOfWeek = new Date(date).getDay();
        const weekNumber = Math.floor(dates.slice(-60).indexOf(date) / 7);
        return {
            date,
            displayDate: new Date(date).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "2-digit",
            }),
            value: parseFloat(avg.toFixed(2)),
            day: dayOfWeek,
            week: weekNumber,
            hasData: values.length > 0,
        };
    });

    const daysWithAverage = dailyAverage.filter((day) => day.media > 0);

    const bestHistoricalDay = daysWithAverage.length > 0
        ? daysWithAverage.reduce((prev, current) => (
            isScaleInverted
                ? (current.media < prev.media ? current : prev)
                : (current.media > prev.media ? current : prev)
        ))
        : null;

    const last7DaysAllSectors = () => {
        if (dates.length < 7) return null;

        const last7Dates = dates.slice(-7);
        const currentToday = formatDateInput(new Date());

        return last7Dates.map((date) => {
            const isToday = date === currentToday;
            const dataPoint: Last7AllSectorsPoint = {
                date,
                displayDate: isToday
                    ? "Hoy"
                    : new Date(date).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                    }),
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
        currentStreak: calculateStreak(dates),
    };
}
