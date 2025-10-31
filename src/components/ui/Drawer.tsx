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
    const theme = {
        bg: darkMode ? 'bg-neutral-900' : 'bg-white',
        text: darkMode ? 'text-neutral-100' : 'text-neutral-900',
        textLight: darkMode ? 'text-neutral-300' : 'text-neutral-600',
        border: darkMode ? 'border-neutral-700' : 'border-neutral-300',
        borderLight: darkMode ? 'border-neutral-800' : 'border-neutral-200',
        button: darkMode ? 'bg-neutral-800 hover:bg-neutral-700' : 'bg-white hover:bg-neutral-100',
        inputAlt: darkMode ? 'bg-neutral-800' : 'bg-neutral-50',
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
                className={`fixed top-0 right-0 h-full w-full sm:w-96 ${theme.bg} shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="p-4 sm:p-6">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
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

                    {/* Editor de sectores */}
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

                    <hr className={`my-6 ${theme.borderLight} border-t`} />

                    {/* Toggle de tema */}
                    <ThemeToggle darkMode={darkMode} onToggle={onToggleDarkMode} />

                    <hr className={`my-6 ${theme.borderLight} border-t`} />

                    {/* Exportar/Importar */}
                    <div className={`p-4 rounded-xl ${theme.inputAlt} ${theme.border} border`}>
                        <h3 className={`text-sm font-medium ${theme.text} mb-3`}>
                            Exportar / Importar datos
                        </h3>

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleExport}
                                className={`w-full rounded-lg border ${theme.border} ${theme.button} px-4 py-2 text-sm transition-colors`}
                            >
                                📥 Exportar JSON
                            </button>

                            <label
                                className={`w-full rounded-lg border ${theme.border} ${theme.button} px-4 py-2 text-sm transition-colors cursor-pointer text-center block`}
                            >
                                📤 Importar JSON
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImport}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        <p className={`text-xs ${theme.textLight} mt-3`}>
                            Exporta tus datos para hacer una copia de seguridad o importa datos previamente exportados.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}