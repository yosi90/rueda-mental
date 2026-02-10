import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { defaultSectors, genId, hslFor } from "./features/sectors/utils/sectorUtils";
import { SectorContextMenu } from "./features/sectors/components/SectorContextMenu";
import { SettingsDrawer } from "./features/settings/components/SettingsDrawer";
import { SummaryModal } from "./features/summary/components/SummaryModal";
import type { StatsData } from "./features/stats/types/stats";
import { buildStatsData } from "./features/stats/utils/buildStatsData";
import { TutorialOverlay } from "./features/tutorial/components/TutorialOverlay";
import { useTutorialFlow } from "./features/tutorial/hooks/useTutorialFlow";
import { WheelLayers } from "./features/wheel/components/WheelLayers";
import { useWheelInteractions } from "./features/wheel/hooks/useWheelInteractions";
import { DEFAULT_STATS_VISIBILITY } from "./shared/constants/mentalWheel";
import { FloatingInfoPanel } from "./shared/components/FloatingInfoPanel";
import { TopRightButtons } from "./shared/components/TopRightButtons";
import { useTouchDeviceDetection } from "./shared/hooks/useTouchDeviceDetection";
import {
    hasTutorialBeenShown,
    loadComments,
    loadConfig,
    loadScaleInverted,
    loadDailySummary,
    loadDarkMode,
    loadScores,
    loadStatsVisibility,
    saveComments,
    saveConfig,
    saveDailySummary,
    saveDarkMode,
    saveScaleInverted,
    saveScores,
    saveStatsVisibility,
    saveTutorialShown,
} from "./shared/services/storage/mentalWheelStorage";
import type {
    CommentsByDate,
    DailySummary,
    DailySummaryByDate,
    HoverInfo,
    InfoMenuContextual,
    MentalWheelBackup,
    ScoresByDate,
    Sector,
    SectorWithAngles,
    StatsVisibility,
} from "./shared/types/mentalWheel";
import type { ThemeClasses } from "./shared/types/theme";
import { formatDateInput } from "./shared/utils/date";
import { toDisplayScore, toRawScore } from "./shared/utils/scoreScale";

// === Mental Performance Wheel ===
// - Añade/Quita sectores (aspectos de vida)
// - Puntúa de 0 a 10 cada sector haciendo clic en la rueda o con slider
// - Guarda automáticamente por día en localStorage
// - Exporta/Importa JSON
// - Modal de estadísticas y gráficos
// - UI en español (ES)

const StatsModal = lazy(() =>
    import("./features/stats/components/StatsModal").then((module) => ({ default: module.StatsModal }))
);

export default function MentalWheelApp() {
    // --- Configuración base ---
    const RING_COUNT = 10; // 0..10 (0 = sin nota)
    const SIZE = 520; // tamaño SVG
    const PADDING = 70; // margen para etiquetas externas (aumentado para mejor visualización)
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const baseRadius = (SIZE / 2) - PADDING;
    const ringThickness = baseRadius / RING_COUNT;
    const centerDecorationRadius = ringThickness * 0.6;
    const radius = centerDecorationRadius + (RING_COUNT * ringThickness);
    const RING_NUMBER_FONT_SIZE = 13;

    // --- Helpers ---
    const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));
    const levelOuterRadius = (level: number): number => (
        level <= 0 ? 0 : centerDecorationRadius + (level * ringThickness)
    );
    const levelLabelRadius = (level: number): number => centerDecorationRadius + ((level - 0.5) * ringThickness);
    const distanceToLevel = (dist: number): number => {
        if (dist <= 0) return 0;
        return clamp(Math.ceil((dist - centerDecorationRadius) / ringThickness), 1, RING_COUNT);
    };

    const normDeg = (d: number): number => ((d % 360) + 360) % 360; // 0..360
    const inSector = (ang: number, s: SectorWithAngles): boolean => {
        const a0 = s.a0n, a1 = s.a1n;           // ya normalizados
        return a0 <= a1 ? (ang >= a0 && ang <= a1)
            : (ang >= a0 || ang <= a1); // sector que cruza 360°
    };
    const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
        typeof value === "object" && value !== null && !Array.isArray(value);
    const normalizeImportedStatsVisibility = (value: unknown): StatsVisibility | null => {
        if (!isObjectRecord(value)) return null;
        return {
            enabled: typeof value.enabled === "boolean" ? value.enabled : DEFAULT_STATS_VISIBILITY.enabled,
            showDailyAverage: typeof value.showDailyAverage === "boolean" ? value.showDailyAverage : DEFAULT_STATS_VISIBILITY.showDailyAverage,
            showSectorProgress: typeof value.showSectorProgress === "boolean" ? value.showSectorProgress : DEFAULT_STATS_VISIBILITY.showSectorProgress,
            showLast7AllSectors: typeof value.showLast7AllSectors === "boolean" ? value.showLast7AllSectors : DEFAULT_STATS_VISIBILITY.showLast7AllSectors,
            showComparison: typeof value.showComparison === "boolean" ? value.showComparison : DEFAULT_STATS_VISIBILITY.showComparison,
            showWeeklyTrend: typeof value.showWeeklyTrend === "boolean" ? value.showWeeklyTrend : DEFAULT_STATS_VISIBILITY.showWeeklyTrend,
            showHeatMap: typeof value.showHeatMap === "boolean" ? value.showHeatMap : DEFAULT_STATS_VISIBILITY.showHeatMap,
            showInsights: typeof value.showInsights === "boolean" ? value.showInsights : DEFAULT_STATS_VISIBILITY.showInsights,
        };
    };

    // --- Estado ---
    const todayStr = formatDateInput(new Date());
    const [dateStr, setDateStr] = useState<string>(todayStr);
    const [sectors, setSectors] = useState<Sector[]>(() => loadConfig() || defaultSectors());
    // scores: mapa { dateStr: { id: value } }
    const [scoresByDate, setScoresByDate] = useState<ScoresByDate>(() => loadScores());
    const scores = useMemo<Record<string, number>>(
        () => scoresByDate[dateStr] || {},
        [scoresByDate, dateStr]
    );

    // Estado nuevo (junto al resto de useState)
    const [commentsByDate, setCommentsByDate] = useState<CommentsByDate>(() => loadComments());
    const [dailySummaryByDate, setDailySummaryByDate] = useState<DailySummaryByDate>(() => loadDailySummary());
    const commentTextRef = useRef<HTMLTextAreaElement>(null);

    // --- Nuevo estado y referencias para menú contextual ---
    const [infoMenuContextual, setInfoMenuContextual] = useState<InfoMenuContextual | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);               // Referencia al SVG principal
    const selectorColorRef = useRef<HTMLInputElement>(null);   // Referencia a input color oculto

    const isTouchDevice = useTouchDeviceDetection();

    // UI state
    const [newName, setNewName] = useState<string>("");
    const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [statsOpen, setStatsOpen] = useState<boolean>(false);
    const [summaryOpen, setSummaryOpen] = useState<boolean>(false);
    const [selectedSectorId, setSelectedSectorId] = useState<string>("");
    const [darkMode, setDarkMode] = useState<boolean>(() => loadDarkMode());
    const [isScaleInverted, setIsScaleInverted] = useState<boolean>(() => loadScaleInverted());
    const [visibleSectors, setVisibleSectors] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        sectors.forEach(s => initial[s.id] = true);
        return initial;
    });
    const { tutorialStep, restartTutorial } = useTutorialFlow({
        sectors,
        scoresByDate,
        dateStr,
        infoMenuContextual,
        summaryOpen,
    });

    const EMPTY_DAILY_SUMMARY: DailySummary = { good: "", bad: "", howFacedBad: "" };
    const dailySummary = dailySummaryByDate[dateStr] ?? EMPTY_DAILY_SUMMARY;

    // Actualizar visibleSectors cuando cambien los sectores
    useEffect(() => {
        setVisibleSectors(prev => {
            const updated: Record<string, boolean> = {};
            sectors.forEach(s => {
                updated[s.id] = prev[s.id] !== undefined ? prev[s.id] : true;
            });
            return updated;
        });
    }, [sectors]);


    // Guardar preferencia de tema
    useEffect(() => saveDarkMode(darkMode), [darkMode]);
    useEffect(() => saveScaleInverted(isScaleInverted), [isScaleInverted]);

    // Guardar en localStorage cuando cambia config o datos
    useEffect(() => saveConfig(sectors), [sectors]);
    useEffect(() => saveScores(scoresByDate), [scoresByDate]);

    // Asegura que todos los sectores tengan un score en el día actual
    useEffect(() => {
        if (!scoresByDate[dateStr]) {
            setScoresByDate((prev) => ({ ...prev, [dateStr]: {} }));
        }
    }, [dateStr, scoresByDate]);

    // Mantener selección válida de sector para estadísticas
    useEffect(() => {
        if (sectors.length === 0) {
            if (selectedSectorId !== "") setSelectedSectorId("");
            return;
        }
        const selectedStillExists = sectors.some((s) => s.id === selectedSectorId);
        if (!selectedStillExists) {
            setSelectedSectorId(sectors[0].id);
        }
    }, [sectors, selectedSectorId]);

    //Establecer la posición del menú contextual
    useEffect(() => {
        if (!infoMenuContextual || !menuRef.current) return;

        const PADDING = 8; // margen de seguridad
        const rect = menuRef.current.getBoundingClientRect();

        let left = infoMenuContextual.x;
        let top = infoMenuContextual.y;

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Si se sale por la derecha, muévelo a la izquierda del click
        if (left + rect.width + PADDING > vw) {
            left = Math.max(PADDING, vw - rect.width - PADDING);
        }
        // Si se sale por abajo, súbelo por encima
        if (top + rect.height + PADDING > vh) {
            top = Math.max(PADDING, vh - rect.height - PADDING);
        }
        // Si se sale por la izquierda/arriba, empuja dentro
        if (left < PADDING) left = PADDING;
        if (top < PADDING) top = PADDING;

        if (left !== infoMenuContextual.x || top !== infoMenuContextual.y) {
            setInfoMenuContextual({ ...infoMenuContextual, x: left, y: top });
        }
    }, [infoMenuContextual]);


    const sectorsWithAngles = useMemo(() => {
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

    // --- Cálculos de estadísticas ---
    const statsData = useMemo<StatsData>(
        () => buildStatsData({
            scoresByDate,
            sectors,
            scores,
            todayStr,
            ringCount: RING_COUNT,
            isScaleInverted,
        }),
        [scoresByDate, sectors, scores, todayStr, isScaleInverted]
    );

    // --- Persistencia ---
    useEffect(() => saveComments(commentsByDate), [commentsByDate]);
    useEffect(() => saveDailySummary(dailySummaryByDate), [dailySummaryByDate]);

    function setDailySummaryField(field: keyof DailySummary, text: string): void {
        setDailySummaryByDate((prev) => {
            const current = prev[dateStr] ?? EMPTY_DAILY_SUMMARY;
            const updated = { ...current, [field]: text };
            const hasContent = Object.values(updated).some((value) => value.trim().length > 0);
            if (!hasContent) {
                const copy = { ...prev };
                delete copy[dateStr];
                return copy;
            }
            return { ...prev, [dateStr]: updated };
        });
    }

    function getComment(date: string, sectorId: string): string {
        return commentsByDate[date]?.[sectorId] ?? "";
    }

    function setComment(date: string, sectorId: string, text: string) {
        setCommentsByDate(prev => ({
            ...prev,
            [date]: { ...(prev[date] ?? {}), [sectorId]: text }
        }));
    }

    function deleteComment(date: string, sectorId: string) {
        setCommentsByDate(prev => {
            const day = { ...(prev[date] ?? {}) };
            delete day[sectorId];
            const copy = { ...prev };
            if (Object.keys(day).length === 0) {
                delete copy[date];
            } else {
                copy[date] = day;
            }
            return copy;
        });
    }

    // --- UI Ops ---
    function addSector() {
        const name = newName.trim() || `Sector ${sectors.length + 1}`;
        const color = hslFor(sectors.length);
        setSectors((prev) => [...prev, { id: genId(), name, color }]);
        setNewName("");
    }
    function removeSector(id: string): void {
        setSectors((prev) => prev.filter((s) => s.id !== id));
        setScoresByDate((prev) => {
            const cleaned: ScoresByDate = {};
            for (const date in prev) {
                const dayScores = { ...prev[date] };
                delete dayScores[id];
                cleaned[date] = dayScores;
            }
            return cleaned;
        });
        setCommentsByDate((prev) => {
            const cleaned: CommentsByDate = {};
            for (const date in prev) {
                const dayComments = { ...prev[date] };
                delete dayComments[id];
                if (Object.keys(dayComments).length > 0) {
                    cleaned[date] = dayComments;
                }
            }
            return cleaned;
        });
        setVisibleSectors((prev) => {
            if (!(id in prev)) return prev;
            const copy = { ...prev };
            delete copy[id];
            return copy;
        });
        setSelectedSectorId((prev) => (prev === id ? "" : prev));
    }
    function moveSector(id: string, dir: number): void {
        setSectors((prev) => {
            const i = prev.findIndex((s) => s.id === id);
            const j = i + dir;
            if (i < 0 || j < 0 || j >= prev.length) return prev;
            const arr = [...prev];
            const [it] = arr.splice(i, 1);
            arr.splice(j, 0, it);
            return arr;
        });
    }
    function setScore(id: string, val: string | number): void {
        const displayLevel = clamp(Number(val) || 0, 0, RING_COUNT);
        const level = toRawScore(displayLevel, RING_COUNT, isScaleInverted);
        setScoresByDate((prev) => ({ ...prev, [dateStr]: { ...prev[dateStr], [id]: level } }));
    }
    function resetDay() {
        setScoresByDate((prev) => ({ ...prev, [dateStr]: {} }));
        setCommentsByDate((prev) => {
            const copy = { ...prev };
            delete copy[dateStr];
            return copy;
        });
        setDailySummaryByDate((prev) => {
            const copy = { ...prev };
            delete copy[dateStr];
            return copy;
        });
    }

    function exportJSON() {
        const backup: MentalWheelBackup = {
            version: 2,
            config: sectors,
            scoresByDate,
            commentsByDate,
            dailySummaryByDate,
            scaleInverted: isScaleInverted,
            darkMode,
            tutorialShown: hasTutorialBeenShown(),
            statsVisibility,
        };
        const blob = new Blob(
            [
                JSON.stringify(
                    backup,
                    null,
                    2
                ),
            ],
            { type: "application/json" }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `rueda-desempeno-${dateStr}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    function importJSON(evt: React.ChangeEvent<HTMLInputElement>): void {
        const file = evt.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data: MentalWheelBackup = JSON.parse(String(reader.result));
                if (Array.isArray(data.config)) setSectors(data.config);
                if (isObjectRecord(data.scoresByDate)) setScoresByDate(data.scoresByDate as ScoresByDate);
                if (isObjectRecord(data.commentsByDate)) setCommentsByDate(data.commentsByDate as CommentsByDate);
                if (isObjectRecord(data.dailySummaryByDate)) setDailySummaryByDate(data.dailySummaryByDate as DailySummaryByDate);
                if (typeof data.scaleInverted === "boolean") setIsScaleInverted(data.scaleInverted);
                if (typeof data.darkMode === "boolean") setDarkMode(data.darkMode);
                if (typeof data.tutorialShown === "boolean") saveTutorialShown(data.tutorialShown);
                const importedStatsVisibility = normalizeImportedStatsVisibility(data.statsVisibility);
                if (importedStatsVisibility) setStatsVisibility(importedStatsVisibility);
            } catch (error) {
                alert("Archivo JSON no válido");
                console.error("Error al importar JSON:", error);
            }
        };
        reader.readAsText(file);
        evt.target.value = "";
    }

    const [statsVisibility, setStatsVisibility] = useState<StatsVisibility>(() =>
        loadStatsVisibility(DEFAULT_STATS_VISIBILITY)
    );

    // Guardar cambios
    useEffect(() => saveStatsVisibility(statsVisibility), [statsVisibility]);

    // Si desactivo todo, cierro el modal si está abierto
    useEffect(() => {
        if (!statsVisibility.enabled && statsOpen) setStatsOpen(false);
    }, [statsVisibility.enabled, statsOpen]);

    const {
        scale,
        translateX,
        translateY,
        isPanning,
        handleSvgContextMenu,
        handleSvgClick,
        handleSvgMove,
        handleWheel,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        handleMouseDown,
        handleMouseUp,
        resetZoom,
    } = useWheelInteractions({
        svgRef,
        size: SIZE,
        cx,
        cy,
        radius,
        sectorsWithAngles,
        dateStr,
        inSector,
        distanceToLevel,
        setScoresByDate,
        setHoverInfo,
        setInfoMenuContextual,
    });

    const total = sectors.reduce((acc, s) => {
        const rawScore = scores[s.id] || 0;
        return acc + toDisplayScore(rawScore, RING_COUNT, isScaleInverted);
    }, 0);
    const avg = sectors.length ? (total / sectors.length).toFixed(2) : "0.00";
    const summaryDateLabel = new Date(`${dateStr}T00:00:00`).toLocaleDateString("es-ES", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    // Colores según tema
    const theme: ThemeClasses = {
        bg: darkMode ? "bg-neutral-600" : "bg-neutral-300",
        card: darkMode ? "bg-neutral-800/90" : "bg-white/90",
        cardSolid: darkMode ? "bg-neutral-800" : "bg-white",
        text: darkMode ? "text-neutral-100" : "text-neutral-900",
        textMuted: darkMode ? "text-neutral-400" : "text-neutral-600",
        textLight: darkMode ? "text-neutral-500" : "text-neutral-500",
        border: darkMode ? "border-neutral-600" : "border-neutral-300",
        borderLight: darkMode ? "border-neutral-600" : "border-neutral-200",
        input: darkMode ? "bg-neutral-700 border-neutral-600 text-neutral-100" : "bg-white border-neutral-300 text-neutral-900",
        inputAlt: darkMode ? "bg-neutral-700 border-neutral-600 text-neutral-100" : "bg-neutral-50 border-neutral-200 text-neutral-900",
        button: darkMode ? "bg-neutral-600 hover:bg-neutral-800" : "bg-neutral-100 hover:bg-neutral-200",
        buttonPrimary: darkMode ? "bg-neutral-400 text-neutral-900 hover:bg-neutral-200" : "bg-neutral-100 text-black hover:bg-neutral-200",
        svgBg: darkMode ? "hsl(0 0% 15%)" : "white",
        svgGrid: darkMode ? "hsl(0 0% 35% / 0.5)" : "hsl(0 0% 85% / 0.6)",
        svgText: darkMode ? "hsl(0 0% 80%)" : "hsl(0 0% 20%)",
        svgCenter: darkMode ? "hsl(0 0% 20%)" : "white",
        svgCenterBorder: darkMode ? "hsl(0 0% 40%)" : "hsl(0 0% 80%)",
        overlay: darkMode ? "bg-black/60" : "bg-black/40",
        chartGrid: darkMode ? "#444" : "#e0e0e0",
        chartText: darkMode ? "#aaa" : "#666",
    };

    return (
        <div className={`fixed inset-0 ${theme.bg} ${theme.text} overflow-hidden`} style={{ margin: 0, padding: 0 }}>
            <TopRightButtons
                showStatsButton={statsVisibility.enabled}
                buttonPrimaryClass={theme.buttonPrimary}
                onOpenStats={() => {
                    setSummaryOpen(false);
                    setStatsOpen(true);
                }}
                onOpenSummary={() => {
                    setStatsOpen(false);
                    setSummaryOpen(true);
                }}
                onOpenSettings={() => setDrawerOpen(true)}
            />

            {/* Botón de reset zoom */}
            {(scale !== 1 || translateX !== 0 || translateY !== 0) && (
                <button
                    onClick={resetZoom}
                    className={`fixed bottom-4 right-4 z-40 rounded-full ${theme.buttonPrimary} px-4 py-3 shadow-lg transition-colors text-sm font-medium`}
                    title="Resetear zoom"
                >
                    🔍
                </button>
            )}

            <FloatingInfoPanel
                cardClass={theme.card}
                textMutedClass={theme.textMuted}
                textClass={theme.text}
                buttonClass={theme.button}
                buttonPrimaryClass={theme.buttonPrimary}
                darkMode={darkMode}
                dateStr={dateStr}
                avg={avg}
                hasHoverInfo={Boolean(hoverInfo)}
                hoverInfoContent={hoverInfo ? (
                    <HoverText
                        sectors={sectors}
                        hoverInfo={hoverInfo}
                        darkMode={darkMode}
                        ringCount={RING_COUNT}
                        isScaleInverted={isScaleInverted}
                    />
                ) : null}
                onDateChange={setDateStr}
                onPrevDay={() => {
                    const date = new Date(dateStr);
                    date.setDate(date.getDate() - 1);
                    setDateStr(formatDateInput(date));
                }}
                onNextDay={() => {
                    const date = new Date(dateStr);
                    date.setDate(date.getDate() + 1);
                    setDateStr(formatDateInput(date));
                }}
                onToday={() => setDateStr(todayStr)}
            />

            {/* Rueda principal */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ padding: '80px 20px 20px 20px' }}>
                <div className="w-full h-full max-h-full flex items-center justify-center">
                    <svg
                        ref={svgRef}  /* referencia al SVG para cálculos de posición */
                        onContextMenu={handleSvgContextMenu}  /* manejador de menú contextual */
                        width="100%"
                        height="100%"
                        viewBox={`0 0 ${SIZE} ${SIZE}`}
                        onClick={handleSvgClick}
                        onMouseMove={handleSvgMove}
                        onMouseLeave={() => setHoverInfo(null)}
                        onWheel={handleWheel}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        className="select-none touch-none drop-shadow-2xl"
                        style={{ maxWidth: '100%', maxHeight: '100%', cursor: isPanning ? 'grabbing' : 'grab', touchAction: 'none' }}
                        preserveAspectRatio="xMidYMid meet"
                    >
                        <g transform={`translate(${SIZE / 2 + translateX} ${SIZE / 2 + translateY}) scale(${scale}) translate(${-SIZE / 2} ${-SIZE / 2})`}>
                            <circle cx={cx} cy={cy} r={radius} fill={theme.svgBg} />
                            <WheelLayers
                                cx={cx}
                                cy={cy}
                                radius={radius}
                                ringCount={RING_COUNT}
                                isScaleInverted={isScaleInverted}
                                ringNumberFontSize={RING_NUMBER_FONT_SIZE}
                                sectors={sectors}
                                sectorsWithAngles={sectorsWithAngles}
                                scores={scores}
                                hoverInfo={hoverInfo}
                                dateStr={dateStr}
                                getComment={getComment}
                                levelOuterRadius={levelOuterRadius}
                                levelLabelRadius={levelLabelRadius}
                                theme={{ svgGrid: theme.svgGrid, svgText: theme.svgText }}
                            />
                            <circle cx={cx} cy={cy} r={centerDecorationRadius} fill={theme.svgCenter} stroke={theme.svgCenterBorder} />
                        </g>
                    </svg>
                </div>
            </div>

            <TutorialOverlay
                tutorialStep={tutorialStep}
                isTouchDevice={isTouchDevice}
                tutorialSectorName={sectors[3]?.name}
                theme={theme}
            />

            <SectorContextMenu
                infoMenuContextual={infoMenuContextual}
                menuRef={menuRef}
                theme={theme}
                darkMode={darkMode}
                sectors={sectors}
                scores={scores}
                dateStr={dateStr}
                ringCount={RING_COUNT}
                isScaleInverted={isScaleInverted}
                commentTextRef={commentTextRef}
                onClose={() => setInfoMenuContextual(null)}
                setSectors={setSectors}
                removeSector={removeSector}
                setScore={setScore}
                getComment={getComment}
                setComment={setComment}
                deleteComment={deleteComment}
            />


            {/* Input de color oculto para cambiar color de sector */}
            <input
                type="color"
                ref={selectorColorRef}
                className="hidden"
                onChange={(e) => {
                    if (!infoMenuContextual) return;
                    const nuevoColor = e.target.value;
                    setSectors(prev => prev.map(x =>
                        x.id === infoMenuContextual.idSector ? { ...x, color: nuevoColor } : x
                    ));
                    setInfoMenuContextual(null);
                }}
            />

            <SummaryModal
                open={summaryOpen}
                onClose={() => setSummaryOpen(false)}
                theme={theme}
                summaryDateLabel={summaryDateLabel}
                dailySummary={dailySummary}
                darkMode={darkMode}
                onChangeField={setDailySummaryField}
            />
            <Suspense fallback={null}>
                {statsOpen && (
                    <StatsModal
                        statsOpen={statsOpen}
                        setStatsOpen={setStatsOpen}
                        theme={theme}
                        darkMode={darkMode}
                        statsData={statsData}
                        statsVisibility={statsVisibility}
                        ringCount={RING_COUNT}
                        isScaleInverted={isScaleInverted}
                        selectedSectorId={selectedSectorId}
                        setSelectedSectorId={setSelectedSectorId}
                        sectors={sectors}
                        visibleSectors={visibleSectors}
                        setVisibleSectors={setVisibleSectors}
                    />
                )}
            </Suspense>

            <SettingsDrawer
                drawerOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                theme={theme}
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                newName={newName}
                setNewName={setNewName}
                addSector={addSector}
                sectors={sectors}
                setSectors={setSectors}
                moveSector={moveSector}
                removeSector={removeSector}
                scores={scores}
                ringCount={RING_COUNT}
                setScore={setScore}
                isScaleInverted={isScaleInverted}
                setIsScaleInverted={setIsScaleInverted}
                resetDay={resetDay}
                exportJSON={exportJSON}
                importJSON={importJSON}
                statsVisibility={statsVisibility}
                setStatsVisibility={setStatsVisibility}
                onRestartTutorial={restartTutorial}
            />
        </div>
    );
}

interface HoverTextProps {
    sectors: Sector[];
    hoverInfo: HoverInfo;
    darkMode: boolean;
    ringCount: number;
    isScaleInverted: boolean;
}

function HoverText({ sectors, hoverInfo, darkMode, ringCount, isScaleInverted }: HoverTextProps) {
    const s = sectors.find((x: Sector) => x.id === hoverInfo.sectorId);
    if (!s) return null;
    const displayLevel = toDisplayScore(hoverInfo.level, ringCount, isScaleInverted);
    return (
        <span>
            {s.name}: <b className={`text-base sm:text-lg ${darkMode ? 'text-neutral-100' : 'text-neutral-900'}`}>{displayLevel}</b>
        </span>
    );
}
