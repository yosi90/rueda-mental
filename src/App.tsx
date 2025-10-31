import { useMemo, useState } from 'react';
import type { SectorWithAngles, Sector, ScoresByDate } from './types';
import { normDeg } from './utils';
import { getTodayString } from './utils/dateHelpers';
import { getTheme, SIZE } from './constants';
import { useDarkMode, useZoomPan, useScores, useSectors } from './hooks';
import { WheelChart, HoverText, DateSelector, Drawer } from './components';

export default function App() {
    const todayStr = getTodayString();
    const [dateStr, setDateStr] = useState<string>(todayStr);
    const [newName, setNewName] = useState<string>('');
    const [hoverInfo, setHoverInfo] = useState<{ sectorId: string; level: number } | null>(null);
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

    // Custom hooks
    const { darkMode, toggleDarkMode } = useDarkMode();
    const { sectors, addSector, removeSector, updateSectorName, updateSectorColor, moveSector, replaceAllSectors } = useSectors();
    const { scores, scoresByDate, setScore, replaceAllScores } = useScores(dateStr);
    const zoomPan = useZoomPan();

    const theme = getTheme(darkMode);

    // Calcular sectores con ángulos
    const sectorsWithAngles: SectorWithAngles[] = useMemo(() => {
        const gapDeg = 2;
        const count = Math.max(1, sectors.length);
        const full = 360;
        const sectorSpan = (full - count * gapDeg) / count;
        let start = -90; // arriba

        return sectors.map((s) => {
            const a0 = start + gapDeg / 2;
            const a1 = a0 + sectorSpan;
            const mid = (a0 + a1) / 2;
            start += sectorSpan + gapDeg;
            return { ...s, a0, a1, mid, a0n: normDeg(a0), a1n: normDeg(a1) };
        });
    }, [sectors]);

    // Handlers
    const handleAddSector = () => {
        if (!newName.trim()) return;
        addSector(newName);
        setNewName('');
    };

    const handleImportData = (newSectors: Sector[], newScoresByDate: ScoresByDate) => {
        replaceAllSectors(newSectors);
        replaceAllScores(newScoresByDate);
    };

    return (
        <div className={`min-h-screen ${theme.bg} ${theme.text} transition-colors duration-200`}>
            {/* Header */}
            <header className={`border-b ${theme.border} ${theme.bg} sticky top-0 z-30`}>
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold">🧠 Mental Performance Wheel</h1>
                            <p className={`text-xs sm:text-sm ${theme.textLight} mt-1`}>
                                Evalúa y visualiza diferentes aspectos de tu vida
                            </p>
                        </div>

                        <button
                            onClick={() => setDrawerOpen(true)}
                            className={`self-start sm:self-auto rounded-lg border ${theme.border} ${theme.button} px-4 py-2 text-sm transition-colors`}
                        >
                            ⚙️ Configuración
                        </button>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
                {/* Selector de fecha */}
                <div className="mb-6">
                    <DateSelector dateStr={dateStr} onDateChange={setDateStr} darkMode={darkMode} />
                </div>

                {/* Rueda */}
                {/* Card de promedio y día */}
                <div className="fixed top-4 left-4 z-40 flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-[calc(100%-120px)] sm:max-w-none">
                    {/* Card de promedio */}
                    <div className={`rounded-xl sm:rounded-2xl ${theme.card} backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 shadow-lg`}>
                        <div className={`text-xs sm:text-sm ${theme.textMuted} mb-1 sm:mb-2`}>
                            {hoverInfo ? (
                                <HoverText sectors={sectors} hoverInfo={hoverInfo} darkMode={darkMode} />
                            ) : (
                                `Media del día: ${(sectors.reduce((acc, s) => acc + (scores[s.id] || 0), 0) / Math.max(1, sectors.length)).toFixed(2)}`
                            )}
                        </div>
                        <div className={`text-[10px] sm:text-xs ${theme.textLight}`}>Click para puntuar</div>
                    </div>

                    {/* Card de fecha */}
                    <DateSelector dateStr={dateStr} onDateChange={setDateStr} darkMode={darkMode} />
                </div>

                <div className={`rounded-2xl border ${theme.border} ${theme.card} p-4 sm:p-8`}>
                    <div className="flex flex-col items-center gap-4">
                        {/* Texto de hover */}
                        <div className={`h-8 text-center text-sm ${theme.textMuted}`}>
                            {hoverInfo ? (
                                <HoverText sectors={sectors} hoverInfo={hoverInfo} darkMode={darkMode} />
                            ) : (
                                'Haz clic en la rueda para puntuar o usa los controles'
                            )}
                        </div>

                        {/* SVG de la rueda */}
                        <div className="relative overflow-hidden rounded-xl flex justify-center items-center" style={{ touchAction: 'none', width: '100%', maxWidth: `${SIZE}px`, aspectRatio: '1/1' }}>
                            {/* El contenedor limita el tamaño máximo de la rueda y mantiene aspecto 1:1 */}
                            <WheelChart
                                sectorsWithAngles={sectorsWithAngles}
                                scores={scores}
                                darkMode={darkMode}
                                scale={zoomPan.scale}
                                translateX={zoomPan.translateX}
                                translateY={zoomPan.translateY}
                                hasPanned={zoomPan.hasPanned}
                                onHoverChange={setHoverInfo}
                                onScoreChange={setScore}
                                onWheel={zoomPan.handleWheel}
                                onMouseDown={zoomPan.handleMouseDown}
                                onMouseMove={zoomPan.handleMouseMove}
                                onMouseUp={zoomPan.handleMouseUp}
                                onTouchStart={zoomPan.handleTouchStart}
                                onTouchMove={zoomPan.handleTouchMove}
                                onTouchEnd={zoomPan.handleTouchEnd}
                            />
                        </div>


                        {/* Instrucciones */}
                        <p className={`text-center text-xs ${theme.textMuted} max-w-md`}>
                            💡 <b>Clic</b> en la rueda para puntuar. <b>Rueda del ratón</b> para zoom. <b>Arrastra</b> para mover.
                        </p>
                    </div>
                </div>
            </main>

            {/* Floating action buttons */}
            <button
                onClick={() => setDrawerOpen(true)}
                className={`fixed top-4 right-4 z-40 rounded-lg ${theme.buttonPrimary} p-3 shadow-lg transition-colors`}
                title="Configuración"
            >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>

            {(zoomPan.scale !== 1 || zoomPan.translateX !== 0 || zoomPan.translateY !== 0) && (
                <button
                    onClick={zoomPan.resetZoom}
                    className={`fixed bottom-4 right-4 z-40 rounded-lg ${theme.buttonPrimary} px-4 py-3 shadow-lg transition-colors text-sm font-medium`}
                    title="Resetear zoom"
                >
                    �
                </button>
            )}

            {/* Drawer lateral */}
            <Drawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                sectors={sectors}
                scores={scores}
                scoresByDate={scoresByDate}
                darkMode={darkMode}
                newSectorName={newName}
                onNewSectorNameChange={setNewName}
                onAddSector={handleAddSector}
                onUpdateSectorName={updateSectorName}
                onUpdateSectorColor={updateSectorColor}
                onMoveSector={moveSector}
                onRemoveSector={removeSector}
                onScoreChange={setScore}
                onToggleDarkMode={toggleDarkMode}
                onImportData={handleImportData}
            />
        </div>
    );
}