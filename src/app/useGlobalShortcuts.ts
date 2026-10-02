import { useEffect, useRef } from "react";
import { hasOpenDialog } from "../shared/hooks/useDialogA11y";

interface ShortcutHandlers {
    onPrevDay: () => void;
    onNextDay: () => void;
    onToday: () => void;
}

/** ← / → cambian de día y T vuelve a hoy (fuera de campos, sliders y diálogos). */
export function useGlobalShortcuts(handlers: ShortcutHandlers): void {
    const handlersRef = useRef(handlers);
    useEffect(() => {
        handlersRef.current = handlers;
    });

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || hasOpenDialog()) return;
            const target = event.target as HTMLElement | null;
            if (target?.closest("input, textarea, select, [contenteditable='true'], [role='slider'], [role='dialog']")) return;

            const { onPrevDay, onNextDay, onToday } = handlersRef.current;
            if (event.key === "ArrowLeft") onPrevDay();
            else if (event.key === "ArrowRight") onNextDay();
            else if (event.key === "t" || event.key === "T") onToday();
            else return;
            event.preventDefault();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);
}
