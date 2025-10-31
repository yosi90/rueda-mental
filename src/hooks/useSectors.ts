import { useEffect, useState } from 'react';
import type { Sector } from '../types';
import { loadConfigOrDefault, saveConfig } from '../services';

export function useSectors() {
    const [sectors, setSectors] = useState<Sector[]>(() => loadConfigOrDefault());

    // Guardar en localStorage cuando cambia la configuración
    useEffect(() => {
        saveConfig(sectors);
    }, [sectors]);

    const addSector = (name: string) => {
        if (!name.trim()) return;

        const newSector: Sector = {
            id: `sector-${Date.now()}`,
            name: name.trim(),
            color: `hsl(${Math.random() * 360} 70% 60%)`,
        };

        setSectors((prev) => [...prev, newSector]);
    };

    const removeSector = (id: string) => {
        setSectors((prev) => prev.filter((s) => s.id !== id));
    };

    const updateSectorName = (id: string, name: string) => {
        setSectors((prev) =>
            prev.map((s) => (s.id === id ? { ...s, name } : s))
        );
    };

    const updateSectorColor = (id: string, color: string) => {
        setSectors((prev) =>
            prev.map((s) => (s.id === id ? { ...s, color } : s))
        );
    };

    const moveSector = (id: string, direction: number) => {
        setSectors((prev) => {
            const idx = prev.findIndex((s) => s.id === id);
            if (idx === -1) return prev;

            const newIdx = idx + direction;
            if (newIdx < 0 || newIdx >= prev.length) return prev;

            const newArr = [...prev];
            [newArr[idx], newArr[newIdx]] = [newArr[newIdx], newArr[idx]];
            return newArr;
        });
    };

    const replaceAllSectors = (newSectors: Sector[]) => {
        setSectors(newSectors);
    };

    return {
        sectors,
        addSector,
        removeSector,
        updateSectorName,
        updateSectorColor,
        moveSector,
        replaceAllSectors,
    };
}