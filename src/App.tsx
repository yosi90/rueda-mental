import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { defaultSectors, genId, hslFor, translateDefaultSectorName } from "./features/sectors/utils/sectorUtils";
import { SectorContextMenu } from "./features/sectors/components/SectorContextMenu";
import { SettingsDrawer } from "./features/settings/components/SettingsDrawer";
import { SOSModal } from "./features/support/components/SOSModal";
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
import { useI18n } from "./shared/i18n/I18nContext";
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
import { parseBackup } from "./shared/services/io/backup";
import type { ThemeClasses } from "./shared/types/theme";
import { addDaysToDateInput, formatDateInput, parseDateInput } from "./shared/utils/date";
import { toDisplayScore, toRawScore } from "./shared/utils/scoreScale";
import { dayHasScores, findPreviousDateWithScores } from "./shared/utils/scores";
import { useFeedback } from "./shared/feedback/FeedbackProvider";
import { hasOpenDialog } from "./shared/hooks/useDialogA11y";

// === Mental Performance Wheel ===
// - Añade/Quita sectores (aspectos de vida)
// - Puntúa de 0 a 10 cada sector haciendo clic en la rueda o con slider
// - Guarda automáticamente por día en localStorage
// - Exporta/Importa JSON
// - Modal de estadísticas y gráficos
// - UI multilingüe (es, en, pt, de)

const StatsModal = lazy(() =>
    import("./features/stats/components/StatsModal").then((module) => ({ default: module.StatsModal }))
);

export default function MentalWheelApp() {
    const { t, language, setLanguage, locale, languageDetails } = useI18n();
    const { confirm, notify } = useFeedback();

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
    // --- Estado ---
    const todayStr = formatDateInput(new Date());
    const [dateStr, setDateStr] = useState<string>(todayStr);
    const [sectors, setSectors] = useState<Sector[]>(() => loadConfig() || defaultSectors(language));
    // scores: mapa { dateStr: { id: value } }
    const [scoresByDate, setScoresByDate] = useState<ScoresByDate>(() => loadScores());
    const scores = useMemo<Record<string, number>>(
        () => scoresByDate[dateStr] || {},
        [scoresByDate, dateStr]
    );

    // Estado nuevo (junto al resto de useState)
    const [commentsByDate, setCommentsByDate] = useState<CommentsByDate>(() => loadComments());
    const [dailySummaryByDate, setDailySummaryByDate] = useState<DailySummaryByDate>(() => loadDailySummary());

    // --- Nuevo estado y referencias para menú contextual ---
    const [infoMenuContextual, setInfoMenuContextual] = useState<InfoMenuContextual | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);               // Referencia al SVG principal

    const isTouchDevice = useTouchDeviceDetection();

    // UI state
    const [newName, setNewName] = useState<string>("");
    const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [statsOpen, setStatsOpen] = useState<boolean>(false);
    const [summaryOpen, setSummaryOpen] = useState<boolean>(false);
    const [sosOpen, setSosOpen] = useState<boolean>(false);
    const [selectedSectorId, setSelectedSectorId] = useState<string>("");
    const [darkMode, setDarkMode] = useState<boolean>(() => loadDarkMode());
    const [isScaleInverted, setIsScaleInverted] = useState<boolean>(() => loadScaleInverted());
    const [visibleSectors, setVisibleSectors] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        sectors.forEach(s => initial[s.id] = true);
        return initial;
    });
    const { tutorialStep, tutorialSector, restartTutorial, skipTutorial } = useTutorialFlow({
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
    useEffect(() => {
        saveDarkMode(darkMode);
        document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    }, [darkMode]);
    useEffect(() => saveScaleInverted(isScaleInverted), [isScaleInverted]);

    useEffect(() => {
        setSectors((prev) => {
            let changed = false;
            const translated = prev.map((sector) => {
                const translatedName = translateDefaultSectorName(sector.name, language);
                if (translatedName && translatedName !== sector.name) {
                    changed = true;
                    return { ...sector, name: translatedName };
                }
                return sector;
            });
            return changed ? translated : prev;
        });
    }, [language]);

    // Guardar en localStorage cuando cambia config o datos
    useEffect(() => saveConfig(sectors), [sectors]);
    useEffect(() => saveScores(scoresByDate), [scoresByDate]);

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
            locale,
            weekDaysShort: languageDetails.weekDaysShort,
            todayLabel: languageDetails.todayLabel,
        }),
        [scoresByDate, sectors, scores, todayStr, isScaleInverted, locale, languageDetails.weekDaysShort, languageDetails.todayLabel]
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

    // --- Deshacer ---
    interface DataSnapshot {
        sectors: Sector[];
        scoresByDate: ScoresByDate;
        commentsByDate: CommentsByDate;
        dailySummaryByDate: DailySummaryByDate;
    }
    function takeSnapshot(): DataSnapshot {
        return { sectors, scoresByDate, commentsByDate, dailySummaryByDate };
    }
    function restoreSnapshot(snapshot: DataSnapshot): void {
        setSectors(snapshot.sectors);
        setScoresByDate(snapshot.scoresByDate);
        setCommentsByDate(snapshot.commentsByDate);
        setDailySummaryByDate(snapshot.dailySummaryByDate);
    }
    function notifyUndoable(message: string, snapshot: DataSnapshot): void {
        notify({ message, actionLabel: t("common.undo"), onAction: () => restoreSnapshot(snapshot) });
    }

    // --- UI Ops ---
    function addSector() {
        const name = newName.trim() || `Sector ${sectors.length + 1}`;
        const color = hslFor(sectors.length);
        setSectors((prev) => [...prev, { id: genId(), name, color }]);
        setNewName("");
    }
    async function removeSector(id: string): Promise<void> {
        const sector = sectors.find((s) => s.id === id);
        if (!sector) return;
        const confirmed = await confirm({
            message: t("sectors.deleteConfirm", { name: sector.name }),
            confirmLabel: t("sectors.delete"),
            danger: true,
        });
        if (!confirmed) return;
        const snapshot = takeSnapshot();
        deleteSectorData(id);
        notifyUndoable(t("toast.sectorDeleted", { name: sector.name }), snapshot);
    }
    function deleteSectorData(id: string): void {
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
        const snapshot = takeSnapshot();
        setScoresByDate((prev) => {
            const copy = { ...prev };
            delete copy[dateStr];
            return copy;
        });
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
        notifyUndoable(t("toast.dayReset"), snapshot);
    }

    // Puntuación con clic en la rueda: repetir la misma puntuación la quita.
    function handleWheelScore(sectorId: string, level: number): void {
        const date = dateStr;
        const previous = scoresByDate[date]?.[sectorId];
        const next = previous === level ? 0 : level;
        setScoresByDate((prev) => ({ ...prev, [date]: { ...prev[date], [sectorId]: next } }));

        const name = sectors.find((s) => s.id === sectorId)?.name ?? "";
        const displayed = toDisplayScore(next, RING_COUNT, isScaleInverted);
        notify({
            message: displayed > 0
                ? t("toast.scoreSet", { name, value: displayed })
                : t("toast.scoreCleared", { name }),
            actionLabel: t("common.undo"),
            onAction: () => setScoresByDate((prev) => {
                const day = { ...prev[date] };
                if (previous === undefined) delete day[sectorId];
                else day[sectorId] = previous;
                const copy = { ...prev, [date]: day };
                if (Object.keys(day).length === 0) delete copy[date];
                return copy;
            }),
        });
    }

    const previousDateWithScores = useMemo(
        () => (dayHasScores(scores) ? null : findPreviousDateWithScores(scoresByDate, dateStr)),
        [scores, scoresByDate, dateStr]
    );
    function copyScoresFrom(sourceDate: string): void {
        const snapshot = takeSnapshot();
        setScoresByDate((prev) => ({ ...prev, [dateStr]: { ...prev[sourceDate] } }));
        notifyUndoable(t("toast.copied", { date: formatShortDate(sourceDate) }), snapshot);
    }
    function formatShortDate(date: string): string {
        return parseDateInput(date).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
    }

    // Atajos globales: ← / → cambian de día y T vuelve a hoy (fuera de campos, sliders y diálogos).
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || hasOpenDialog()) return;
            const target = event.target as HTMLElement | null;
            if (target?.closest("input, textarea, select, [contenteditable='true'], [role='slider'], [role='dialog']")) return;
            if (event.key === "ArrowLeft") setDateStr((d) => addDaysToDateInput(d, -1));
            else if (event.key === "ArrowRight") setDateStr((d) => addDaysToDateInput(d, 1));
            else if (event.key === "t" || event.key === "T") setDateStr(formatDateInput(new Date()));
            else return;
            event.preventDefault();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    function exportJSON() {
        const backup: MentalWheelBackup = {
            version: 2,
            config: sectors,
            scoresByDate,
            commentsByDate,
            dailySummaryByDate,
            scaleInverted: isScaleInverted,
            darkMode,
            language,
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
        evt.target.value = "";
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
            const backup = parseBackup(String(reader.result));
            if (!backup) {
                notify({ message: t("app.invalidJson"), tone: "error" });
                return;
            }
            const confirmed = await confirm({
                message: t("data.confirmImport"),
                confirmLabel: t("data.importJson"),
                danger: true,
            });
            if (!confirmed) return;

            const snapshot = takeSnapshot();
            if (backup.config) setSectors(backup.config);
            if (backup.scoresByDate) setScoresByDate(backup.scoresByDate);
            if (backup.commentsByDate) setCommentsByDate(backup.commentsByDate);
            if (backup.dailySummaryByDate) setDailySummaryByDate(backup.dailySummaryByDate);
            if (backup.scaleInverted !== undefined) setIsScaleInverted(backup.scaleInverted);
            if (backup.darkMode !== undefined) setDarkMode(backup.darkMode);
            if (backup.language) setLanguage(backup.language);
            if (backup.tutorialShown !== undefined) saveTutorialShown(backup.tutorialShown);
            if (backup.statsVisibility) setStatsVisibility(backup.statsVisibility);
            notifyUndoable(t("toast.imported"), snapshot);
        };
        reader.readAsText(file);
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
        inSector,
        distanceToLevel,
        onWheelScore: handleWheelScore,
        setHoverInfo,
        setInfoMenuContextual,
    });

    const total = sectors.reduce((acc, s) => {
        const rawScore = scores[s.id] || 0;
        return acc + toDisplayScore(rawScore, RING_COUNT, isScaleInverted);
    }, 0);
    const avg = sectors.length ? (total / sectors.length).toFixed(2) : "0.00";
    const summaryDateLabel = parseDateInput(dateStr).toLocaleDateString(locale, {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
    const daysWithData = useMemo<ReadonlySet<string>>(() => {
        const days = new Set<string>();

        Object.entries(scoresByDate).forEach(([date, dayScores]) => {
            if (Object.keys(dayScores).length > 0) {
                days.add(date);
            }
        });

        Object.entries(commentsByDate).forEach(([date, dayComments]) => {
            const hasComment = Object.values(dayComments).some((text) => text.trim().length > 0);
            if (hasComment) {
                days.add(date);
            }
        });

        Object.entries(dailySummaryByDate).forEach(([date, summary]) => {
            const hasSummary = [summary.good, summary.bad, summary.howFacedBad]
                .some((text) => text.trim().length > 0);
            if (hasSummary) {
                days.add(date);
            }
        });

        return days;
    }, [scoresByDate, commentsByDate, dailySummaryByDate]);

    // Colores según tema
    const theme: ThemeClasses = {
        bg: darkMode ? "bg-neutral-600" : "bg-neutral-300",
        card: darkMode ? "bg-neutral-800/90" : "bg-white/90",
        cardSolid: darkMode ? "bg-neutral-800" : "bg-white",
        text: darkMode ? "text-neutral-100" : "text-neutral-900",
        textMuted: darkMode ? "text-neutral-300" : "text-neutral-600",
        textLight: darkMode ? "text-neutral-300" : "text-neutral-600",
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
                    title={t("app.resetZoom")}
                    aria-label={t("app.resetZoom")}
                >
                    <span aria-hidden="true">🔍</span>
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
                locale={locale}
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
                onPrevDay={() => setDateStr(addDaysToDateInput(dateStr, -1))}
                onNextDay={() => setDateStr(addDaysToDateInput(dateStr, 1))}
                onToday={() => setDateStr(todayStr)}
                onOpenSos={() => setSosOpen(true)}
                todayStr={todayStr}
                daysWithData={daysWithData}
                copySource={previousDateWithScores ? {
                    label: formatShortDate(previousDateWithScores),
                    onCopy: () => copyScoresFrom(previousDateWithScores),
                } : null}
            />

            {/* Rueda principal */}
            {dateStr > todayStr && (
                <div className="fixed top-22 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold shadow-lg motion-safe:animate-pulse" role="status">
                    {t("app.futureDateWarning")}
                </div>
            )}
            <p id="wheel-keyboard-hint" className="sr-only">{t("wheel.keyboardHint")}</p>
            <div className="absolute inset-0 flex items-center justify-center" style={{ padding: '80px 20px 20px 20px' }}>
                <div className="w-full h-full max-h-full flex items-center justify-center">
                    <svg
                        ref={svgRef}  /* referencia al SVG para cálculos de posición */
                        role="group"
                        aria-label={t("wheel.label")}
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
                        style={{ maxWidth: '100%', maxHeight: '100%', cursor: scale === 1 ? 'pointer' : isPanning ? 'grabbing' : 'grab', touchAction: 'none' }}
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
                                keyboardHintId="wheel-keyboard-hint"
                                onKeyboardScore={setScore}
                                onOpenSectorMenu={(idSector, x, y) => setInfoMenuContextual({ idSector, x, y })}
                            />
                            <circle cx={cx} cy={cy} r={centerDecorationRadius} fill={theme.svgCenter} stroke={theme.svgCenterBorder} />
                        </g>
                    </svg>
                </div>
            </div>

            <TutorialOverlay
                tutorialStep={tutorialStep}
                isTouchDevice={isTouchDevice}
                tutorialSectorName={tutorialSector?.name}
                onSkip={skipTutorial}
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
                onClose={() => setInfoMenuContextual(null)}
                setSectors={setSectors}
                removeSector={removeSector}
                setScore={setScore}
                getComment={getComment}
                setComment={setComment}
                deleteComment={deleteComment}
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
            <SOSModal
                open={sosOpen}
                onClose={() => setSosOpen(false)}
                theme={theme}
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
                onOpenSOS={() => {
                    setDrawerOpen(false);
                    setSosOpen(true);
                }}
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
