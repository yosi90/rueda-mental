import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import {
    Angry,
    Annoyed,
    Check,
    ChevronLeft,
    ChevronRight,
    CloudRain,
    Laugh,
    Meh,
    ShieldCheck,
    Smile,
    Sun,
    type LucideIcon,
} from "lucide-react";
import type { DailySummary } from "../../../shared/types/mentalWheel";
import { useI18n } from "../../../shared/i18n/I18nContext";
import type { TranslationKey } from "../../../shared/i18n/translations";
import { useDialogA11y } from "../../../shared/hooks/useDialogA11y";
import { CloseIcon } from "../../../shared/components/CloseIcon";
import { theme } from "../../../shared/theme/theme";
import type { SummaryTextField } from "../../../shared/utils/summary";

interface SummaryModalProps {
    open: boolean;
    onClose: () => void;
    summaryDateLabel: string;
    dailySummary: DailySummary;
    onChangeField: (field: SummaryTextField, text: string) => void;
    /** undefined quita el estado de ánimo. */
    onChangeMood: (mood: number | undefined) => void;
    onPrevDay: () => void;
    onNextDay: () => void;
}

interface PromptDefinition {
    field: SummaryTextField;
    labelKey: TranslationKey;
    placeholderKey: TranslationKey;
    Icon: LucideIcon;
    /** Clases del icono y del borde de acento de la tarjeta. */
    tint: string;
    border: string;
}

const PROMPTS: readonly PromptDefinition[] = [
    {
        field: "good",
        labelKey: "summary.good",
        placeholderKey: "summary.goodPlaceholder",
        Icon: Sun,
        tint: "bg-amber-400/20 text-amber-700 dark:text-amber-300",
        border: "border-l-amber-400",
    },
    {
        field: "bad",
        labelKey: "summary.bad",
        placeholderKey: "summary.badPlaceholder",
        Icon: CloudRain,
        tint: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
        border: "border-l-sky-400",
    },
    {
        field: "howFacedBad",
        labelKey: "summary.howFaced",
        placeholderKey: "summary.howFacedPlaceholder",
        Icon: ShieldCheck,
        tint: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        border: "border-l-emerald-500",
    },
];

const MOODS: ReadonlyArray<{ value: number; Icon: LucideIcon; labelKey: TranslationKey }> = [
    { value: 1, Icon: Angry, labelKey: "summary.mood.1" },
    { value: 2, Icon: Annoyed, labelKey: "summary.mood.2" },
    { value: 3, Icon: Meh, labelKey: "summary.mood.3" },
    { value: 4, Icon: Smile, labelKey: "summary.mood.4" },
    { value: 5, Icon: Laugh, labelKey: "summary.mood.5" },
];

const SAVED_DELAY_MS = 700;
const SAVED_VISIBLE_MS = 2500;

export function SummaryModal({
    open,
    onClose,
    summaryDateLabel,
    dailySummary,
    onChangeField,
    onChangeMood,
    onPrevDay,
    onNextDay,
}: SummaryModalProps) {
    const { t } = useI18n();
    const dialogRef = useRef<HTMLDivElement>(null);
    const idPrefix = useId();
    const [editCount, setEditCount] = useState(0);
    const [savedVisible, setSavedVisible] = useState(false);
    useDialogA11y(open, onClose, dialogRef);

    // «Guardado ✓» poco después de dejar de escribir (los datos ya se guardan al instante)
    useEffect(() => {
        if (editCount === 0) return;
        const show = window.setTimeout(() => setSavedVisible(true), SAVED_DELAY_MS);
        const hide = window.setTimeout(() => setSavedVisible(false), SAVED_DELAY_MS + SAVED_VISIBLE_MS);
        return () => {
            window.clearTimeout(show);
            window.clearTimeout(hide);
        };
    }, [editCount]);

    if (!open) return null;

    const titleId = `${idPrefix}-title`;
    const markEdited = () => {
        setSavedVisible(false);
        setEditCount((n) => n + 1);
    };
    const navButtonClass = `inline-flex h-9 w-9 items-center justify-center rounded-full ${theme.button} transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`;

    return (
        <>
            <div className={`fixed inset-0 ${theme.overlay} z-50`} onClick={onClose} aria-hidden="true" />
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className={`fixed z-50 inset-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[min(42rem,calc(100%-2rem))] sm:max-h-[calc(100%-3rem)] sm:rounded-2xl ${theme.cardSolid} ${theme.text} shadow-2xl flex flex-col outline-none`}
            >
                <header className={`flex items-center gap-2 border-b ${theme.borderLight} px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:pt-5`}>
                    <button type="button" onClick={onPrevDay} className={navButtonClass} aria-label={t("panel.prevDay")} title={t("panel.prevDay")}>
                        <ChevronLeft size={18} aria-hidden="true" />
                    </button>
                    <div className="min-w-0 flex-1 text-center">
                        <h2 id={titleId} className="text-xl sm:text-2xl font-bold leading-tight">{t("summary.title")}</h2>
                        <p className={`text-sm ${theme.textMuted}`}>{summaryDateLabel.charAt(0).toUpperCase() + summaryDateLabel.slice(1)}</p>
                    </div>
                    <button type="button" onClick={onNextDay} className={navButtonClass} aria-label={t("panel.nextDay")} title={t("panel.nextDay")}>
                        <ChevronRight size={18} aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`ml-1 rounded-full p-1.5 ${theme.buttonPrimary} transition-colors`}
                        title={t("summary.closeTitle")}
                        aria-label={t("summary.closeTitle")}
                    >
                        <CloseIcon />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 space-y-5">
                    <fieldset>
                        <legend className="mb-2 text-sm font-semibold">{t("summary.moodQuestion")}</legend>
                        <div role="radiogroup" aria-label={t("summary.moodQuestion")} className="grid grid-cols-5 gap-2">
                            {MOODS.map(({ value, Icon, labelKey }) => {
                                const selected = dailySummary.mood === value;
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected}
                                        onClick={() => {
                                            onChangeMood(selected ? undefined : value);
                                            markEdited();
                                        }}
                                        className={`flex flex-col items-center gap-1 rounded-xl border-2 px-1 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                                            selected ? "border-accent bg-accent-soft text-fg" : `border-transparent ${theme.subtle} ${theme.textMuted} hover:text-fg`
                                        }`}
                                    >
                                        <Icon size={26} strokeWidth={selected ? 2.25 : 1.75} aria-hidden="true" />
                                        <span className="leading-tight text-center">{t(labelKey)}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

                    {PROMPTS.map(({ field, labelKey, placeholderKey, Icon, tint, border }) => {
                        const fieldId = `${idPrefix}-${field}`;
                        return (
                            <section key={field} className={`rounded-xl border border-l-4 ${theme.borderLight} ${border} ${theme.inputAlt} p-3 sm:p-4`}>
                                <label htmlFor={fieldId} className="flex items-center gap-2 text-sm font-semibold">
                                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${tint}`} aria-hidden="true">
                                        <Icon size={17} />
                                    </span>
                                    {t(labelKey)}
                                </label>
                                <AutoGrowTextarea
                                    id={fieldId}
                                    value={dailySummary[field]}
                                    placeholder={t(placeholderKey)}
                                    onChange={(text) => {
                                        onChangeField(field, text);
                                        markEdited();
                                    }}
                                />
                            </section>
                        );
                    })}
                </div>

                <footer className={`flex items-center justify-between gap-3 border-t ${theme.borderLight} px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6`}>
                    <p className={`text-xs ${theme.textMuted}`} aria-live="polite">
                        {savedVisible ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                                <Check size={14} aria-hidden="true" />
                                {t("summary.saved")}
                            </span>
                        ) : (
                            t("summary.privateHint")
                        )}
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`rounded-lg ${theme.buttonPrimary} px-5 py-2 text-sm font-semibold transition-colors`}
                    >
                        {t("summary.done")}
                    </button>
                </footer>
            </div>
        </>
    );
}

/** Área de texto sin bordes que crece con el contenido (mínimo 3 líneas). */
function AutoGrowTextarea({ id, value, placeholder, onChange }: {
    id: string;
    value: string;
    placeholder: string;
    onChange: (text: string) => void;
}) {
    const ref = useRef<HTMLTextAreaElement>(null);
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
    }, [value]);

    return (
        <textarea
            ref={ref}
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            placeholder={placeholder}
            className="mt-2 block w-full resize-none overflow-hidden rounded-lg bg-transparent px-1 py-1 text-[15px] leading-relaxed text-fg placeholder:text-fg-muted/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        />
    );
}
