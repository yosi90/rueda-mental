import { useId, type Dispatch, type SetStateAction } from "react";
import { theme } from "../../../shared/theme/theme";
import { useI18n } from "../../../shared/i18n/I18nContext";
import type { TranslationKey } from "../../../shared/i18n/translations";
import type { StatsVisibility } from "../../../shared/types/mentalWheel";
import { ToggleSwitch } from "../../../shared/components/ToggleSwitch";

interface StatsVisibilitySectionProps {
    statsVisibility: StatsVisibility;
    setStatsVisibility: Dispatch<SetStateAction<StatsVisibility>>;
}

type StatsToggleKey = Exclude<keyof StatsVisibility, "enabled">;

const STATS_VISIBILITY_OPTIONS: ReadonlyArray<{ key: StatsToggleKey; labelKey: TranslationKey }> = [
    { key: "showDailyAverage", labelKey: "statsVisibility.dailyAverage" },
    { key: "showMood", labelKey: "statsVisibility.mood" },
    { key: "showSectorProgress", labelKey: "statsVisibility.sectorProgress" },
    { key: "showLast7AllSectors", labelKey: "statsVisibility.last7" },
    { key: "showComparison", labelKey: "statsVisibility.comparison" },
    { key: "showWeeklyTrend", labelKey: "statsVisibility.weekly" },
    { key: "showHeatMap", labelKey: "statsVisibility.heatmap" },
    { key: "showInsights", labelKey: "statsVisibility.insights" },
] as const;

export function StatsVisibilitySection({
    statsVisibility,
    setStatsVisibility,
}: StatsVisibilitySectionProps) {
    const { t } = useI18n();
    const descId = useId();

    return (
        <div className={`mb-6 p-4 rounded-xl ${theme.inputAlt} ${theme.border} border`}>
            <div className="flex items-center justify-between mb-3">
                <div>
                    <div className={`text-lg font-semibold ${theme.text}`}>{t("statsVisibility.title")}</div>
                    <div id={descId} className={`text-xs ${theme.textLight}`}>
                        {t("statsVisibility.description")}
                    </div>
                </div>

                <ToggleSwitch
                    checked={statsVisibility.enabled}
                    onChange={(enabled) => setStatsVisibility((v) => ({ ...v, enabled }))}
                    label={t("statsVisibility.title")}
                    describedBy={descId}
                    title={t("statsVisibility.toggleTitle")}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {STATS_VISIBILITY_OPTIONS.map(({ key, labelKey }) => (
                    <label key={key} className={`flex items-center justify-between p-2 rounded-lg ${theme.card}`}>
                        <span className={`text-sm ${theme.text}`}>{t(labelKey)}</span>
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
