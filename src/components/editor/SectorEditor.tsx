import type { Sector, Scores } from '../../types';
import { SectorItem } from './SectorItem';

interface SectorEditorProps {
    sectors: Sector[];
    scores: Scores;
    darkMode: boolean;
    newSectorName: string;
    onNewSectorNameChange: (name: string) => void;
    onAddSector: () => void;
    onUpdateSectorName: (id: string, name: string) => void;
    onUpdateSectorColor: (id: string, color: string) => void;
    onMoveSector: (id: string, direction: number) => void;
    onRemoveSector: (id: string) => void;
    onScoreChange: (id: string, value: string) => void;
}

export function SectorEditor({
    sectors,
    scores,
    darkMode,
    newSectorName,
    onNewSectorNameChange,
    onAddSector,
    onUpdateSectorName,
    onUpdateSectorColor,
    onMoveSector,
    onRemoveSector,
    onScoreChange,
}: SectorEditorProps) {
    const theme = {
        text: darkMode ? 'text-neutral-100' : 'text-neutral-900',
        border: darkMode ? 'border-neutral-700' : 'border-neutral-300',
        borderLight: darkMode ? 'border-neutral-800' : 'border-neutral-200',
        input: darkMode
            ? 'bg-neutral-800 border-neutral-700 text-neutral-100'
            : 'bg-white border-neutral-300 text-neutral-900',
        button: darkMode ? 'bg-neutral-800 hover:bg-neutral-700' : 'bg-white hover:bg-neutral-100',
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onAddSector();
        }
    };

    return (
        <div>
            {/* Agregar nuevo sector */}
            <div className="mb-6">
                <label className={`mb-2 block text-sm font-medium ${theme.text}`}>
                    Agregar sector
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Nombre del sector"
                        value={newSectorName}
                        onChange={(e) => onNewSectorNameChange(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className={`flex-1 rounded-lg border ${theme.input} px-3 py-2 text-sm focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-neutral-100' : 'focus:ring-neutral-900'
                            }`}
                    />
                    <button
                        onClick={onAddSector}
                        className={`rounded-lg border ${theme.border} ${theme.button} px-4 py-2 text-sm transition-colors`}
                    >
                        ➕ Agregar
                    </button>
                </div>
            </div>

            <hr className={`my-6 ${theme.borderLight} border-t`} />

            {/* Lista de sectores */}
            <div className="mb-6">
                <label className={`mb-3 block text-sm font-medium ${theme.text}`}>
                    Sectores actuales
                </label>

                <ul className="flex flex-col gap-3">
                    {sectors.map((sector, index) => (
                        <SectorItem
                            key={sector.id}
                            sector={sector}
                            index={index}
                            totalSectors={sectors.length}
                            score={scores[sector.id] ?? 0}
                            darkMode={darkMode}
                            onUpdateName={onUpdateSectorName}
                            onUpdateColor={onUpdateSectorColor}
                            onMove={onMoveSector}
                            onRemove={onRemoveSector}
                            onScoreChange={onScoreChange}
                        />
                    ))}
                </ul>
            </div>
        </div>
    );
}