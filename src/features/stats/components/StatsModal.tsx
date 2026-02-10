import type { Dispatch, SetStateAction } from "react";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Sector, StatsVisibility } from "../../../shared/types/mentalWheel";
import type { ThemeClasses } from "../../../shared/types/theme";
import { rgbToHex } from "../../../shared/utils/color";
import type { StatsData } from "../types/stats";
import { getSectorSeriesKey } from "../utils/sectorSeriesKey";

interface StatsModalProps {
    statsOpen: boolean;
    setStatsOpen: Dispatch<SetStateAction<boolean>>;
    theme: ThemeClasses;
    darkMode: boolean;
    statsData: StatsData;
    statsVisibility: StatsVisibility;
    selectedSectorId: string;
    setSelectedSectorId: Dispatch<SetStateAction<string>>;
    sectors: Sector[];
    visibleSectors: Record<string, boolean>;
    setVisibleSectors: Dispatch<SetStateAction<Record<string, boolean>>>;
}

export function StatsModal({
    statsOpen,
    setStatsOpen,
    theme,
    darkMode,
    statsData,
    statsVisibility,
    selectedSectorId,
    setSelectedSectorId,
    sectors,
    visibleSectors,
    setVisibleSectors,
}: StatsModalProps) {
    return (
        <>
            {/* Modal de Estadísticas */}
            {statsOpen && (
                <>
                    <div
                        className={`fixed inset-0 ${theme.overlay} z-50 transition-opacity`}
                        onClick={() => setStatsOpen(false)}
                    />
                    <div className={`fixed inset-4 md:inset-8 lg:inset-16 ${theme.cardSolid} shadow-2xl z-50 rounded-2xl overflow-hidden flex flex-col`}>
                        {/* Header del modal */}
                        <div className={`flex items-center justify-between p-4 md:p-6 border-b ${theme.borderLight}`}>
                            <div>
                                <h2 className={`text-xl md:text-2xl font-bold ${theme.text}`}>📊 Estadísticas y Progreso</h2>
                                <p className={`text-xs md:text-sm ${theme.textMuted} mt-1`}>
                                    {statsData.totalDays} días registrados · Racha actual: {statsData.currentStreak} días
                                </p>
                            </div>
                            <button
                                onClick={() => setStatsOpen(false)}
                                className={`rounded-full p-2 ${theme.buttonPrimary} transition-colors`}
                            >
                                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {/* Contenido con scroll */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                            {statsData.dailyAverage.length === 0 ? (
                                <div className={`text-center py-12 ${theme.textMuted}`}>
                                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <p className="text-lg">No hay datos suficientes aún</p>
                                    <p className="text-sm mt-2">Comienza a registrar tus puntuaciones para ver estadísticas</p>
                                </div>
                            ) : (
                                <>
                                    {/* Gráfico 1: Media Diaria */}
                                    {statsVisibility.showDailyAverage && (
                                        <div className={`rounded-xl border ${theme.border} p-4 ${theme.inputAlt}`}>
                                            <h3 className={`text-base md:text-lg font-semibold mb-4 ${theme.text}`}>📈 Evolución de la Media Diaria</h3>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <AreaChart data={statsData.dailyAverage}>
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
                                                        domain={[0, 10]}
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: darkMode ? '#262626' : '#fff',
                                                            border: `1px solid ${darkMode ? '#404040' : '#e5e5e5'}`,
                                                            borderRadius: '8px'
                                                        }}
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
                                                <h3 className={`text-base md:text-lg font-semibold ${theme.text}`}>📊 Progresión por Sector</h3>
                                                <select
                                                    value={selectedSectorId}
                                                    onChange={(e) => setSelectedSectorId(e.target.value)}
                                                    className={`rounded-lg border ${theme.input} px-3 py-2 text-sm focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-neutral-100' : 'focus:ring-neutral-900'}`}
                                                >
                                                    {sectors.map(s => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <LineChart data={statsData.sectorProgress(selectedSectorId)}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                                                    <XAxis
                                                        dataKey="displayDate"
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <YAxis
                                                        domain={[0, 10]}
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: darkMode ? '#262626' : '#fff',
                                                            border: `1px solid ${darkMode ? '#404040' : '#e5e5e5'}`,
                                                            borderRadius: '8px'
                                                        }}
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
                                    {statsVisibility.showLast7AllSectors && statsData.last7DaysAllSectors && (
                                        <div className={`rounded-xl border ${theme.border} p-4 ${theme.inputAlt}`}>
                                            <h3 className={`text-base md:text-lg font-semibold mb-4 ${theme.text}`}>📅 Evolución Últimos 7 Días - Comparativa</h3>

                                            <ResponsiveContainer width="100%" height={300}>
                                                <LineChart data={statsData.last7DaysAllSectors}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                                                    <XAxis
                                                        dataKey="displayDate"
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <YAxis
                                                        domain={[0, 10]}
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: darkMode ? '#262626' : '#fff',
                                                            border: `1px solid ${darkMode ? '#404040' : '#e5e5e5'}`,
                                                            borderRadius: '8px'
                                                        }}
                                                        formatter={(value: number | string, name: string) => [value, name]}
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
                                            <div className="mt-4 pt-4 border-t border-opacity-20" style={{ borderColor: theme.borderLight }}>
                                                <p className={`text-xs font-semibold mb-3 ${theme.textMuted}`}>Mostrar sectores:</p>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                                    {sectors.map(sector => (
                                                        <label
                                                            key={sector.id}
                                                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${visibleSectors[sector.id]
                                                                ? darkMode ? 'bg-neutral-700' : 'bg-neutral-100'
                                                                : darkMode ? 'bg-neutral-800' : 'bg-neutral-50'
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
                                            <h3 className={`text-base md:text-lg font-semibold mb-4 ${theme.text}`}>📊 Comparación: Actual vs Promedio Histórico</h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={statsData.sectorComparison}>
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
                                                        domain={[0, 10]}
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: darkMode ? '#262626' : '#fff',
                                                            border: `1px solid ${darkMode ? '#404040' : '#e5e5e5'}`,
                                                            borderRadius: '8px'
                                                        }}
                                                    />
                                                    <Legend />
                                                    <Bar dataKey="actual" fill="#82ca9d" name="Puntuación Actual" />
                                                    <Bar dataKey="promedio" fill="#8884d8" name="Promedio Histórico" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}

                                    {/* Gráfico 4: Tendencia Semanal */}
                                    {statsVisibility.showWeeklyTrend && (
                                        <div className={`rounded-xl border ${theme.border} p-4 ${theme.inputAlt}`}>
                                            <h3 className={`text-base md:text-lg font-semibold mb-4 ${theme.text}`}>📅 Promedio por Día de la Semana</h3>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <BarChart data={statsData.weeklyData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                                                    <XAxis
                                                        dataKey="dia"
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <YAxis
                                                        domain={[0, 10]}
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: darkMode ? '#262626' : '#fff',
                                                            border: `1px solid ${darkMode ? '#404040' : '#e5e5e5'}`,
                                                            borderRadius: '8px'
                                                        }}
                                                    />
                                                    <Bar dataKey="media" fill="#ffc658" name="Media" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                            <p className={`text-xs ${theme.textMuted} mt-2 text-center`}>
                                                ¿Qué días de la semana tienes mejor desempeño?
                                            </p>
                                        </div>
                                    )}

                                    {/* Gráfico 5: Heat Map de Consistencia */}
                                    {statsVisibility.showHeatMap && (
                                        <div className={`rounded-xl border ${theme.border} p-4 ${theme.inputAlt}`}>
                                            <h3 className={`text-base md:text-lg font-semibold mb-4 ${theme.text}`}>🔥 Mapa de Calor - Últimos 60 Días</h3>
                                            <div className="grid lg:grid-cols-30 grid-cols-10 gap-1 sm:gap-2">
                                                {statsData.heatMapData.map((day, index) => {
                                                    const intensity = day.hasData ? Math.round((day.value / 10) * 4) : 0;
                                                    const colors = darkMode
                                                        ? ['#1a1a1a', '#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa']
                                                        : ['#f3f4f6', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa'];
                                                    return (
                                                        <div
                                                            key={index}
                                                            className="aspect-square rounded-sm relative group cursor-pointer"
                                                            style={{ backgroundColor: colors[intensity] }}
                                                            title={`${day.displayDate}: ${day.hasData ? day.value.toFixed(1) : 'Sin datos'}`}
                                                        >
                                                            <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 ${theme.cardSolid} px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border ${theme.border}`}>
                                                                {day.displayDate}: {day.hasData ? day.value.toFixed(1) : 'N/A'}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="flex items-center justify-between mt-4 text-xs">
                                                <span className={theme.textMuted}>Menos</span>
                                                <div className="flex gap-1">
                                                    {[0, 1, 2, 3, 4].map(i => {
                                                        const colors = darkMode
                                                            ? ['#1a1a1a', '#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa']
                                                            : ['#f3f4f6', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa'];
                                                        return (
                                                            <div
                                                                key={i}
                                                                className="w-4 h-4 rounded-sm"
                                                                style={{ backgroundColor: colors[i] }}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                                <span className={theme.textMuted}>Más</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Resumen de Insights */}
                                    {statsVisibility.showInsights && (
                                        <div className={`rounded-xl border ${theme.border} p-4 ${theme.inputAlt}`}>
                                            <h3 className={`text-base md:text-lg font-semibold mb-3 ${theme.text}`}>💡 Insights</h3>
                                            <div className="space-y-2 text-sm">
                                                {(() => {
                                                    const lastAvg = statsData.dailyAverage[statsData.dailyAverage.length - 1]?.media || 0;
                                                    const firstAvg = statsData.dailyAverage[0]?.media || 0;
                                                    const trend = lastAvg - firstAvg;

                                                    const bestSectorToday = statsData.todaySectorScores.reduce((prev, current) =>
                                                        current.score > prev.score ? current : prev
                                                    );

                                                    const worstSectorToday = statsData.todaySectorScores.reduce((prev, current) =>
                                                        current.score < prev.score ? current : prev
                                                    );

                                                    const bestSectorHistorical = statsData.historicalSectorScores.reduce((prev, current) =>
                                                        current.score > prev.score ? current : prev
                                                    );

                                                    const worstSectorHistorical = statsData.historicalSectorScores.reduce((prev, current) =>
                                                        current.score < prev.score ? current : prev
                                                    );

                                                    const bestWeekDay = statsData.weeklyData.reduce((prev, current) =>
                                                        current.media > prev.media ? current : prev
                                                    );

                                                    return (
                                                        <>
                                                            <div className={`p-3 rounded-lg ${darkMode ? 'bg-neutral-700' : 'bg-neutral-100'}`}>
                                                                <p className={theme.text}>
                                                                    <span className="font-semibold">Tendencia general:</span>{' '}
                                                                    {trend > 0 ? (
                                                                        <span className="text-green-500">↗ Mejorando (+{trend.toFixed(2)})</span>
                                                                    ) : trend < 0 ? (
                                                                        <span className="text-red-500">↘ Descendiendo ({trend.toFixed(2)})</span>
                                                                    ) : (
                                                                        <span className={theme.textMuted}>→ Estable</span>
                                                                    )}
                                                                </p>
                                                            </div>

                                                            <div className={`p-3 rounded-lg ${darkMode ? 'bg-neutral-700' : 'bg-neutral-100'}`}>
                                                                <p className={theme.text}>
                                                                    <span className="font-semibold">Tu sector más fuerte:</span>
                                                                    <br />
                                                                    <span className={`text-xs ${theme.textMuted}`}>Hoy:</span> {bestSectorToday.sector} ({bestSectorToday.score}/10)
                                                                    <br />
                                                                    <span className={`text-xs ${theme.textMuted}`}>Histórico:</span> {bestSectorHistorical.sector} ({bestSectorHistorical.score}/10)
                                                                </p>
                                                            </div>

                                                            <div className={`p-3 rounded-lg ${darkMode ? 'bg-neutral-700' : 'bg-neutral-100'}`}>
                                                                <p className={theme.text}>
                                                                    <span className="font-semibold">Área de mejora:</span>
                                                                    <br />
                                                                    <span className={`text-xs ${theme.textMuted}`}>Hoy:</span> {worstSectorToday.sector} ({worstSectorToday.score}/10)
                                                                    <br />
                                                                    <span className={`text-xs ${theme.textMuted}`}>Histórico:</span> {worstSectorHistorical.sector} ({worstSectorHistorical.score}/10)
                                                                </p>
                                                            </div>

                                                            <div className={`p-3 rounded-lg ${darkMode ? 'bg-neutral-700' : 'bg-neutral-100'}`}>
                                                                <p className={theme.text}>
                                                                    <span className="font-semibold">Tu mejor día:</span>
                                                                    <br />
                                                                    <span className={`text-xs ${theme.textMuted}`}>De la semana:</span> {bestWeekDay.dia} ({bestWeekDay.media.toFixed(2)}/10 promedio)
                                                                    <br />
                                                                    {statsData.bestHistoricalDay && (
                                                                        <>
                                                                            <span className={`text-xs ${theme.textMuted}`}>Histórico:</span> {new Date(statsData.bestHistoricalDay.date).toLocaleDateString('es-ES', {
                                                                                day: '2-digit',
                                                                                month: 'long',
                                                                                year: 'numeric'
                                                                            })} ({statsData.bestHistoricalDay.media}/10)
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
