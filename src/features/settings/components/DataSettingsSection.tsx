import type { ChangeEvent } from "react";
import type { ThemeClasses } from "../../../shared/types/theme";

interface DataSettingsSectionProps {
    theme: Pick<ThemeClasses, "inputAlt" | "border" | "text" | "textLight" | "button">;
    resetDay: () => void;
    exportJSON: () => void;
    importJSON: (evt: ChangeEvent<HTMLInputElement>) => void;
}

export function DataSettingsSection({
    theme,
    resetDay,
    exportJSON,
    importJSON,
}: DataSettingsSectionProps) {
    return (
        <div className={`mb-6 p-4 rounded-xl ${theme.inputAlt} ${theme.border} border`}>
            <div className="flex items-center justify-between mb-3">
                <div>
                    <div className={`text-lg font-semibold ${theme.text}`}>Datos</div>
                    <div className={`text-xs ${theme.textLight}`}>
                        Resetea el día actual o guarda/carga tus datos en JSON para poder usarlos en otro dispositivo
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
                <button
                    onClick={() => {
                        if (confirm("¿Seguro que quieres resetear las puntuaciones del día actual?")) {
                            resetDay();
                        }
                    }}
                    className={`flex-1 rounded-lg border ${theme.border} ${theme.button} px-3 py-2 text-sm transition-colors`}
                >
                    Resetear día
                </button>

                <button
                    onClick={exportJSON}
                    className={`flex-1 rounded-lg border ${theme.border} ${theme.button} px-3 py-2 text-sm transition-colors`}
                >
                    Exportar JSON
                </button>

                <label className={`flex-1 rounded-lg border ${theme.border} ${theme.button} px-3 py-2 text-sm cursor-pointer text-center transition-colors`}>
                    Importar JSON
                    <input type="file" accept="application/json" className="hidden" onChange={importJSON} />
                </label>
            </div>
        </div>
    );
}
