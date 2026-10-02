import { useId, useRef } from "react";
import type { DailySummary } from "../../../shared/types/mentalWheel";
import { useI18n } from "../../../shared/i18n/I18nContext";
import type { TranslationKey } from "../../../shared/i18n/translations";
import { useDialogA11y } from "../../../shared/hooks/useDialogA11y";
import { CloseIcon } from "../../../shared/components/CloseIcon";
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

const SUMMARY_FIELDS: ReadonlyArray<{ field: keyof DailySummary; labelKey: TranslationKey; placeholderKey: TranslationKey }> = [
    { field: "good", labelKey: "summary.good", placeholderKey: "summary.goodPlaceholder" },
    { field: "bad", labelKey: "summary.bad", placeholderKey: "summary.badPlaceholder" },
    { field: "howFacedBad", labelKey: "summary.howFaced", placeholderKey: "summary.howFacedPlaceholder" },
];

export function SummaryModal({
    open,
    onClose,
    theme,
    summaryDateLabel,
    dailySummary,
    darkMode,
    onChangeField,
}: SummaryModalProps) {
    const { t } = useI18n();
    const dialogRef = useRef<HTMLDivElement>(null);
    const idPrefix = useId();
    useDialogA11y(open, onClose, dialogRef);
    if (!open) return null;

    const titleId = `${idPrefix}-title`;

    return (
        <>
            <div
                className={`fixed inset-0 ${theme.overlay} z-50 transition-opacity`}
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className={`fixed inset-4 sm:inset-8 md:inset-x-20 md:inset-y-12 lg:inset-x-40 lg:inset-y-16 ${theme.cardSolid} shadow-2xl z-50 rounded-2xl overflow-hidden flex flex-col outline-none`}
            >
                <div className={`flex items-center justify-between p-4 md:p-6 border-b ${theme.borderLight}`}>
                    <div>
                        <h2 id={titleId} className={`text-xl md:text-2xl font-bold ${theme.text}`}>{t("summary.title")}</h2>
                        <p className={`text-xs md:text-sm ${theme.textMuted} mt-1 capitalize`}>{summaryDateLabel}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`rounded-full p-2 ${theme.buttonPrimary} transition-colors`}
                        title={t("summary.closeTitle")}
                        aria-label={t("summary.closeTitle")}
                    >
                        <CloseIcon />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className={`rounded-xl border ${theme.border} p-4 md:p-5 ${theme.inputAlt} space-y-4`}>
                        <p className={`text-xs sm:text-sm ${theme.textMuted}`}>
                            {t("summary.savedAuto")}
                        </p>

                        {SUMMARY_FIELDS.map(({ field, labelKey, placeholderKey }) => {
                            const fieldId = `${idPrefix}-${field}`;
                            return (
                                <div key={field} className="space-y-2">
                                    <label htmlFor={fieldId} className={`block text-sm font-semibold ${theme.text}`}>{t(labelKey)}</label>
                                    <textarea
                                        id={fieldId}
                                        value={dailySummary[field]}
                                        onChange={(e) => onChangeField(field, e.target.value)}
                                        rows={4}
                                        placeholder={t(placeholderKey)}
                                        className={`w-full resize-y rounded-lg border ${theme.input} px-3 py-2 text-sm focus:outline-none focus:ring-2 ${darkMode ? "focus:ring-neutral-100" : "focus:ring-neutral-900"}`}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className={`p-4 md:px-6 md:pb-6 border-t ${theme.borderLight} flex justify-end`}>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`rounded-lg ${theme.buttonPrimary} px-4 py-2 text-sm transition-colors`}
                    >
                        {t("common.close")}
                    </button>
                </div>
            </div>
        </>
    );
}
