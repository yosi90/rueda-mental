import { useId, useRef, type Dispatch, type SetStateAction } from "react";
import { chartTooltipStyle, theme } from "../../../shared/theme/theme";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useI18n } from "../../../shared/i18n/I18nContext";
import type { Sector, StatsVisibility } from "../../../shared/types/mentalWheel";
import { rgbToHex } from "../../../shared/utils/color";
import { isBetterScore, toDisplayScore, toRawScore } from "../../../shared/utils/scoreScale";
import { parseDateInput } from "../../../shared/utils/date";
import type { StatsData } from "../types/stats";
import { getSectorSeriesKey } from "../utils/sectorSeriesKey";
import { useDialogA11y } from "../../../shared/hooks/useDialogA11y";
import { CloseIcon } from "../../../shared/components/CloseIcon";

interface StatsModalProps {
    statsOpen: boolean;
    setStatsOpen: Dispatch<SetStateAction<boolean>>;
    statsData: StatsData;
    statsVisibility: StatsVisibility;
    ringCount: number;
    isScaleInverted: boolean;
    selectedSectorId: string;
    setSelectedSectorId: Dispatch<SetStateAction<string>>;
    sectors: Sector[];
    visibleSectors: Record<string, boolean>;
    setVisibleSectors: Dispatch<SetStateAction<Record<string, boolean>>>;
}

export function StatsModal({
    statsOpen,
    setStatsOpen,
    statsData,
    statsVisibility,
    ringCount,
    isScaleInverted,
    selectedSectorId,
    setSelectedSectorId,
    sectors,
    visibleSectors,
    setVisibleSectors,
}: StatsModalProps) {
    const { t, locale } = useI18n();
    const dialogRef = useRef<HTMLDivElement>(null);
    const titleId = useId();
    useDialogA11y(statsOpen, () => setStatsOpen(false), dialogRef);
    const yAxisDomain: [number, number] = [0, ringCount];
    const nonZeroTodayScores = statsData.todaySectorScores.filter((item) => item.score > 0);
    const todayScoresForInsights = nonZeroTodayScores.length > 0 ? nonZeroTodayScores : statsData.todaySectorScores;
    const nonZeroHistoricalScores = statsData.historicalSectorScores.filter((item) => item.score > 0);
    const historicalScoresForInsights = nonZeroHistoricalScores.length > 0 ? nonZeroHistoricalScores : statsData.historicalSectorScores;
    const nonZeroWeeklyScores = statsData.weeklyData.filter((item) => item.media > 0);
    const weeklyScoresForInsights = nonZeroWeeklyScores.length > 0 ? nonZeroWeeklyScores : statsData.weeklyData;
    const scaleLabel = `/` + ringCount;
    const toChartScore = (score: number): number => toRawScore(score, ringCount, isScaleInverted);
    const formatChartAxisTick = (value: number): string => {
        if (isScaleInverted && value <= 0) {
            return String(ringCount);
        }
        const displayValue = toDisplayScore(value, ringCount, isScaleInverted);
        return Number.isInteger(displayValue) ? String(displayValue) : displayValue.toFixed(1);
    };
    const formatChartTooltipValue = (value: number | string, name: string): [string | number, string] => {
        if (typeof value !== "number") return [value, name];
        const displayValue = toDisplayScore(value, ringCount, isScaleInverted);
        const formattedValue = Number.isInteger(displayValue) ? displayValue : Number(displayValue.toFixed(2));
        return [formattedValue, name];
    };

    const dailyAverageChartData = statsData.dailyAverage.map((point) => ({
        ...point,
        media: toChartScore(point.media),
    }));

    const sectorProgressChartData = statsData.sectorProgress(selectedSectorId).map((point) => ({
        ...point,
        puntuacion: toChartScore(point.puntuacion),
    }));

    const last7ChartData = statsData.last7DaysAllSectors?.map((point) => {
        const convertedPoint = { ...point };
        sectors.forEach((sector) => {
            const key = getSectorSeriesKey(sector.id);
            const value = point[key];
            if (typeof value === "number") {
                convertedPoint[key] = toChartScore(value);
            }
        });
        return convertedPoint;
    }) ?? null;

    const sectorComparisonChartData = statsData.sectorComparison.map((point) => ({
        ...point,
        actual: toChartScore(point.actual),
        promedio: toChartScore(point.promedio),
    }));

    const weeklyChartData = statsData.weeklyData.map((point) => ({
        ...point,
        media: toChartScore(point.media),
    }));

    return (
        <>
            {/* Modal de Estadísticas */}
            {statsOpen && (
                <>
                    <div
                        className={`fixed inset-0 ${theme.overlay} z-50 transition-opacity`}
                        onClick={() => setStatsOpen(false)}
                        aria-hidden="true"
                    />
                    <div
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={titleId}
                        tabIndex={-1}
                        className={`fixed inset-4 md:inset-8 lg:inset-16 ${theme.cardSolid} shadow-2xl z-50 rounded-2xl overflow-hidden flex flex-col outline-none`}
                    >
                        {/* Header del modal */}
                        <div className={`flex items-center justify-between p-4 md:p-6 border-b ${theme.borderLight}`}>
                            <div>
                                <h2 id={titleId} className={`text-xl md:text-2xl font-bold ${theme.text}`}>{t("stats.title")}</h2>
                                <p className={`text-xs md:text-sm ${theme.textMuted} mt-1`}>
                                    {t("stats.subtitle", { days: statsData.totalDays, streak: statsData.currentStreak })}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setStatsOpen(false)}
                                className={`rounded-full p-2 ${theme.buttonPrimary} transition-colors`}
                                title={t("common.close")}
                                aria-label={t("common.close")}
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        {/* Contenido con scroll */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                            {statsData.dailyAverage.length === 0 ? (
                                <div className={`text-center py-12 ${theme.textMuted}`}>
                                    <svg aria-hidden="true" className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <p className="text-lg">{t("stats.noDataTitle")}</p>
                                    <p className="text-sm mt-2">{t("stats.noDataDesc")}</p>
                                </div>
                            ) : (
                                <>
                                    {/* Gráfico 1: Media Diaria */}
                                    {statsVisibility.showDailyAverage && (
                                        <div className={`rounded-xl border ${theme.border} p-4 ${theme.inputAlt}`}>
                                            <h3 className={`text-base md:text-lg font-semibold mb-4 ${theme.text}`}>{t("stats.dailyAverageChart")}</h3>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <AreaChart data={dailyAverageChartData}>
                                                    <defs>
                                                        <linearGradient id="colorMedia" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                                                    <XAxis
                                                        dataKey="displayDate"
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <YAxis
                                                        domain={yAxisDomain}
                                                        tickFormatter={formatChartAxisTick}
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <Tooltip
                                                        formatter={formatChartTooltipValue}
                                                        contentStyle={chartTooltipStyle}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="media"
                                                        stroke="#8884d8"
                                                        fillOpacity={1}
                                                        fill="url(#colorMedia)"
                                                        strokeWidth={2}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}

                                    {/* Gráfico 2: Progresión por Sector */}
                                    {statsVisibility.showSectorProgress && (
                                        <div className={`rounded-xl border ${theme.border} p-4 ${theme.inputAlt}`}>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                                <h3 className={`text-base md:text-lg font-semibold ${theme.text}`}>{t("stats.sectorProgressChart")}</h3>
                                                <select
                                                    value={selectedSectorId}
                                                    onChange={(e) => setSelectedSectorId(e.target.value)}
                                                    className={`rounded-lg border ${theme.input} px-3 py-2 text-sm ${theme.focusRing}`}
                                                >
                                                    {sectors.map(s => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <LineChart data={sectorProgressChartData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                                                    <XAxis
                                                        dataKey="displayDate"
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <YAxis
                                                        domain={yAxisDomain}
                                                        tickFormatter={formatChartAxisTick}
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <Tooltip
                                                        formatter={formatChartTooltipValue}
                                                        contentStyle={chartTooltipStyle}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="puntuacion"
                                                        stroke={sectors.find(s => s.id === selectedSectorId)?.color || "#8884d8"}
                                                        strokeWidth={3}
                                                        dot={{ r: 4 }}
                                                        activeDot={{ r: 6 }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}

                                    {/* Gráfico: Últimos 7 Días - Todos los Sectores */}
                                    {statsVisibility.showLast7AllSectors && last7ChartData && (
                                        <div className={`rounded-xl border ${theme.border} p-4 ${theme.inputAlt}`}>
                                            <h3 className={`text-base md:text-lg font-semibold mb-4 ${theme.text}`}>{t("stats.last7Chart")}</h3>

                                            <ResponsiveContainer width="100%" height={300}>
                                                <LineChart data={last7ChartData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                                                    <XAxis
                                                        dataKey="displayDate"
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <YAxis
                                                        domain={yAxisDomain}
                                                        tickFormatter={formatChartAxisTick}
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <Tooltip
                                                        formatter={formatChartTooltipValue}
                                                        contentStyle={chartTooltipStyle}
                                                    />
                                                    <Legend />
                                                    {sectors.filter(s => visibleSectors[s.id]).map(sector => (
                                                        <Line
                                                            key={sector.id}
                                                            type="monotone"
                                                            dataKey={getSectorSeriesKey(sector.id)}
                                                            stroke={rgbToHex(sector.color)}
                                                            strokeWidth={2}
                                                            dot={{ r: 4, fill: rgbToHex(sector.color) }}
                                                            activeDot={{ r: 6 }}
                                                            name={sector.name}
                                                        />
                                                    ))}
                                                </LineChart>
                                            </ResponsiveContainer>

                                            {/* Checkboxes para mostrar/ocultar sectores */}
                                            <div className={`mt-4 pt-4 border-t ${theme.borderLight}`}>
                                                <p className={`text-xs font-semibold mb-3 ${theme.textMuted}`}>{t("stats.showSectors")}</p>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                                    {sectors.map(sector => (
                                                        <label
                                                            key={sector.id}
                                                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${visibleSectors[sector.id]
                                                                ? "bg-neutral-100 dark:bg-neutral-700"
                                                                : "bg-neutral-50 dark:bg-neutral-800"
                                                                }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={visibleSectors[sector.id] || false}
                                                                onChange={(e) => {
                                                                    setVisibleSectors(prev => ({
                                                                        ...prev,
                                                                        [sector.id]: e.target.checked
                                                                    }));
                                                                }}
                                                                className="w-4 h-4 cursor-pointer"
                                                                style={{ accentColor: rgbToHex(sector.color) }}
                                                            />
                                                            <div className="flex items-center gap-1 flex-1 min-w-0">
                                                                <div
                                                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                                                    style={{ backgroundColor: rgbToHex(sector.color) }}
                                                                />
                                                                <span className={`text-xs truncate ${theme.text}`}>
                                                                    {sector.name}
                                                                </span>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Gráfico 3: Comparación de Sectores */}
                                    {statsVisibility.showComparison && (
                                        <div className={`rounded-xl border ${theme.border} p-4 ${theme.inputAlt}`}>
                                            <h3 className={`text-base md:text-lg font-semibold mb-4 ${theme.text}`}>{t("stats.comparisonChart")}</h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={sectorComparisonChartData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                                                    <XAxis
                                                        dataKey="sector"
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '11px' }}
                                                        angle={-45}
                                                        textAnchor="end"
                                                        height={80}
                                                    />
                                                    <YAxis
                                                        domain={yAxisDomain}
                                                        tickFormatter={formatChartAxisTick}
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <Tooltip
                                                        formatter={formatChartTooltipValue}
                                                        contentStyle={chartTooltipStyle}
                                                    />
                                                    <Legend />
                                                    <Bar dataKey="actual" fill="#82ca9d" name={t("stats.actualLabel")} />
                                                    <Bar dataKey="promedio" fill="#8884d8" name={t("stats.historicalAverageLabel")} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}

                                    {/* Gráfico 4: Tendencia Semanal */}
                                    {statsVisibility.showWeeklyTrend && (
                                        <div className={`rounded-xl border ${theme.border} p-4 ${theme.inputAlt}`}>
                                            <h3 className={`text-base md:text-lg font-semibold mb-4 ${theme.text}`}>{t("stats.weeklyChart")}</h3>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <BarChart data={weeklyChartData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                                                    <XAxis
                                                        dataKey="dia"
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <YAxis
                                                        domain={yAxisDomain}
                                                        tickFormatter={formatChartAxisTick}
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <Tooltip
                                                        formatter={formatChartTooltipValue}
                                                        contentStyle={chartTooltipStyle}
                                                    />
                                                    <Bar dataKey="media" fill="#ffc658" name={t("stats.insightsAverageSuffix")} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                            <p className={`text-xs ${theme.textMuted} mt-2 text-center`}>
                                                {t("stats.weeklyQuestion")}
                                            </p>
                                        </div>
                                    )}

                                    {/* Gráfico 5: Heat Map de Consistencia */}
                                    {statsVisibility.showHeatMap && (
                                        <div className={`rounded-xl border ${theme.border} p-4 ${theme.inputAlt}`}>
                                            <h3 className={`text-base md:text-lg font-semibold mb-4 ${theme.text}`}>{t("stats.heatMapChart")}</h3>
                                            <div className="grid lg:grid-cols-30 grid-cols-10 gap-1 sm:gap-2">
                                                {statsData.heatMapData.map((day) => {
                                                    // Niveles 1-4 solo para días con datos (mejor puntuación = color más intenso)
                                                    const level = day.hasData
                                                        ? 1 + Math.round((toRawScore(day.value, ringCount, isScaleInverted) / ringCount) * 3)
                                                        : 0;
                                                    const label = `${day.displayDate}: ${day.hasData ? day.value.toFixed(1) : t("stats.noDataShort")}`;
                                                    return (
                                                        <div
                                                            key={day.date}
                                                            className={`aspect-square rounded-sm relative group ${level === 0 ? "border border-dashed border-neutral-300 dark:border-neutral-600" : ""}`}
                                                            style={level > 0 ? { backgroundColor: `var(--heat-${level})` } : undefined}
                                                            title={label}
                                                        >
                                                            <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 ${theme.cardSolid} px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border ${theme.border}`} aria-hidden="true">
                                                                {label}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 text-xs">
                                                <span className={`inline-flex items-center gap-1.5 ${theme.textMuted}`}>
                                                    <span className="w-4 h-4 rounded-sm border border-dashed border-neutral-300 dark:border-neutral-600" aria-hidden="true" />
                                                    {t("stats.noDataShort")}
                                                </span>
                                                <span className="inline-flex items-center gap-2">
                                                    <span className={theme.textMuted}>{t("stats.worst")}</span>
                                                    <span className="flex gap-1" aria-hidden="true">
                                                        {[1, 2, 3, 4].map((level) => (
                                                            <span key={level} className="w-4 h-4 rounded-sm" style={{ backgroundColor: `var(--heat-${level})` }} />
                                                        ))}
                                                    </span>
                                                    <span className={theme.textMuted}>{t("stats.best")}</span>
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Resumen de Insights */}
                                    {statsVisibility.showInsights && (
                                        <div className={`rounded-xl border ${theme.border} p-4 ${theme.inputAlt}`}>
                                            <h3 className={`text-base md:text-lg font-semibold mb-3 ${theme.text}`}>{t("statsVisibility.insights")}</h3>
                                            <div className="space-y-2 text-sm">
                                                {(() => {
                                                    if (
                                                        todayScoresForInsights.length === 0 ||
                                                        historicalScoresForInsights.length === 0 ||
                                                        weeklyScoresForInsights.length === 0
                                                    ) {
                                                        return (
                                                            <div className={`p-3 rounded-lg ${theme.subtle} ${theme.textMuted}`}>
                                                                {t("stats.insightsEmpty")}
                                                            </div>
                                                        );
                                                    }

                                                    const dailyAverageForTrend = statsData.dailyAverage.filter((item) => item.media > 0);
                                                    const lastAvg = dailyAverageForTrend[dailyAverageForTrend.length - 1]?.media || 0;
                                                    const firstAvg = dailyAverageForTrend[0]?.media || 0;
                                                    const performanceTrend = isScaleInverted ? firstAvg - lastAvg : lastAvg - firstAvg;

                                                    const bestSectorToday = todayScoresForInsights.reduce((prev, current) =>
                                                        isBetterScore(current.score, prev.score, isScaleInverted) ? current : prev
                                                    );

                                                    const worstSectorToday = todayScoresForInsights.reduce((prev, current) =>
                                                        isBetterScore(current.score, prev.score, !isScaleInverted) ? current : prev
                                                    );

                                                    const bestSectorHistorical = historicalScoresForInsights.reduce((prev, current) =>
                                                        isBetterScore(current.score, prev.score, isScaleInverted) ? current : prev
                                                    );

                                                    const worstSectorHistorical = historicalScoresForInsights.reduce((prev, current) =>
                                                        isBetterScore(current.score, prev.score, !isScaleInverted) ? current : prev
                                                    );

                                                    const bestWeekDay = weeklyScoresForInsights.reduce((prev, current) =>
                                                        isBetterScore(current.media, prev.media, isScaleInverted) ? current : prev
                                                    );

                                                    return (
                                                        <>
                                                            <div className={`p-3 rounded-lg ${theme.subtle}`}>
                                                                <p className={theme.text}>
                                                                    <span className="font-semibold">{t("stats.insightsTrend")}</span>{' '}
                                                                    {performanceTrend > 0 ? (
                                                                        <span className="text-green-500">{t("stats.insightsImproving", { value: performanceTrend.toFixed(2) })}</span>
                                                                    ) : performanceTrend < 0 ? (
                                                                        <span className="text-red-500">{t("stats.insightsDeclining", { value: performanceTrend.toFixed(2) })}</span>
                                                                    ) : (
                                                                        <span className={theme.textMuted}>{t("stats.insightsStable")}</span>
                                                                    )}
                                                                </p>
                                                            </div>

                                                            <div className={`p-3 rounded-lg ${theme.subtle}`}>
                                                                <p className={theme.text}>
                                                                    <span className="font-semibold">{t("stats.insightsBestSector")}</span>
                                                                    <br />
                                                                    <span className={`text-xs ${theme.textMuted}`}>{t("stats.insightsToday")}</span> {bestSectorToday.sector} ({bestSectorToday.score}{scaleLabel})
                                                                    <br />
                                                                    <span className={`text-xs ${theme.textMuted}`}>{t("stats.insightsHistorical")}</span> {bestSectorHistorical.sector} ({bestSectorHistorical.score}{scaleLabel})
                                                                </p>
                                                            </div>

                                                            <div className={`p-3 rounded-lg ${theme.subtle}`}>
                                                                <p className={theme.text}>
                                                                    <span className="font-semibold">{t("stats.insightsAreaToImprove")}</span>
                                                                    <br />
                                                                    <span className={`text-xs ${theme.textMuted}`}>{t("stats.insightsToday")}</span> {worstSectorToday.sector} ({worstSectorToday.score}{scaleLabel})
                                                                    <br />
                                                                    <span className={`text-xs ${theme.textMuted}`}>{t("stats.insightsHistorical")}</span> {worstSectorHistorical.sector} ({worstSectorHistorical.score}{scaleLabel})
                                                                </p>
                                                            </div>

                                                            <div className={`p-3 rounded-lg ${theme.subtle}`}>
                                                                <p className={theme.text}>
                                                                    <span className="font-semibold">{t("stats.insightsBestDay")}</span>
                                                                    <br />
                                                                    <span className={`text-xs ${theme.textMuted}`}>{t("stats.insightsWeekday")}</span> {bestWeekDay.dia} ({bestWeekDay.media.toFixed(2)}{scaleLabel} {t("stats.insightsAverageSuffix")})
                                                                    <br />
                                                                    {statsData.bestHistoricalDay && (
                                                                        <>
                                                                            <span className={`text-xs ${theme.textMuted}`}>{t("stats.insightsHistorical")}</span> {parseDateInput(statsData.bestHistoricalDay.date).toLocaleDateString(locale, {
                                                                                day: '2-digit',
                                                                                month: 'long',
                                                                                year: 'numeric'
                                                                            })} ({statsData.bestHistoricalDay.media}{scaleLabel})
                                                                        </>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
