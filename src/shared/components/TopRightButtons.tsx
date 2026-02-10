interface TopRightButtonsProps {
    showStatsButton: boolean;
    buttonPrimaryClass: string;
    onOpenStats: () => void;
    onOpenSummary: () => void;
    onOpenSettings: () => void;
}

export function TopRightButtons({
    showStatsButton,
    buttonPrimaryClass,
    onOpenStats,
    onOpenSummary,
    onOpenSettings,
}: TopRightButtonsProps) {
    return (
        <div className="fixed top-[17px] sm:top-4 right-5 sm:right-4 z-[45] flex gap-2">
            {showStatsButton && (
                <button
                    type="button"
                    onClick={onOpenStats}
                    className={`rounded-lg ${buttonPrimaryClass} p-2 sm:px-4 sm:py-2 shadow-lg transition-colors touch-manipulation`}
                    title="Estadísticas"
                >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 translate-x-[-1px] sm:translate-x-0 translate-y-[-1px] sm:translate-y-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3v18h18" />
                        <path d="M18 17V9" />
                        <path d="M13 17V5" />
                        <path d="M8 17v-3" />
                    </svg>
                </button>
            )}

            <button
                type="button"
                onClick={onOpenSummary}
                className={`rounded-lg ${buttonPrimaryClass} p-2 sm:px-4 sm:py-2 shadow-lg transition-colors touch-manipulation`}
                title="Resumen del día"
            >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="3" width="16" height="18" rx="2" />
                    <line x1="8" y1="8" x2="16" y2="8" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                    <line x1="8" y1="16" x2="14" y2="16" />
                </svg>
            </button>

            <button
                type="button"
                onClick={onOpenSettings}
                className={`rounded-lg ${buttonPrimaryClass} p-2 sm:px-4 sm:py-2 shadow-lg transition-colors touch-manipulation`}
                title="Configuración"
            >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 translate-x-[-1px] sm:translate-x-0 translate-y-[-2px] sm:translate-y-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>
        </div>
    );
}
