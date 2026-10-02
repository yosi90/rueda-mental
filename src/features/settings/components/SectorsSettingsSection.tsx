import { useState } from "react";
import { theme } from "../../../shared/theme/theme";
import { useI18n } from "../../../shared/i18n/I18nContext";
import type { Sector } from "../../../shared/types/mentalWheel";
import { toDisplayScore } from "../../../shared/utils/scoreScale";
import { rgbToHex } from "../../../shared/utils/color";
import { IconPicker } from "../../sectors/components/IconPicker";

interface SectorsSettingsSectionProps {
    addSector: (name: string) => void;
    sectors: Sector[];
    updateSector: (id: string, patch: Partial<Omit<Sector, "id">>) => void;
    moveSector: (id: string, dir: number) => void;
    removeSector: (id: string) => void;
    scores: Record<string, number>;
    ringCount: number;
    /** Puntuación en escala visible. */
    setScore: (id: string, displayScore: number) => void;
    isScaleInverted: boolean;
}

export function SectorsSettingsSection({
    addSector,
    sectors,
    updateSector,
    moveSector,
    removeSector,
    scores,
    ringCount,
    setScore,
    isScaleInverted,
}: SectorsSettingsSectionProps) {
    const { t } = useI18n();
    const [newName, setNewName] = useState("");

    function submitNewSector() {
        addSector(newName);
        setNewName("");
    }

    return (
        <div>
            <h3 className={`text-lg font-semibold mb-3 ${theme.text}`}>{t("sectors.title")}</h3>
            <div className="mb-4 flex gap-2">
                <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={t("sectors.newPlaceholder")}
                    aria-label={t("sectors.newPlaceholder")}
                    className={`flex-1 rounded-lg border ${theme.input} px-3 py-2 text-sm ${theme.focusRing}`}
                    onKeyDown={(e) => e.key === "Enter" && submitNewSector()}
                />
                <button type="button" onClick={submitNewSector} className={`rounded-lg ${theme.buttonPrimary} px-4 py-2 text-sm transition-colors`}>
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
                                        updateSector(s.id, { color: e.target.value })
                                    }
                                    title={t("common.color")}
                                    aria-label={`${t("common.color")}: ${s.name}`}
                                    className="h-8 w-8 cursor-pointer rounded-md border flex-shrink-0"
                                />
                                <IconPicker
                                    sectorName={s.name}
                                    value={s.icon}
                                    onChange={(icon) => updateSector(s.id, { icon })}
                                />
                                <input
                                    value={s.name}
                                    onChange={(e) =>
                                        updateSector(s.id, { name: e.target.value })
                                    }
                                    aria-label={t("sectors.newPlaceholder")}
                                    className={`flex-1 min-w-0 rounded-lg border ${theme.input} px-2 sm:px-3 py-2 text-sm ${theme.focusRing}`}
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
                                    onChange={(e) => setScore(s.id, Number(e.target.value) || 0)}
                                    aria-label={`${t("common.score")}: ${s.name}`}
                                    className="flex-1 min-w-0 h-6"
                                />
                                <input
                                    type="number"
                                    min={0}
                                    max={ringCount}
                                    value={displayedScore}
                                    onChange={(e) => setScore(s.id, Number(e.target.value) || 0)}
                                    aria-label={`${t("common.score")}: ${s.name}`}
                                    className={`w-14 sm:w-16 rounded-md border ${theme.input} px-1 sm:px-2 py-1 text-sm text-center ${theme.focusRing} flex-shrink-0`}
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
