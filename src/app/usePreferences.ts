import { useEffect, useState } from "react";
import { DEFAULT_STATS_VISIBILITY } from "../shared/constants/mentalWheel";
import {
    loadAppStyle,
    loadBackgroundImage,
    loadScaleInverted,
    loadShowReference,
    loadStatsVisibility,
    saveAppStyle,
    saveBackgroundImage,
    saveScaleInverted,
    saveShowReference,
    saveStatsVisibility,
} from "../shared/services/storage/mentalWheelStorage";
import type { StatsVisibility } from "../shared/types/mentalWheel";
import { APP_STYLE_DEFINITIONS, applyAppStyle, type AppStyle } from "../shared/theme/styles";

/** Preferencias de visualización persistidas: estilo, escala, estadísticas visibles y día de referencia. */
export function usePreferences() {
    const [style, setStyle] = useState<AppStyle>(() => loadAppStyle());
    const [backgroundImage, setBackgroundImage] = useState<boolean>(() => loadBackgroundImage());
    const [isScaleInverted, setIsScaleInverted] = useState<boolean>(() => loadScaleInverted());
    const [statsVisibility, setStatsVisibility] = useState<StatsVisibility>(() =>
        loadStatsVisibility(DEFAULT_STATS_VISIBILITY)
    );
    const [showReference, setShowReference] = useState<boolean>(() => loadShowReference());

    useEffect(() => {
        saveAppStyle(style);
        saveBackgroundImage(backgroundImage);
        applyAppStyle(style, backgroundImage);
    }, [style, backgroundImage]);
    useEffect(() => saveScaleInverted(isScaleInverted), [isScaleInverted]);
    useEffect(() => saveStatsVisibility(statsVisibility), [statsVisibility]);
    useEffect(() => saveShowReference(showReference), [showReference]);

    return {
        style,
        setStyle,
        backgroundImage,
        setBackgroundImage,
        darkMode: APP_STYLE_DEFINITIONS[style].mode === "dark",
        isScaleInverted,
        setIsScaleInverted,
        statsVisibility,
        setStatsVisibility,
        showReference,
        setShowReference,
    };
}
