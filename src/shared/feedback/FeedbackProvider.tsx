/* eslint-disable react-refresh/only-export-components */
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type PropsWithChildren,
} from "react";
import { useDialogA11y } from "../hooks/useDialogA11y";
import { useI18n } from "../i18n/I18nContext";

export interface ConfirmOptions {
    message: string;
    confirmLabel: string;
    /** Acción destructiva: botón en rojo y foco inicial en «Cancelar». */
    danger?: boolean;
}

export interface NotifyOptions {
    message: string;
    tone?: "info" | "error";
    actionLabel?: string;
    onAction?: () => void;
}

interface FeedbackContextValue {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
    notify: (options: NotifyOptions) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const TOAST_DURATION_MS = 6000;

interface PendingConfirm extends ConfirmOptions {
    resolve: (value: boolean) => void;
}

interface ToastState extends NotifyOptions {
    id: number;
}

export function FeedbackProvider({ children }: PropsWithChildren) {
    const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
    const [toast, setToast] = useState<ToastState | null>(null);
    const toastIdRef = useRef(0);

    const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => {
        setPendingConfirm({ ...options, resolve });
    }), []);

    const notify = useCallback((options: NotifyOptions) => {
        toastIdRef.current += 1;
        setToast({ ...options, id: toastIdRef.current });
    }, []);

    const dismissToast = useCallback(() => setToast(null), []);
    const value = useMemo(() => ({ confirm, notify }), [confirm, notify]);

    function settleConfirm(result: boolean) {
        pendingConfirm?.resolve(result);
        setPendingConfirm(null);
    }

    return (
        <FeedbackContext.Provider value={value}>
            {children}
            {pendingConfirm && (
                <ConfirmDialog
                    options={pendingConfirm}
                    onConfirm={() => settleConfirm(true)}
                    onCancel={() => settleConfirm(false)}
                />
            )}
            {toast && <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />}
        </FeedbackContext.Provider>
    );
}

export function useFeedback(): FeedbackContextValue {
    const context = useContext(FeedbackContext);
    if (!context) throw new Error("useFeedback must be used within FeedbackProvider");
    return context;
}

function ConfirmDialog({ options, onConfirm, onCancel }: {
    options: ConfirmOptions;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const { t } = useI18n();
    const dialogRef = useRef<HTMLDivElement>(null);
    const cancelRef = useRef<HTMLButtonElement>(null);
    const confirmRef = useRef<HTMLButtonElement>(null);
    const messageId = useId();
    useDialogA11y(true, onCancel, dialogRef, options.danger ? cancelRef : confirmRef);

    const confirmClass = options.danger
        ? "bg-red-600 hover:bg-red-700 text-white"
        : "bg-neutral-900 hover:bg-neutral-700 text-white dark:bg-neutral-100 dark:hover:bg-neutral-300 dark:text-neutral-900";

    return (
        <>
            <div className="fixed inset-0 z-[80] bg-black/50 dark:bg-black/60" onClick={onCancel} aria-hidden="true" />
            <div
                ref={dialogRef}
                role="alertdialog"
                aria-modal="true"
                aria-describedby={messageId}
                tabIndex={-1}
                className="fixed left-1/2 top-1/2 z-[81] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl p-5 shadow-2xl outline-none bg-white text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
            >
                <p id={messageId} className="text-sm leading-relaxed">{options.message}</p>
                <div className="mt-5 flex justify-end gap-2">
                    <button
                        ref={cancelRef}
                        type="button"
                        onClick={onCancel}
                        className="min-h-9 rounded-lg px-4 text-sm font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                        {t("common.cancel")}
                    </button>
                    <button
                        ref={confirmRef}
                        type="button"
                        onClick={onConfirm}
                        className={`min-h-9 rounded-lg px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${confirmClass}`}
                    >
                        {options.confirmLabel}
                    </button>
                </div>
            </div>
        </>
    );
}

function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
    const { t } = useI18n();
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (paused) return;
        const timer = window.setTimeout(onDismiss, TOAST_DURATION_MS);
        return () => window.clearTimeout(timer);
    }, [paused, onDismiss]);

    const toneClass = toast.tone === "error"
        ? "bg-red-700 text-white"
        : "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900";

    return (
        <div
            role={toast.tone === "error" ? "alert" : "status"}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            className={`fixed z-[90] inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm shadow-xl motion-safe:animate-[toast-in_150ms_ease-out]
                sm:inset-x-auto sm:left-1/2 sm:bottom-4 sm:w-max sm:max-w-[calc(100%-2rem)] sm:-translate-x-1/2 ${toneClass}`}
        >
            {/* En móvil: ancho completo y por encima de la barra inferior de acciones */}
            <span className="flex-1 min-w-0">{toast.message}</span>
            {toast.actionLabel && toast.onAction && (
                <button
                    type="button"
                    onClick={() => {
                        toast.onAction?.();
                        onDismiss();
                    }}
                    className="min-h-8 rounded-md px-2 font-semibold underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                    {toast.actionLabel}
                </button>
            )}
            <button
                type="button"
                onClick={onDismiss}
                aria-label={t("common.close")}
                className="min-h-8 min-w-8 rounded-md opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
                <span aria-hidden="true">✕</span>
            </button>
        </div>
    );
}
