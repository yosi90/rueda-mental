export function formatDateInput(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}

// Interpreta "YYYY-MM-DD" como medianoche local. `new Date("YYYY-MM-DD")` usa UTC
// y desplaza el día en zonas horarias al oeste de Greenwich.
export function parseDateInput(dateStr: string): Date {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
}

export function addDaysToDateInput(dateStr: string, days: number): string {
    const date = parseDateInput(dateStr);
    date.setDate(date.getDate() + days);
    return formatDateInput(date);
}
