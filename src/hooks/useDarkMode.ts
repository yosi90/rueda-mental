import { useEffect, useState } from 'react';
import { loadDarkMode, saveDarkMode } from '../services';

export function useDarkMode() {
    const [darkMode, setDarkMode] = useState<boolean>(() => loadDarkMode());

    useEffect(() => {
        saveDarkMode(darkMode);
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode(prev => !prev);

    return { darkMode, setDarkMode, toggleDarkMode };
}