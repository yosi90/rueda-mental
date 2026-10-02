import { useEffect, useState } from "react";
import { DEFAULT_STATS_VISIBILITY } from "../shared/constants/mentalWheel";
import {
    loadDarkMode,
    loadScaleInverted,
    loadStatsVisibility,
    saveDarkMode,
    saveScaleInverted,
    saveStatsVisibility,
} from "../shared/services/storage/mentalWheelStorage";
import type { StatsVisibility } from "../shared/types/mentalWheel";

/** Preferencias de visualización persistidas: tema, dirección de la escala y estadísticas visibles. */
export function usePreferences() {
    const [darkMode, setDarkMode] = useState<boolean>(() => loadDarkMode());
    const [isScaleInverted, setIsScaleInverted] = useState<boolean>(() => loadScaleInverted());
    const [statsVisibility, setStatsVisibility] = useState<StatsVisibility>(() =>
        loadStatsVisibility(DEFAULT_STATS_VISIBILITY)
    );

    useEffect(() => {
        saveDarkMode(darkMode);
        document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    }, [darkMode]);
    useEffect(() => saveScaleInverted(isScaleInverted), [isScaleInverted]);
    useEffect(() => saveStatsVisibility(statsVisibility), [statsVisibility]);

    return {
        darkMode,
        setDarkMode,
        isScaleInverted,
        setIsScaleInverted,
        statsVisibility,
        setStatsVisibility,
    };
}
