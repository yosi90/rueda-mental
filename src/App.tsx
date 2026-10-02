import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useGlobalShortcuts } from "./app/useGlobalShortcuts";
import { EMPTY_DAILY_SUMMARY, useMentalWheelData, type DataSnapshot } from "./app/useMentalWheelData";
import { usePreferences } from "./app/usePreferences";
import { useInstallPrompt, usePwaUpdates } from "./app/usePwa";
import { useDataProtection } from "./app/useDataProtection";
import { SectorContextMenu } from "./features/sectors/components/SectorContextMenu";
import { DataSettingsSection } from "./features/settings/components/DataSettingsSection";
import { LanguageSection } from "./features/settings/components/LanguageSection";
import { LegalSection } from "./features/settings/components/LegalSection";
import { ReferenceDaySection } from "./features/settings/components/ReferenceDaySection";
import { ScaleDirectionSection } from "./features/settings/components/ScaleDirectionSection";
import { SectorsSettingsSection } from "./features/settings/components/SectorsSettingsSection";
import { SettingsDrawer } from "./features/settings/components/SettingsDrawer";
import { StatsVisibilitySection } from "./features/settings/components/StatsVisibilitySection";
import { ThemeSection } from "./features/settings/components/ThemeSection";
import { TutorialSection } from "./features/settings/components/TutorialSection";
import { buildStatsData } from "./features/stats/utils/buildStatsData";
import { SummaryModal } from "./features/summary/components/SummaryModal";
import { SOSModal } from "./features/support/components/SOSModal";
import { TutorialOverlay } from "./features/tutorial/components/TutorialOverlay";
import { useTutorialFlow } from "./features/tutorial/hooks/useTutorialFlow";
import { WheelLayers } from "./features/wheel/components/WheelLayers";
import { useWheelInteractions } from "./features/wheel/hooks/useWheelInteractions";
import { useVisibleLabelBounds } from "./features/wheel/hooks/useVisibleLabelBounds";
import {
    computeSectorAngles,
    createWheelGeometry,
    isAngleInSector,
    RING_COUNT,
} from "./features/wheel/utils/wheelGeometry";
import { FloatingInfoPanel } from "./shared/components/FloatingInfoPanel";
import { MainActionButtons } from "./shared/components/MainActionButtons";
import { useFeedback } from "./shared/feedback/FeedbackProvider";
import { useTouchDeviceDetection } from "./shared/hooks/useTouchDeviceDetection";
import { useMediaQuery } from "./shared/hooks/useMediaQuery";
import { useI18n } from "./shared/i18n/I18nContext";
import { downloadBackup, readBackupFile } from "./shared/services/io/backup";
import { hasTutorialBeenShown, loadLastBackupAt, saveLastBackupAt, saveTutorialShown } from "./shared/services/storage/mentalWheelStorage";
import { theme } from "./shared/theme/theme";
import type { HoverInfo, InfoMenuContextual } from "./shared/types/mentalWheel";
import { addDaysToDateInput, formatDateInput, parseDateInput } from "./shared/utils/date";
import { toDisplayScore, toRawScore } from "./shared/utils/scoreScale";
import { collectDaysWithData, dayHasScores, findPreviousDateWithScores } from "./shared/utils/scores";

const StatsModal = lazy(() =>
    import("./features/stats/components/StatsModal").then((module) => ({ default: module.StatsModal }))
);

const geometry = createWheelGeometry();
const { size: SIZE, cx, cy, radius } = geometry;
const RING_NUMBER_FONT_SIZE = 13;

export default function MentalWheelApp() {
    const { t, language, setLanguage, locale, languageDetails } = useI18n();
    const { confirm, notify } = useFeedback();
    const data = useMentalWheelData(language);
    const preferences = usePreferences();
    const { sectors, scoresByDate, commentsByDate, dailySummaryByDate } = data;
    const { isScaleInverted, statsVisibility } = preferences;
    const isTouchDevice = useTouchDeviceDetection();
    const isSmallScreen = useMediaQuery("(max-width: 639px)");

    // --- Estado de la interfaz ---
    const todayStr = formatDateInput(new Date());
    const [dateStr, setDateStr] = useState<string>(todayStr);
    const [contextMenu, setContextMenu] = useState<InfoMenuContextual | null>(null);
    const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [statsOpen, setStatsOpen] = useState(false);
    const [summaryOpen, setSummaryOpen] = useState(false);
    const [sosOpen, setSosOpen] = useState(false);
    const [lastBackupAt, setLastBackupAt] = useState<number | null>(() => loadLastBackupAt());
    const svgRef = useRef<SVGSVGElement>(null);
    const labelBounds = useVisibleLabelBounds(svgRef, SIZE);

    const scores = useMemo(() => scoresByDate[dateStr] ?? {}, [scoresByDate, dateStr]);
    const dailySummary = dailySummaryByDate[dateStr] ?? EMPTY_DAILY_SUMMARY;
    const sectorsWithAngles = useMemo(() => computeSectorAngles(sectors), [sectors]);

    const { tutorialStep, tutorialSector, restartTutorial, skipTutorial } = useTutorialFlow({
        sectors,
        scoresByDate,
        dateStr,
        infoMenuContextual: contextMenu,
        summaryOpen,
    });

    useGlobalShortcuts({
        onPrevDay: () => setDateStr((d) => addDaysToDateInput(d, -1)),
        onNextDay: () => setDateStr((d) => addDaysToDateInput(d, 1)),
        onToday: () => setDateStr(formatDateInput(new Date())),
    });

    // Si se desactivan todas las estadísticas, se cierra el modal
    useEffect(() => {
        if (!statsVisibility.enabled) setStatsOpen(false);
    }, [statsVisibility.enabled]);

    // --- Valores derivados ---
    const statsData = useMemo(
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
    const daysWithData = useMemo(
        () => collectDaysWithData(scoresByDate, commentsByDate, dailySummaryByDate),
        [scoresByDate, commentsByDate, dailySummaryByDate]
    );
    // Último día anterior con puntuaciones: se puede copiar a un día vacío y se dibuja como referencia
    usePwaUpdates();
    const { canInstall, install } = useInstallPrompt();
    useDataProtection(daysWithData.size, () => exportBackup());

    const previousDateWithScores = useMemo(
        () => findPreviousDateWithScores(scoresByDate, dateStr),
        [scoresByDate, dateStr]
    );
    const copySourceDate = dayHasScores(scores) ? null : previousDateWithScores;
    const referenceDate = preferences.showReference ? previousDateWithScores : null;
    const toDisplay = (raw: number) => toDisplayScore(raw, RING_COUNT, isScaleInverted);
    const avg = sectors.length
        ? (sectors.reduce((acc, s) => acc + toDisplay(scores[s.id] ?? 0), 0) / sectors.length).toFixed(2)
        : "0.00";
    const summaryDateLabel = parseDateInput(dateStr).toLocaleDateString(locale, {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
    function formatShortDate(date: string): string {
        return parseDateInput(date).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
    }
    const sectorName = (id: string) => sectors.find((s) => s.id === id)?.name ?? "";

    // --- Acciones (con confirmación y deshacer) ---
    function notifyUndoable(message: string, snapshot: DataSnapshot): void {
        notify({ message, actionLabel: t("common.undo"), onAction: () => data.restoreSnapshot(snapshot) });
    }

    /** Puntuación en escala visible (sliders, campo numérico y teclado). */
    function setDisplayScore(sectorId: string, displayScore: number): void {
        const clamped = Math.max(0, Math.min(RING_COUNT, displayScore));
        data.setScore(dateStr, sectorId, toRawScore(clamped, RING_COUNT, isScaleInverted));
    }

    // Clic en la rueda: repetir la misma puntuación la quita (solo entonces se ofrece deshacer).
    function handleWheelScore(sectorId: string, level: number): void {
        const date = dateStr;
        const previous = scoresByDate[date]?.[sectorId];
        const next = previous === level ? 0 : level;
        data.setScore(date, sectorId, next);
        if (next > 0) return;
        notify({
            message: t("toast.scoreCleared", { name: sectorName(sectorId) }),
            actionLabel: t("common.undo"),
            onAction: () => data.restoreScore(date, sectorId, previous),
        });
    }

    async function removeSector(id: string): Promise<void> {
        const name = sectorName(id);
        const confirmed = await confirm({
            message: t("sectors.deleteConfirm", { name }),
            confirmLabel: t("sectors.delete"),
            danger: true,
        });
        if (!confirmed) return;
        const snapshot = data.takeSnapshot();
        data.deleteSector(id);
        notifyUndoable(t("toast.sectorDeleted", { name }), snapshot);
    }

    function resetDay(): void {
        const snapshot = data.takeSnapshot();
        data.resetDay(dateStr);
        notifyUndoable(t("toast.dayReset"), snapshot);
    }

    function copyScoresFrom(sourceDate: string): void {
        const snapshot = data.takeSnapshot();
        data.copyScores(sourceDate, dateStr);
        notifyUndoable(t("toast.copied", { date: formatShortDate(sourceDate) }), snapshot);
    }

    function exportBackup(): void {
        downloadBackup({
            version: 3,
            config: sectors,
            scoresByDate,
            commentsByDate,
            dailySummaryByDate,
            scaleInverted: isScaleInverted,
            darkMode: preferences.darkMode,
            style: preferences.style,
            language,
            tutorialShown: hasTutorialBeenShown(),
            statsVisibility,
        }, `rueda-desempeno-${dateStr}.json`);
        saveLastBackupAt();
        setLastBackupAt(Date.now());
    }

    async function importBackup(file: File): Promise<void> {
        const backup = await readBackupFile(file);
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

        const snapshot = data.takeSnapshot();
        data.importData(backup);
        if (backup.scaleInverted !== undefined) preferences.setIsScaleInverted(backup.scaleInverted);
        if (backup.style) preferences.setStyle(backup.style);
        else if (backup.darkMode !== undefined) preferences.setStyle(backup.darkMode ? "dark" : "light");
        if (backup.statsVisibility) preferences.setStatsVisibility(backup.statsVisibility);
        if (backup.language) setLanguage(backup.language);
        if (backup.tutorialShown !== undefined) saveTutorialShown(backup.tutorialShown);
        notifyUndoable(t("toast.imported"), snapshot);
    }

    const { scale, translateX, translateY, isPanning, resetZoom, handlers: wheelHandlers } = useWheelInteractions({
        svgRef,
        size: SIZE,
        cx,
        cy,
        radius,
        sectorsWithAngles,
        inSector: isAngleInSector,
        distanceToLevel: geometry.distanceToLevel,
        onWheelScore: handleWheelScore,
        setHoverInfo,
        setInfoMenuContextual: setContextMenu,
    });

    return (
        <div className={`fixed inset-0 ${theme.bg} ${theme.text} overflow-hidden`}>
            <div className="app-backdrop app-backdrop--main fixed inset-0" aria-hidden="true" />
            <MainActionButtons
                showStatsButton={statsVisibility.enabled}
                onOpenStats={() => {
                    setSummaryOpen(false);
                    setStatsOpen(true);
                }}
                onOpenSummary={() => {
                    setStatsOpen(false);
                    setSummaryOpen(true);
                }}
                onOpenSettings={() => setDrawerOpen(true)}
                highlightSummary={tutorialStep === 4}
            />

            {(scale !== 1 || translateX !== 0 || translateY !== 0) && (
                <button
                    type="button"
                    onClick={resetZoom}
                    className={`fixed bottom-20 sm:bottom-4 right-4 z-40 rounded-full ${theme.buttonPrimary} px-4 py-3 shadow-lg transition-colors text-sm font-medium`}
                    title={t("app.resetZoom")}
                    aria-label={t("app.resetZoom")}
                >
                    <span aria-hidden="true">🔍</span>
                </button>
            )}

            <FloatingInfoPanel
                dateStr={dateStr}
                locale={locale}
                avg={avg}
                hasHoverInfo={Boolean(hoverInfo)}
                hoverInfoContent={hoverInfo ? (
                    <span>
                        {sectorName(hoverInfo.sectorId)}: <b className={`text-base sm:text-lg ${theme.text}`}>{toDisplay(hoverInfo.level)}</b>
                    </span>
                ) : null}
                onDateChange={setDateStr}
                onPrevDay={() => setDateStr(addDaysToDateInput(dateStr, -1))}
                onNextDay={() => setDateStr(addDaysToDateInput(dateStr, 1))}
                onToday={() => setDateStr(todayStr)}
                onOpenSos={() => setSosOpen(true)}
                todayStr={todayStr}
                daysWithData={daysWithData}
                copySource={copySourceDate ? {
                    label: formatShortDate(copySourceDate),
                    onCopy: () => copyScoresFrom(copySourceDate),
                } : null}
                referenceLabel={referenceDate ? formatShortDate(referenceDate) : null}
            />

            {dateStr > todayStr && (
                <div className="fixed bottom-20 sm:bottom-auto sm:top-22 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold shadow-lg motion-safe:animate-pulse" role="status">
                    {t("app.futureDateWarning")}
                </div>
            )}

            {/* Rueda principal */}
            <p id="wheel-keyboard-hint" className="sr-only">{t("wheel.keyboardHint")}</p>
            {/* Márgenes para las barras superior e inferior en móvil y para los paneles flotantes desde sm */}
            <div className="absolute inset-0 flex items-center justify-center px-3 pt-28 pb-20 sm:px-5 sm:pt-20 sm:pb-5">
                <div className="w-full h-full max-h-full flex items-center justify-center">
                    <svg
                        ref={svgRef}
                        role="group"
                        aria-label={t("wheel.label")}
                        {...wheelHandlers}
                        width="100%"
                        height="100%"
                        viewBox={`0 0 ${SIZE} ${SIZE}`}
                        className="select-none touch-none drop-shadow-2xl"
                        style={{ maxWidth: "100%", maxHeight: "100%", overflow: "visible", cursor: scale === 1 ? "pointer" : isPanning ? "grabbing" : "grab", touchAction: "none" }}
                        preserveAspectRatio="xMidYMid meet"
                    >
                        <g transform={`translate(${SIZE / 2 + translateX} ${SIZE / 2 + translateY}) scale(${scale}) translate(${-SIZE / 2} ${-SIZE / 2})`}>
                            <circle cx={cx} cy={cy} r={radius} fill={theme.svgBg} style={{ fillOpacity: "var(--wheel-bg-opacity, 1)" }} />
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
                                referenceScores={referenceDate ? scoresByDate[referenceDate] : null}
                                compactLabels={isSmallScreen}
                                labelBounds={labelBounds}
                                highlightSectorId={tutorialStep === 1 || tutorialStep === 2 ? tutorialSector?.id : null}
                                hoverInfo={hoverInfo}
                                dateStr={dateStr}
                                getComment={data.getComment}
                                levelOuterRadius={geometry.levelOuterRadius}
                                levelLabelRadius={geometry.levelLabelRadius}
                                keyboardHintId="wheel-keyboard-hint"
                                onKeyboardScore={setDisplayScore}
                                onOpenSectorMenu={(idSector, x, y) => setContextMenu({ idSector, x, y })}
                            />
                            <circle cx={cx} cy={cy} r={geometry.centerRadius} fill={theme.svgCenter} stroke={theme.svgCenterBorder} />
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
                menu={contextMenu}
                sectors={sectors}
                scores={scores}
                dateStr={dateStr}
                ringCount={RING_COUNT}
                isScaleInverted={isScaleInverted}
                onClose={() => setContextMenu(null)}
                updateSector={data.updateSector}
                removeSector={removeSector}
                setScore={setDisplayScore}
                getComment={data.getComment}
                setComment={data.setComment}
                deleteComment={data.deleteComment}
            />

            <SummaryModal
                open={summaryOpen}
                onClose={() => setSummaryOpen(false)}
                summaryDateLabel={summaryDateLabel}
                dailySummary={dailySummary}
                onChangeField={(field, text) => data.setSummaryField(dateStr, field, text)}
            />
            <SOSModal open={sosOpen} onClose={() => setSosOpen(false)} />
            <Suspense fallback={null}>
                {statsOpen && (
                    <StatsModal
                        onClose={() => setStatsOpen(false)}
                        statsData={statsData}
                        statsVisibility={statsVisibility}
                        ringCount={RING_COUNT}
                        isScaleInverted={isScaleInverted}
                        sectors={sectors}
                    />
                )}
            </Suspense>

            <SettingsDrawer
                drawerOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onOpenSOS={() => {
                    setDrawerOpen(false);
                    setSosOpen(true);
                }}
            >
                <LanguageSection />
                <SectorsSettingsSection
                    addSector={data.addSector}
                    sectors={sectors}
                    updateSector={data.updateSector}
                    moveSector={data.moveSector}
                    removeSector={removeSector}
                    scores={scores}
                    ringCount={RING_COUNT}
                    setScore={setDisplayScore}
                    isScaleInverted={isScaleInverted}
                />
                <ScaleDirectionSection
                    isScaleInverted={isScaleInverted}
                    setIsScaleInverted={preferences.setIsScaleInverted}
                />
                <DataSettingsSection
                    resetDay={resetDay}
                    exportJSON={exportBackup}
                    onImportFile={importBackup}
                    lastBackupAt={lastBackupAt}
                    canInstall={canInstall}
                    onInstall={() => void install()}
                />
                <ReferenceDaySection
                    showReference={preferences.showReference}
                    setShowReference={preferences.setShowReference}
                />
                <StatsVisibilitySection
                    statsVisibility={statsVisibility}
                    setStatsVisibility={preferences.setStatsVisibility}
                />
                <ThemeSection
                    style={preferences.style}
                    setStyle={preferences.setStyle}
                    backgroundImage={preferences.backgroundImage}
                    setBackgroundImage={preferences.setBackgroundImage}
                />
                <TutorialSection onRestartTutorial={restartTutorial} />
                <LegalSection />
            </SettingsDrawer>
        </div>
    );
}

