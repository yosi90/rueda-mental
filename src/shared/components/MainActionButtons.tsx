import type { ReactNode } from "react";
import { useI18n } from "../i18n/I18nContext";
import { theme } from "../theme/theme";

interface MainActionButtonsProps {
    showStatsButton: boolean;
    onOpenStats: () => void;
    /** Intención de abrir estadísticas (hover/foco/toque): precarga su código. */
    onPrefetchStats?: () => void;
    onOpenSummary: () => void;
    onOpenJournal: () => void;
    onOpenSettings: () => void;
    /** Resalta el botón del resumen (lo señala el tutorial). */
    highlightSummary?: boolean;
}

/**
 * Acciones principales. En pantallas pequeñas: barra inferior a todo el ancho con icono y texto.
 * Desde `sm`: botones flotantes arriba a la derecha (solo icono).
 */
export function MainActionButtons({
    showStatsButton,
    onOpenStats,
    onPrefetchStats,
    onOpenSummary,
    onOpenJournal,
    onOpenSettings,
    highlightSummary = false,
}: MainActionButtonsProps) {
    const { t } = useI18n();

    return (
        <nav
            aria-label={t("top.navigation")}
            className={`fixed z-[45] inset-x-0 bottom-0 flex gap-1 border-t ${theme.borderLight} ${theme.cardSolid} px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]
                sm:inset-x-auto sm:bottom-auto sm:top-4 sm:right-4 sm:gap-2 sm:border-0 sm:bg-transparent sm:p-0`}
        >
            {showStatsButton && (
                <ActionButton label={t("top.stats")} onClick={onOpenStats} onIntent={onPrefetchStats}>
                    <path d="M3 3v18h18" />
                    <path d="M18 17V9" />
                    <path d="M13 17V5" />
                    <path d="M8 17v-3" />
                </ActionButton>
            )}
            <ActionButton label={t("top.summary")} onClick={onOpenSummary} highlight={highlightSummary}>
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <line x1="8" y1="8" x2="16" y2="8" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="8" y1="16" x2="14" y2="16" />
            </ActionButton>
            <ActionButton label={t("top.journal")} onClick={onOpenJournal}>
                <path d="M12 7v14" />
                <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
            </ActionButton>
            <ActionButton label={t("top.settings")} onClick={onOpenSettings}>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
            </ActionButton>
        </nav>
    );
}

function ActionButton({ label, onClick, onIntent, highlight = false, children }: {
    label: string;
    onClick: () => void;
    onIntent?: () => void;
    highlight?: boolean;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            onPointerEnter={onIntent}
            onFocus={onIntent}
            onTouchStart={onIntent}
            title={label}
            aria-haspopup="dialog"
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-xs font-medium transition-colors touch-manipulation ${theme.text} hover:bg-subtle
                sm:flex-none sm:px-4 sm:py-2 sm:shadow-lg sm:bg-primary sm:text-primary-fg sm:hover:bg-primary-hover
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                ${highlight ? "ring-4 ring-accent ring-offset-2 motion-safe:animate-pulse" : ""}`}
        >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {children}
            </svg>
            <span className="sm:sr-only">{label}</span>
        </button>
    );
}
