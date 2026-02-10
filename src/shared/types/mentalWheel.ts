export interface Sector {
    id: string;
    name: string;
    color: string;
}

export interface SectorWithAngles extends Sector {
    a0: number;
    a1: number;
    mid: number;
    a0n: number;
    a1n: number;
}

export interface HoverInfo {
    sectorId: string;
    level: number;
}

export interface Scores {
    [key: string]: number;
}

export interface ScoresByDate {
    [key: string]: Scores;
}

export interface InfoMenuContextual {
    idSector: string;
    x: number;
    y: number;
}

export interface CommentsByDate {
    [date: string]: { [sectorId: string]: string };
}

export interface DailySummary {
    good: string;
    bad: string;
    howFacedBad: string;
}

export interface DailySummaryByDate {
    [date: string]: DailySummary;
}

export type StatsVisibility = {
    enabled: boolean;
    showDailyAverage: boolean;
    showSectorProgress: boolean;
    showLast7AllSectors: boolean;
    showComparison: boolean;
    showWeeklyTrend: boolean;
    showHeatMap: boolean;
    showInsights: boolean;
};

export interface MentalWheelBackup {
    version?: number;
    config?: Sector[];
    scoresByDate?: ScoresByDate;
    commentsByDate?: CommentsByDate;
    dailySummaryByDate?: DailySummaryByDate;
    darkMode?: boolean;
    tutorialShown?: boolean;
    statsVisibility?: Partial<StatsVisibility>;
}
