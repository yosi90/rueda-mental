import type { Dispatch, SetStateAction } from "react";
import type { StatsVisibility } from "../../../shared/types/mentalWheel";
import type { ThemeClasses } from "../../../shared/types/theme";

interface StatsVisibilitySectionProps {
    theme: Pick<ThemeClasses, "inputAlt" | "border" | "text" | "textLight" | "card">;
    statsVisibility: StatsVisibility;
    setStatsVisibility: Dispatch<SetStateAction<StatsVisibility>>;
}

type StatsToggleKey = Exclude<keyof StatsVisibility, "enabled">;

const STATS_VISIBILITY_OPTIONS: ReadonlyArray<{ key: StatsToggleKey; label: string }> = [
    { key: "showDailyAverage", label: "📈 Evolución de la Media Diaria" },
    { key: "showSectorProgress", label: "📊 Progresión por Sector" },
    { key: "showLast7AllSectors", label: "📅 Últimos 7 días (comparativa)" },
    { key: "showComparison", label: "📊 Comparación Actual vs Promedio" },
    { key: "showWeeklyTrend", label: "📅 Promedio por día de la semana" },
    { key: "showHeatMap", label: "🔥 Heatmap (60 días)" },
    { key: "showInsights", label: "💡 Insights" },
] as const;

export function StatsVisibilitySection({
    theme,
    statsVisibility,
    setStatsVisibility,
}: StatsVisibilitySectionProps) {
    return (
        <div className={`mb-6 p-4 rounded-xl ${theme.inputAlt} ${theme.border} border`}>
            <div className="flex items-center justify-between mb-3">
                <div>
                    <div className={`text-lg font-semibold ${theme.text}`}>Estadísticas</div>
                    <div className={`text-xs ${theme.textLight}`}>
                        Alterna la visibilidad de las estadísticas
                    </div>
                </div>

                <button
                    onClick={() =>
                        setStatsVisibility((v) => ({ ...v, enabled: !v.enabled }))
                    }
                    className={`relative inline-flex h-8 w-14 items-center justify-start rounded-full transition-colors ${statsVisibility.enabled ? "bg-green-500/70" : "bg-neutral-400/60"} padding-esp`}
                    title="Desactivar todo (oculta el botón de estadísticas)"
                >
                    <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${statsVisibility.enabled ? "translate-x-6" : "translate-x-0"}`}
                    />
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {STATS_VISIBILITY_OPTIONS.map(({ key, label }) => (
                    <label key={key} className={`flex items-center justify-between p-2 rounded-lg ${theme.card}`}>
                        <span className={`text-sm ${theme.text}`}>{label}</span>
                        <input
                            type="checkbox"
                            checked={statsVisibility[key]}
                            disabled={!statsVisibility.enabled}
                            onChange={(e) =>
                                setStatsVisibility((v) => ({ ...v, [key]: e.target.checked }))
                            }
                            className="h-4 w-4 cursor-pointer"
                        />
                    </label>
                ))}
            </div>
        </div>
    );
}
