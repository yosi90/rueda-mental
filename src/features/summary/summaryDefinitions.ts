import { Angry, Annoyed, CloudRain, Laugh, Meh, ShieldCheck, Smile, Sun, type LucideIcon } from "lucide-react";
import type { TranslationKey } from "../../shared/i18n/translations";
import type { SummaryTextField } from "../../shared/utils/summary";

/** Preguntas del resumen del día y estados de ánimo (compartidos por el resumen y el diario). */
export interface PromptDefinition {
    field: SummaryTextField;
    labelKey: TranslationKey;
    placeholderKey: TranslationKey;
    Icon: LucideIcon;
    /** Clases del icono y del borde de acento de la tarjeta. */
    tint: string;
    border: string;
}

export const PROMPTS: readonly PromptDefinition[] = [
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

export const MOODS: ReadonlyArray<{ value: number; Icon: LucideIcon; labelKey: TranslationKey }> = [
    { value: 1, Icon: Angry, labelKey: "summary.mood.1" },
    { value: 2, Icon: Annoyed, labelKey: "summary.mood.2" },
    { value: 3, Icon: Meh, labelKey: "summary.mood.3" },
    { value: 4, Icon: Smile, labelKey: "summary.mood.4" },
    { value: 5, Icon: Laugh, labelKey: "summary.mood.5" },
];
