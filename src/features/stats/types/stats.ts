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
}