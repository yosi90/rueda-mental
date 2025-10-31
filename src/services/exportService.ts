import type { Sector, ScoresByDate } from '../types';

export interface ExportData {
    version: string;
    exportDate: string;
    sectors: Sector[];
    scoresByDate: ScoresByDate;
}

// Exporta todos los datos a JSON
export function exportData(sectors: Sector[], scoresByDate: ScoresByDate): string {
    const data: ExportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        sectors,
        scoresByDate,
    };

    return JSON.stringify(data, null, 2);
}

// Descarga los datos como archivo JSON
export function downloadJSON(sectors: Sector[], scoresByDate: ScoresByDate): void {
    const json = exportData(sectors, scoresByDate);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `mental-wheel-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Importa datos desde JSON
export function importData(jsonString: string): ExportData | null {
    try {
        const data = JSON.parse(jsonString);

        // Validación básica
        if (!data.sectors || !Array.isArray(data.sectors)) {
            throw new Error('Formato de datos inválido: falta "sectors"');
        }

        if (!data.scoresByDate || typeof data.scoresByDate !== 'object') {
            throw new Error('Formato de datos inválido: falta "scoresByDate"');
        }

        return data as ExportData;
    } catch (error) {
        console.error('Error al importar datos:', error);
        return null;
    }
}

// Lee un archivo y devuelve su contenido como string
export function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === 'string') {
                resolve(result);
            } else {
                reject(new Error('No se pudo leer el archivo'));
            }
        };

        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsText(file);
    });
}