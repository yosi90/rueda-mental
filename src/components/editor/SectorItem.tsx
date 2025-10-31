import type { Sector } from '../../types';
import { rgbToHex } from '../../utils';
import { RING_COUNT } from '../../constants';

interface SectorItemProps {
    sector: Sector;
    index: number;
    totalSectors: number;
    score: number;
    darkMode: boolean;
    onUpdateName: (id: string, name: string) => void;
    onUpdateColor: (id: string, color: string) => void;
    onMove: (id: string, direction: number) => void;
    onRemove: (id: string) => void;
    onScoreChange: (id: string, value: string) => void;
}

export function SectorItem({
    sector,
    index,
    totalSectors,
    score,
    darkMode,
    onUpdateName,
    onUpdateColor,
    onMove,
    onRemove,
    onScoreChange,
}: SectorItemProps) {
    const theme = {
        border: darkMode ? 'border-neutral-700' : 'border-neutral-300',
        input: darkMode
            ? 'bg-neutral-800 border-neutral-700 text-neutral-100'
            : 'bg-white border-neutral-300 text-neutral-900',
        inputAlt: darkMode ? 'bg-neutral-800' : 'bg-neutral-50',
        button: darkMode ? 'bg-neutral-800 hover:bg-neutral-700' : 'bg-white hover:bg-neutral-100',
        textMuted: darkMode ? 'text-neutral-400' : 'text-neutral-500',
    };

    return (
        <li className={`rounded-xl border ${theme.border} p-3 sm:p-4 ${theme.inputAlt}`}>
            {/* Header con color, nombre y botones */}
            <div className="flex items-center gap-2 mb-3 flex-wrap sm:flex-nowrap">
                <input
                    type="color"
                    value={rgbToHex(sector.color)}
                    onChange={(e) => onUpdateColor(sector.id, e.target.value)}
                    title="Color"
                    className="h-6 w-6 sm:h-8 sm:w-8 cursor-pointer rounded-md border flex-shrink-0"
                />

                <input
                    value={sector.name}
                    onChange={(e) => onUpdateName(sector.id, e.target.value)}
                    className={`flex-1 min-w-0 rounded-lg border ${theme.input} px-2 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-neutral-100' : 'focus:ring-neutral-900'
                        }`}
                />

                <div className="flex gap-1">
                    <button
                        onClick={() => onMove(sector.id, -1)}
                        className={`rounded-md border ${theme.border} ${theme.button} px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs transition-colors flex-shrink-0`}
                        disabled={index === 0}
                        title="Subir"
                    >
                        ▲
                    </button>

                    <button
                        onClick={() => onMove(sector.id, 1)}
                        className={`rounded-md border ${theme.border} ${theme.button} px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs transition-colors flex-shrink-0`}
                        disabled={index === totalSectors - 1}
                        title="Bajar"
                    >
                        ▼
                    </button>

                    <button
                        onClick={() => onRemove(sector.id)}
                        className={`rounded-md border ${theme.border} ${theme.button} px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs transition-colors flex-shrink-0`}
                        title="Eliminar"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            {/* Slider de puntuación */}
            <div className="space-y-2">
                <div className="flex items-center gap-1 sm:gap-2">
                    <span className={`text-xs ${theme.textMuted} w-16 sm:w-20 flex-shrink-0`}>
                        Puntuación:
                    </span>

                    <input
                        type="range"
                        min={0}
                        max={RING_COUNT}
                        value={score ?? 0}
                        onChange={(e) => onScoreChange(sector.id, e.target.value)}
                        className="flex-1 min-w-0"
                    />

                    <input
                        type="number"
                        min={0}
                        max={RING_COUNT}
                        value={score ?? 0}
                        onChange={(e) => onScoreChange(sector.id, e.target.value)}
                        className={`w-12 sm:w-16 rounded-md border ${theme.input} px-1 sm:px-2 py-1 text-xs sm:text-sm text-center focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-neutral-100' : 'focus:ring-neutral-900'
                            } flex-shrink-0`}
                    />
                </div>
            </div>
        </li>
    );
}