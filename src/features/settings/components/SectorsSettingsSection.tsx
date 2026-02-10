import type { Dispatch, SetStateAction } from "react";
import type { Sector } from "../../../shared/types/mentalWheel";
import type { ThemeClasses } from "../../../shared/types/theme";
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
}: SectorsSettingsSectionProps) {
    return (
        <div>
            <h3 className={`text-lg font-semibold mb-3 ${theme.text}`}>Sectores</h3>
            <div className="mb-4 flex gap-2">
                <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nombre del sector"
                    className={`flex-1 rounded-lg border ${theme.input} px-3 py-2 text-sm focus:outline-none focus:ring-2 ${darkMode ? "focus:ring-neutral-100" : "focus:ring-neutral-900"}`}
                    onKeyPress={(e) => e.key === "Enter" && addSector()}
                />
                <button onClick={addSector} className={`rounded-lg ${theme.buttonPrimary} px-4 py-2 text-sm transition-colors`}>
                    Añadir
                </button>
            </div>

            <ul className="flex flex-col gap-3">
                {sectors.map((s, i) => (
                    <li key={s.id} className={`rounded-xl border ${theme.border} p-3 sm:p-4 ${theme.inputAlt}`}>
                        <div className="flex items-center gap-2 mb-3 flex-wrap sm:flex-nowrap">
                            <input
                                type="color"
                                value={rgbToHex(s.color)}
                                onChange={(e) =>
                                    setSectors((prev) => prev.map((x) => (x.id === s.id ? { ...x, color: e.target.value } : x)))
                                }
                                title="Color"
                                className="h-6 w-6 sm:h-8 sm:w-8 cursor-pointer rounded-md border flex-shrink-0"
                            />
                            <input
                                value={s.name}
                                onChange={(e) =>
                                    setSectors((prev) => prev.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)))
                                }
                                className={`flex-1 min-w-0 rounded-lg border ${theme.input} px-2 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 ${darkMode ? "focus:ring-neutral-100" : "focus:ring-neutral-900"}`}
                            />
                            <div className="flex gap-1">
                                <button
                                    onClick={() => moveSector(s.id, -1)}
                                    className={`rounded-md border ${theme.border} ${theme.button} px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs transition-colors flex-shrink-0`}
                                    disabled={i === 0}
                                    title="Subir"
                                >
                                    ▲
                                </button>
                                <button
                                    onClick={() => moveSector(s.id, +1)}
                                    className={`rounded-md border ${theme.border} ${theme.button} px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs transition-colors flex-shrink-0`}
                                    disabled={i === sectors.length - 1}
                                    title="Bajar"
                                >
                                    ▼
                                </button>
                                <button
                                    onClick={() => removeSector(s.id)}
                                    className={`rounded-md border ${theme.border} ${theme.button} px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs transition-colors flex-shrink-0`}
                                    title="Eliminar"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-1 sm:gap-2">
                                <span className={`text-xs ${theme.textMuted} w-16 sm:w-20 flex-shrink-0`}>Puntuación:</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={ringCount}
                                    value={scores[s.id] ?? 0}
                                    onChange={(e) => setScore(s.id, e.target.value)}
                                    className="flex-1 min-w-0"
                                />
                                <input
                                    type="number"
                                    min={0}
                                    max={ringCount}
                                    value={scores[s.id] ?? 0}
                                    onChange={(e) => setScore(s.id, e.target.value)}
                                    className={`w-12 sm:w-16 rounded-md border ${theme.input} px-1 sm:px-2 py-1 text-xs sm:text-sm text-center focus:outline-none focus:ring-2 ${darkMode ? "focus:ring-neutral-100" : "focus:ring-neutral-900"} flex-shrink-0`}
                                />
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
