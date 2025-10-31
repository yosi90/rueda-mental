import { useEffect, useState } from 'react';
import type { ScoresByDate } from '../types';
import { loadScores, saveScores } from '../services';

export function useScores(dateStr: string) {
    const [scoresByDate, setScoresByDate] = useState<ScoresByDate>(() => loadScores());
    const scores = scoresByDate[dateStr] || {};

    // Guardar en localStorage cuando cambian los datos
    useEffect(() => {
        saveScores(scoresByDate);
    }, [scoresByDate]);

    // Asegura que todos los sectores tengan un score en el día actual
    useEffect(() => {
        if (!scoresByDate[dateStr]) {
            setScoresByDate((prev) => ({ ...prev, [dateStr]: {} }));
        }
    }, [dateStr, scoresByDate]);

    const setScore = (sectorId: string, value: string | number) => {
        const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
        if (isNaN(numValue)) return;

        setScoresByDate((prev) => ({
            ...prev,
            [dateStr]: {
                ...prev[dateStr],
                [sectorId]: numValue,
            },
        }));
    };

    const replaceAllScores = (newScoresByDate: ScoresByDate) => {
        setScoresByDate(newScoresByDate);
    };

    return {
        scores,
        scoresByDate,
        setScore,
        replaceAllScores,
    };
}