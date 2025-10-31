import type { Sector, Scores, ScoresByDate } from '../../types';
import { downloadJSON, importData, readFileAsText } from '../../services';
import { SectorEditor } from '../editor/SectorEditor';
import { ThemeToggle } from './ThemeToggle';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    sectors: Sector[];
    scores: Scores;
    scoresByDate: ScoresByDate;
    darkMode: boolean;
    newSectorName: string;
    onNewSectorNameChange: (name: string) => void;
    onAddSector: () => void;
    onUpdateSectorName: (id: string, name: string) => void;
    onUpdateSectorColor: (id: string, color: string) => void;
    onMoveSector: (id: string, direction: number) => void;
    onRemoveSector: (id: string) => void;
    onScoreChange: (id: string, value: string) => void;
    onToggleDarkMode: () => void;
    onImportData: (sectors: Sector[], scoresByDate: ScoresByDate) => void;
}

export function Drawer({
    isOpen,
    onClose,
    sectors,
    scores,
    scoresByDate,
    darkMode,
    newSectorName,
    onNewSectorNameChange,
    onAddSector,
    onUpdateSectorName,
    onUpdateSectorColor,
    onMoveSector,
    onRemoveSector,
    onScoreChange,
    onToggleDarkMode,
    onImportData,
}: DrawerProps) {
    const theme = darkMode ? {
        bg: 'bg-neutral-800',
        text: 'text-neutral-100',
        textLight: 'text-neutral-300',
        textMuted: 'text-neutral-400',
        border: 'border-neutral-700',
        borderLight: 'border-neutral-800',
        button: 'bg-neutral-700 hover:bg-neutral-600',
        buttonPrimary: 'bg-neutral-600 hover:bg-neutral-500',
        inputAlt: 'bg-neutral-700',
        input: 'bg-neutral-700 border-neutral-600',
        card: 'bg-neutral-800',
    } : {
        bg: 'bg-white',
        text: 'text-neutral-900',
        textLight: 'text-neutral-600',
        textMuted: 'text-neutral-500',
        border: 'border-neutral-300',
        borderLight: 'border-neutral-200',
        button: 'bg-neutral-100 hover:bg-neutral-200',
        buttonPrimary: 'bg-neutral-200 hover:bg-neutral-300',
        inputAlt: 'bg-neutral-50',
        input: 'bg-white border-neutral-300',
        card: 'bg-white',
    };

    const handleExport = () => {
        downloadJSON(sectors, scoresByDate);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await readFileAsText(file);
            const data = importData(text);

            if (data) {
                const confirmMsg =
                    '¿Estás seguro de que deseas importar estos datos? Esto reemplazará tu configuración actual.';
                if (window.confirm(confirmMsg)) {
                    onImportData(data.sectors, data.scoresByDate);
                    alert('Datos importados correctamente');
                }
            } else {
                alert('Error: El archivo no tiene un formato válido');
            }
        } catch (error) {
            console.error('Error al importar:', error);
            alert('Error al leer el archivo');
        }

        // Reset input
        e.target.value = '';
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={onClose}
            />

            {/* Panel lateral */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-lg ${theme.bg} shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="p-6 space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <h2 className={`text-xl sm:text-2xl font-bold ${theme.text}`}>
                            Configuración
                        </h2>
                        <button
                            onClick={onClose}
                            className={`rounded-lg border ${theme.border} ${theme.button} px-3 py-2 text-sm transition-colors`}
                        >
                            ✕ Cerrar
                        </button>
                    </div>

                    {/* Acciones principales */}
                    <div className="flex flex-col gap-6">
                        <button 
                            onClick={handleExport} 
                            className={`w-full rounded-lg border ${theme.border} ${theme.button} px-4 py-3 text-sm transition-colors`}
                        >
                            Resetear día
                        </button>

                        <button 
                            onClick={handleExport} 
                            className={`w-full rounded-lg border ${theme.border} ${theme.button} px-4 py-3 text-sm transition-colors`}
                        >
                            Exportar JSON
                        </button>

                        <label 
                            className={`w-full rounded-lg border ${theme.border} ${theme.button} px-4 py-3 text-sm transition-colors cursor-pointer text-center block mt-4`}
                        >
                            Importar JSON
                            <input 
                                type="file" 
                                accept=".json" 
                                onChange={handleImport} 
                                className="hidden" 
                            />
                        </label>
                    </div>

                    <hr className={`${theme.borderLight} border-t`} />

                    {/* Editor de sectores */}
                    <div>
                        <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>
                            Sectores
                        </h3>
                        <SectorEditor
                            sectors={sectors}
                            scores={scores}
                            darkMode={darkMode}
                            newSectorName={newSectorName}
                            onNewSectorNameChange={onNewSectorNameChange}
                            onAddSector={onAddSector}
                            onUpdateSectorName={onUpdateSectorName}
                            onUpdateSectorColor={onUpdateSectorColor}
                            onMoveSector={onMoveSector}
                            onRemoveSector={onRemoveSector}
                            onScoreChange={onScoreChange}
                        />
                    </div>

                    <hr className={`${theme.borderLight} border-t`} />

                    {/* Toggle de tema */}
                    <div className={`rounded-xl ${theme.inputAlt} ${theme.border} border p-4`}>
                        <ThemeToggle darkMode={darkMode} onToggle={onToggleDarkMode} />
                    </div>
                </div>
            </div>
        </>
    );
}