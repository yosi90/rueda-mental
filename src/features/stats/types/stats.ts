export interface DailyAveragePoint {
    date: string;
    media: number;
    displayDate: string;
}

export interface SectorProgressPoint {
    date: string;
    puntuacion: number;
    displayDate: string;
}

export interface SectorComparisonPoint {
    sector: string;
    actual: number;
    promedio: number;
    color: string;
}

export interface SectorScorePoint {
    sector: string;
    score: number;
}

export interface WeeklyDataPoint {
    dia: string;
    media: number;
}

export interface HeatMapPoint {
    date: string;
    displayDate: string;
    value: number;
    day: number;
    week: number;
    hasData: boolean;
}

export interface BestHistoricalDay {
    date: string;
    media: number;
    displayDate: string;
}

export type Last7AllSectorsPoint = {
    date: string;
    displayDate: string;
    isToday: boolean;
} & Record<string, string | number | boolean>;

export interface MoodPoint {
    date: string;
    displayDate: string;
    /** 1 (muy mal) … 5 (muy bien). */
    mood: number;
    /** Media de la rueda ese día (escala visible), o null si no hay puntuaciones. */
    media: number | null;
}

export interface MoodRelationPoint {
    mood: number;
    /** Media de la rueda en los días con este estado de ánimo (escala visible). */
    media: number;
    days: number;
}

export interface StatsData {
    todaySectorScores: SectorScorePoint[];
    historicalSectorScores: SectorScorePoint[];
    dailyAverage: DailyAveragePoint[];
    sectorProgress: (sectorId: string) => SectorProgressPoint[];
    sectorComparison: SectorComparisonPoint[];
    weeklyData: WeeklyDataPoint[];
    heatMapData: HeatMapPoint[];
    bestHistoricalDay: BestHistoricalDay | null;
    last7DaysAllSectors: Last7AllSectorsPoint[] | null;
    totalDays: number;
    currentStreak: number;
    /** Días con estado de ánimo anotado (hasta hoy), en orden. */
    moodHistory: MoodPoint[];
    /** Media de la rueda por estado de ánimo (solo niveles con días puntuados). */
    moodRelation: MoodRelationPoint[];
}