import { useEffect, useState } from "react";
import {
    hasTutorialBeenShown,
    markTutorialAsShown,
} from "../../../shared/services/storage/mentalWheelStorage";
import type {
    InfoMenuContextual,
    ScoresByDate,
    Sector,
} from "../../../shared/types/mentalWheel";

interface UseTutorialFlowParams {
    sectors: Sector[];
    scoresByDate: ScoresByDate;
    dateStr: string;
    infoMenuContextual: InfoMenuContextual | null;
    summaryOpen: boolean;
}

interface UseTutorialFlowResult {
    tutorialStep: number;
    tutorialSector: Sector | undefined;
    restartTutorial: () => void;
    skipTutorial: () => void;
}

// El tutorial usa el cuarto sector (o el último si hay menos).
const PREFERRED_TUTORIAL_SECTOR_INDEX = 3;

export function useTutorialFlow({
    sectors,
    scoresByDate,
    dateStr,
    infoMenuContextual,
    summaryOpen,
}: UseTutorialFlowParams): UseTutorialFlowResult {
    const [tutorialStep, setTutorialStep] = useState<number>(() => (
        hasTutorialBeenShown() ? 0 : 1
    ));

    const tutorialSector = sectors[Math.min(PREFERRED_TUTORIAL_SECTOR_INDEX, sectors.length - 1)];

    useEffect(() => {
        if (tutorialStep !== 1) return;
        const todayScores = scoresByDate[dateStr] || {};
        if (tutorialSector && todayScores[tutorialSector.id] !== undefined) {
            setTutorialStep(2);
        }
    }, [tutorialStep, tutorialSector, scoresByDate, dateStr]);

    useEffect(() => {
        if (tutorialStep === 2 && infoMenuContextual) {
            setTutorialStep(3);
        }
    }, [tutorialStep, infoMenuContextual]);

    useEffect(() => {
        if (tutorialStep === 3 && infoMenuContextual === null) {
            setTutorialStep(summaryOpen ? 5 : 4);
        }
    }, [tutorialStep, infoMenuContextual, summaryOpen]);

    useEffect(() => {
        if (tutorialStep === 4 && summaryOpen) {
            setTutorialStep(5);
        }
    }, [tutorialStep, summaryOpen]);

    useEffect(() => {
        if (tutorialStep === 5 && !summaryOpen) {
            setTutorialStep(6);
        }
    }, [tutorialStep, summaryOpen]);

    useEffect(() => {
        if (tutorialStep !== 6) return;
        markTutorialAsShown();
        const hideTimer = setTimeout(() => setTutorialStep(0), 10000);
        return () => clearTimeout(hideTimer);
    }, [tutorialStep]);

    function restartTutorial() {
        setTutorialStep(1);
    }

    function skipTutorial() {
        markTutorialAsShown();
        setTutorialStep(0);
    }

    return {
        tutorialStep,
        tutorialSector,
        restartTutorial,
        skipTutorial,
    };
}
