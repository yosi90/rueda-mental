// Formatea una fecha para el input type="date" (YYYY-MM-DD)
export function formatDateInput(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}

// Obtiene la fecha de hoy formateada
export function getTodayString(): string {
    return formatDateInput(new Date());
}