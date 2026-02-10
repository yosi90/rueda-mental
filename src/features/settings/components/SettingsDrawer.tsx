import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import type { Sector, StatsVisibility } from "../../../shared/types/mentalWheel";
import type { ThemeClasses } from "../../../shared/types/theme";
import { DataSettingsSection } from "./DataSettingsSection";
import { LanguageSection } from "./LanguageSection";
import { LegalSection } from "./LegalSection";
import { ScaleDirectionSection } from "./ScaleDirectionSection";
import { SectorsSettingsSection } from "./SectorsSettingsSection";
import { StatsVisibilitySection } from "./StatsVisibilitySection";
import { ThemeSection } from "./ThemeSection";
import { TutorialSection } from "./TutorialSection";
import { useI18n } from "../../../shared/i18n/I18nContext";

interface SettingsDrawerProps {
    drawerOpen: boolean;
    onClose: () => void;
    theme: ThemeClasses;
    darkMode: boolean;
    setDarkMode: Dispatch<SetStateAction<boolean>>;
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
    isScaleInverted: boolean;
    setIsScaleInverted: Dispatch<SetStateAction<boolean>>;
    resetDay: () => void;
    exportJSON: () => void;
    importJSON: (evt: ChangeEvent<HTMLInputElement>) => void;
    statsVisibility: StatsVisibility;
    setStatsVisibility: Dispatch<SetStateAction<StatsVisibility>>;
    onRestartTutorial: () => void;
    onOpenSOS: () => void;
}

export function SettingsDrawer({
    drawerOpen,
    onClose,
    theme,
    darkMode,
    setDarkMode,
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
    isScaleInverted,
    setIsScaleInverted,
    resetDay,
    exportJSON,
    importJSON,
    statsVisibility,
    setStatsVisibility,
    onRestartTutorial,
    onOpenSOS,
}: SettingsDrawerProps) {
    const { t } = useI18n();

    return (
        <>
            {drawerOpen && (
                <div
                    className={`fixed inset-0 ${theme.overlay} z-40 transition-opacity`}
                    onClick={onClose}
                />
            )}

            <div
                className={`fixed top-0 right-0 h-full w-full max-w-lg ${theme.cardSolid} shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto`}
                style={{
                    transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
                }}
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className={`text-2xl font-bold ${theme.text}`}>{t("settings.title")}</h2>
                        <button
                            onClick={onClose}
                            className={`rounded-full p-2 ${theme.buttonPrimary} transition-colors`}
                        >
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    <div className={`mb-6 p-4 rounded-xl border ${theme.border} sm:hidden`}>
                        <div className={`text-sm font-semibold ${theme.text}`}>{t("settings.quickSos.title")}</div>
                        <p className={`text-xs mt-1 ${theme.textLight}`}>
                            {t("settings.quickSos.desc")}
                        </p>
                        <button
                            type="button"
                            onClick={onOpenSOS}
                            className={`mt-3 w-full rounded-lg border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2 text-sm font-semibold transition-colors`}
                        >
                            {t("settings.quickSos.button")}
                        </button>
                    </div>

                    <hr className={`my-6 ${theme.borderLight} border-t`} />

                    <LanguageSection theme={theme} />

                    <hr className={`my-6 ${theme.borderLight} border-t`} />

                    <SectorsSettingsSection
                        theme={theme}
                        darkMode={darkMode}
                        newName={newName}
                        setNewName={setNewName}
                        addSector={addSector}
                        sectors={sectors}
                        setSectors={setSectors}
                        moveSector={moveSector}
                        removeSector={removeSector}
                        scores={scores}
                        ringCount={ringCount}
                        setScore={setScore}
                        isScaleInverted={isScaleInverted}
                    />

                    <hr className={`my-6 ${theme.borderLight} border-t`} />

                    <ScaleDirectionSection
                        theme={theme}
                        isScaleInverted={isScaleInverted}
                        setIsScaleInverted={setIsScaleInverted}
                    />

                    <hr className={`my-6 ${theme.borderLight} border-t`} />

                    <DataSettingsSection
                        theme={theme}
                        resetDay={resetDay}
                        exportJSON={exportJSON}
                        importJSON={importJSON}
                    />

                    <hr className={`my-6 ${theme.borderLight} border-t`} />

                    <StatsVisibilitySection
                        theme={theme}
                        statsVisibility={statsVisibility}
                        setStatsVisibility={setStatsVisibility}
                    />

                    <hr className={`my-6 ${theme.borderLight} border-t`} />

                    <ThemeSection
                        theme={theme}
                        darkMode={darkMode}
                        setDarkMode={setDarkMode}
                    />

                    <hr className={`my-6 ${theme.borderLight} border-t`} />

                    <TutorialSection
                        theme={theme}
                        onRestartTutorial={onRestartTutorial}
                    />

                    <hr className={`my-6 ${theme.borderLight} border-t`} />

                    <LegalSection theme={theme} />
                </div>
            </div>
        </>
    );
}
