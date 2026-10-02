import type { Dispatch, SetStateAction } from "react";
import { useI18n } from "../../../shared/i18n/I18nContext";
import type { Sector } from "../../../shared/types/mentalWheel";
import type { ThemeClasses } from "../../../shared/types/theme";
import { toDisplayScore } from "../../../shared/utils/scoreScale";
import { rgbToHex } from "../../../shared/utils/color";

interface SectorsSettingsSectionProps {
    theme: Pick<ThemeClasses, "text" | "textMuted" | "border" | "input" | "inputAlt" | "button" | "buttonPrimary">;
    darkMode: boolean;
    newName: string;
    setNewName: Dispatch<SetStateAction<string>>;
    addSector: () => void;
    sectors: Sector[];
    setSectors: Dispatch<SetStateAction<Sector[]>>;
    moveSector: (id: string, dir: number) => void;
    removeSector: (id: string) => void;
    scores: Record<string, number>;
    ringCount: number;
    setScore: (id: string, val: string | number) => void;
    isScaleInverted: boolean;
}

export function SectorsSettingsSection({
    theme,
    darkMode,
    newName,
    setNewName,
    addSector,
    sectors,
    setSectors,
    moveSector,
    removeSector,
    scores,
    ringCount,
    setScore,
    isScaleInverted,
}: SectorsSettingsSectionProps) {
    const { t } = useI18n();

    return (
        <div>
            <h3 className={`text-lg font-semibold mb-3 ${theme.text}`}>{t("sectors.title")}</h3>
            <div className="mb-4 flex gap-2">
                <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={t("sectors.newPlaceholder")}
                    aria-label={t("sectors.newPlaceholder")}
                    className={`flex-1 rounded-lg border ${theme.input} px-3 py-2 text-sm focus:outline-none focus:ring-2 ${darkMode ? "focus:ring-neutral-100" : "focus:ring-neutral-900"}`}
                    onKeyDown={(e) => e.key === "Enter" && addSector()}
                />
                <button type="button" onClick={addSector} className={`rounded-lg ${theme.buttonPrimary} px-4 py-2 text-sm transition-colors`}>
                    {t("sectors.add")}
                </button>
            </div>

            <ul className="flex flex-col gap-3">
                {sectors.map((s, i) => {
                    const displayedScore = toDisplayScore(scores[s.id] ?? 0, ringCount, isScaleInverted);
                    const iconButtonClass = `inline-flex items-center justify-center min-h-8 min-w-8 rounded-md border ${theme.border} ${theme.button} px-2 text-xs transition-colors flex-shrink-0 disabled:opacity-40`;

                    return (
                        <li key={s.id} className={`rounded-xl border ${theme.border} p-3 sm:p-4 ${theme.inputAlt}`}>
                            <div className="flex items-center gap-2 mb-3 flex-wrap sm:flex-nowrap">
                                <input
                                    type="color"
                                    value={rgbToHex(s.color)}
                                    onChange={(e) =>
                                        setSectors((prev) => prev.map((x) => (x.id === s.id ? { ...x, color: e.target.value } : x)))
                                    }
                                    title={t("common.color")}
                                    aria-label={`${t("common.color")}: ${s.name}`}
                                    className="h-8 w-8 cursor-pointer rounded-md border flex-shrink-0"
                                />
                                <input
                                    value={s.name}
                                    onChange={(e) =>
                                        setSectors((prev) => prev.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)))
                                    }
                                    aria-label={t("sectors.newPlaceholder")}
                                    className={`flex-1 min-w-0 rounded-lg border ${theme.input} px-2 sm:px-3 py-2 text-sm focus:outline-none focus:ring-2 ${darkMode ? "focus:ring-neutral-100" : "focus:ring-neutral-900"}`}
                                />
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => moveSector(s.id, -1)}
                                        className={iconButtonClass}
                                        disabled={i === 0}
                                        title={t("sectors.moveUp")}
                                        aria-label={`${t("sectors.moveUp")}: ${s.name}`}
                                    >
                                        <span aria-hidden="true">▲</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => moveSector(s.id, +1)}
                                        className={iconButtonClass}
                                        disabled={i === sectors.length - 1}
                                        title={t("sectors.moveDown")}
                                        aria-label={`${t("sectors.moveDown")}: ${s.name}`}
                                    >
                                        <span aria-hidden="true">▼</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeSector(s.id)}
                                        className={iconButtonClass}
                                        title={t("sectors.delete")}
                                        aria-label={`${t("sectors.delete")}: ${s.name}`}
                                    >
                                        <span aria-hidden="true">🗑️</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 sm:gap-2">
                                <span className={`text-xs ${theme.textMuted} w-16 sm:w-20 flex-shrink-0`} aria-hidden="true">{t("sectors.scoreLabel")}</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={ringCount}
                                    value={displayedScore}
                                    onChange={(e) => setScore(s.id, e.target.value)}
                                    aria-label={`${t("common.score")}: ${s.name}`}
                                    className="flex-1 min-w-0 h-6"
                                />
                                <input
                                    type="number"
                                    min={0}
                                    max={ringCount}
                                    value={displayedScore}
                                    onChange={(e) => setScore(s.id, e.target.value)}
                                    aria-label={`${t("common.score")}: ${s.name}`}
                                    className={`w-14 sm:w-16 rounded-md border ${theme.input} px-1 sm:px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 ${darkMode ? "focus:ring-neutral-100" : "focus:ring-neutral-900"} flex-shrink-0`}
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
