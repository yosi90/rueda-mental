import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

// Pila de diálogos abiertos: solo el último responde a Tab y Escape.
const openDialogs: symbol[] = [];

function getFocusable(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter((el) => !el.closest("[inert]") && el.getClientRects().length > 0);
}

/**
 * Comportamiento accesible de un diálogo modal mientras `open` es true:
 * mueve el foco al contenedor, lo mantiene dentro (Tab / Shift+Tab),
 * cierra con Escape y devuelve el foco al elemento que lo abrió.
 * El contenedor debe tener `tabIndex={-1}`.
 */
export function useDialogA11y(
    open: boolean,
    onClose: () => void,
    containerRef: RefObject<HTMLElement | null>
): void {
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!open) return;
        const id = Symbol("dialog");
        openDialogs.push(id);
        const previouslyFocused = document.activeElement as HTMLElement | null;
        containerRef.current?.focus({ preventScroll: true });

        const handleKeyDown = (event: KeyboardEvent) => {
            if (openDialogs[openDialogs.length - 1] !== id) return;
            const container = containerRef.current;
            if (!container) return;

            if (event.key === "Escape") {
                event.preventDefault();
                onCloseRef.current();
                return;
            }
            if (event.key !== "Tab") return;

            const focusable = getFocusable(container);
            if (focusable.length === 0) {
                event.preventDefault();
                container.focus();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement;
            if (event.shiftKey && (active === first || active === container)) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && active === last) {
                event.preventDefault();
                first.focus();
            } else if (!container.contains(active)) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            const index = openDialogs.indexOf(id);
            if (index >= 0) openDialogs.splice(index, 1);
            if (previouslyFocused?.isConnected) previouslyFocused.focus({ preventScroll: true });
        };
    }, [open, containerRef]);
}
