import { getTodayString } from '../../utils';

interface DateSelectorProps {
    dateStr: string;
    onDateChange: (date: string) => void;
    darkMode: boolean;
}

export function DateSelector({ dateStr, onDateChange, darkMode }: DateSelectorProps) {
    const todayStr = getTodayString();

    const handlePrevDay = () => {
        const d = new Date(dateStr);
        d.setDate(d.getDate() - 1);
        onDateChange(d.toISOString().split('T')[0]);
    };

    const handleNextDay = () => {
        const d = new Date(dateStr);
        d.setDate(d.getDate() + 1);
        onDateChange(d.toISOString().split('T')[0]);
    };

    const handleToday = () => {
        onDateChange(todayStr);
    };

    return (
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
                onClick={handlePrevDay}
                className={`rounded-lg px-3 py-2 text-sm transition-colors border flex-shrink-0 ${darkMode
                        ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700'
                        : 'bg-white hover:bg-neutral-100 border-neutral-300'
                    }`}
                title="Día anterior"
            >
                ◀
            </button>

            <input
                type="date"
                value={dateStr}
                onChange={(e) => onDateChange(e.target.value)}
                className={`flex-1 min-w-0 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${darkMode
                        ? 'bg-neutral-800 border-neutral-700 text-neutral-100 focus:ring-neutral-100'
                        : 'bg-white border-neutral-300 text-neutral-900 focus:ring-neutral-900'
                    }`}
            />

            <button
                onClick={handleNextDay}
                className={`rounded-lg px-3 py-2 text-sm transition-colors border flex-shrink-0 ${darkMode
                        ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700'
                        : 'bg-white hover:bg-neutral-100 border-neutral-300'
                    }`}
                title="Día siguiente"
            >
                ▶
            </button>

            <button
                onClick={handleToday}
                disabled={dateStr === todayStr}
                className={`rounded-lg px-3 py-2 text-sm transition-colors border flex-shrink-0 ${dateStr === todayStr
                        ? darkMode
                            ? 'bg-neutral-900 text-neutral-600 border-neutral-800 cursor-not-allowed'
                            : 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
                        : darkMode
                            ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700'
                            : 'bg-white hover:bg-neutral-100 border-neutral-300'
                    }`}
                title="Ir a hoy"
            >
                Hoy
            </button>
        </div>
    );
}