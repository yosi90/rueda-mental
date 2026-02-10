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
    restartTutorial: () => void;
}

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

    useEffect(() => {
        if (tutorialStep !== 1) return;
        const firstSectorId = sectors[3]?.id;
        const todayScores = scoresByDate[dateStr] || {};
        if (firstSectorId && todayScores[firstSectorId] !== undefined) {
            setTutorialStep(2);
        }
    }, [tutorialStep, sectors, scoresByDate, dateStr]);

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

    return {
        tutorialStep,
        restartTutorial,
    };
}
