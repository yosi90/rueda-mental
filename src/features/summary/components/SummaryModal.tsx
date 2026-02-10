import type { DailySummary } from "../../../shared/types/mentalWheel";
import type { ThemeClasses } from "../../../shared/types/theme";

interface SummaryModalProps {
    open: boolean;
    onClose: () => void;
    theme: Pick<ThemeClasses, "overlay" | "cardSolid" | "borderLight" | "text" | "textMuted" | "border" | "inputAlt" | "input" | "buttonPrimary">;
    summaryDateLabel: string;
    dailySummary: DailySummary;
    darkMode: boolean;
    onChangeField: (field: keyof DailySummary, text: string) => void;
}

export function SummaryModal({
    open,
    onClose,
    theme,
    summaryDateLabel,
    dailySummary,
    darkMode,
    onChangeField,
}: SummaryModalProps) {
    if (!open) return null;

    return (
        <>
            <div
                className={`fixed inset-0 ${theme.overlay} z-50 transition-opacity`}
                onClick={onClose}
            />
            <div className={`fixed inset-4 sm:inset-8 md:inset-x-20 md:inset-y-12 lg:inset-x-40 lg:inset-y-16 ${theme.cardSolid} shadow-2xl z-50 rounded-2xl overflow-hidden flex flex-col`}>
                <div className={`flex items-center justify-between p-4 md:p-6 border-b ${theme.borderLight}`}>
                    <div>
                        <h2 className={`text-xl md:text-2xl font-bold ${theme.text}`}>Resumen de mi día</h2>
                        <p className={`text-xs md:text-sm ${theme.textMuted} mt-1 capitalize`}>{summaryDateLabel}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`rounded-full p-2 ${theme.buttonPrimary} transition-colors`}
                        title="Cerrar resumen"
                    >
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className={`rounded-xl border ${theme.border} p-4 md:p-5 ${theme.inputAlt} space-y-4`}>
                        <p className={`text-xs sm:text-sm ${theme.textMuted}`}>
                            Este resumen se guarda automáticamente en tu dispositivo para la fecha seleccionada.
                        </p>

                        <div className="space-y-2">
                            <label className={`block text-sm font-semibold ${theme.text}`}>Lo bueno</label>
                            <textarea
                                value={dailySummary.good}
                                onChange={(e) => onChangeField("good", e.target.value)}
                                rows={4}
                                placeholder="¿Qué salió bien hoy?"
                                className={`w-full resize-y rounded-lg border ${theme.input} px-3 py-2 text-sm focus:outline-none focus:ring-2 ${darkMode ? "focus:ring-neutral-100" : "focus:ring-neutral-900"}`}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className={`block text-sm font-semibold ${theme.text}`}>Lo malo</label>
                            <textarea
                                value={dailySummary.bad}
                                onChange={(e) => onChangeField("bad", e.target.value)}
                                rows={4}
                                placeholder="¿Qué no salió como esperabas?"
                                className={`w-full resize-y rounded-lg border ${theme.input} px-3 py-2 text-sm focus:outline-none focus:ring-2 ${darkMode ? "focus:ring-neutral-100" : "focus:ring-neutral-900"}`}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className={`block text-sm font-semibold ${theme.text}`}>Cómo enfrenté lo malo</label>
                            <textarea
                                value={dailySummary.howFacedBad}
                                onChange={(e) => onChangeField("howFacedBad", e.target.value)}
                                rows={4}
                                placeholder="¿Cómo lo afrontaste o cómo piensas afrontarlo?"
                                className={`w-full resize-y rounded-lg border ${theme.input} px-3 py-2 text-sm focus:outline-none focus:ring-2 ${darkMode ? "focus:ring-neutral-100" : "focus:ring-neutral-900"}`}
                            />
                        </div>
                    </div>
                </div>

                <div className={`p-4 md:px-6 md:pb-6 border-t ${theme.borderLight} flex justify-end`}>
                    <button
                        onClick={onClose}
                        className={`rounded-lg ${theme.buttonPrimary} px-4 py-2 text-sm transition-colors`}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </>
    );
}