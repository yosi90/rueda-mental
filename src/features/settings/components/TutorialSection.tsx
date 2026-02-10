import type { ThemeClasses } from "../../../shared/types/theme";

interface TutorialSectionProps {
    theme: Pick<ThemeClasses, "inputAlt" | "border" | "text" | "textLight" | "buttonPrimary">;
    onRestartTutorial: () => void;
}

export function TutorialSection({ theme, onRestartTutorial }: TutorialSectionProps) {
    return (
        <div className={`mb-6 p-4 rounded-xl ${theme.inputAlt} ${theme.border} border`}>
            <div className="flex items-center justify-between">
                <div>
                    <div className={`text-sm font-medium ${theme.text}`}>Tutorial</div>
                    <div className={`text-xs ${theme.textLight}`}>
                        Vuelve a ver la guía interactiva paso a paso de la aplicación.
                    </div>
                </div>
                <button
                    onClick={onRestartTutorial}
                    className={`${theme.buttonPrimary} rounded-md px-3 py-2 text-sm font-semibold transition-colors`}
                >
                    Reiniciar tutorial
                </button>
            </div>
        </div>
    );
}
