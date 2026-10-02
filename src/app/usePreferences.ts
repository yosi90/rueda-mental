import { useEffect, useState } from "react";
import { DEFAULT_STATS_VISIBILITY } from "../shared/constants/mentalWheel";
import {
    loadDarkMode,
    loadScaleInverted,
    loadShowReference,
    loadStatsVisibility,
    saveDarkMode,
    saveScaleInverted,
    saveShowReference,
    saveStatsVisibility,
} from "../shared/services/storage/mentalWheelStorage";
import type { StatsVisibility } from "../shared/types/mentalWheel";

/** Preferencias de visualización persistidas: tema, escala, estadísticas visibles y día de referencia. */
export function usePreferences() {
    const [darkMode, setDarkMode] = useState<boolean>(() => loadDarkMode());
    const [isScaleInverted, setIsScaleInverted] = useState<boolean>(() => loadScaleInverted());
    const [statsVisibility, setStatsVisibility] = useState<StatsVisibility>(() =>
        loadStatsVisibility(DEFAULT_STATS_VISIBILITY)
    );
    const [showReference, setShowReference] = useState<boolean>(() => loadShowReference());

    useEffect(() => {
        saveDarkMode(darkMode);
        document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    }, [darkMode]);
    useEffect(() => saveScaleInverted(isScaleInverted), [isScaleInverted]);
    useEffect(() => saveStatsVisibility(statsVisibility), [statsVisibility]);
    useEffect(() => saveShowReference(showReference), [showReference]);

    return {
        darkMode,
        setDarkMode,
        isScaleInverted,
        setIsScaleInverted,
        statsVisibility,
        setStatsVisibility,
        showReference,
        setShowReference,
    };
}
