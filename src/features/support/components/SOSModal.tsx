import { useEffect } from "react";
import { useI18n } from "../../../shared/i18n/I18nContext";
import type { TranslationKey } from "../../../shared/i18n/translations";
import type { ThemeClasses } from "../../../shared/types/theme";

interface SOSModalProps {
    open: boolean;
    onClose: () => void;
    theme: Pick<ThemeClasses, "overlay" | "cardSolid" | "borderLight" | "text" | "textMuted" | "buttonPrimary" | "border" | "inputAlt">;
}

interface EmergencyContact {
    id: string;
    number: string;
    serviceKey: TranslationKey;
    descriptionKey: TranslationKey;
    availabilityKey: TranslationKey;
    extraKey?: TranslationKey;
}

const EMERGENCY_CONTACTS_ES: EmergencyContact[] = [
    {
        id: "urgencias-112",
        number: "112",
        serviceKey: "sos.contact.112.service",
        descriptionKey: "sos.contact.112.description",
        availabilityKey: "sos.contact.112.availability",
    },
    {
        id: "linea-024",
        number: "024",
        serviceKey: "sos.contact.024.service",
        descriptionKey: "sos.contact.024.description",
        availabilityKey: "sos.contact.024.availability",
    },
    {
        id: "apoyo-emocional",
        number: "900 107 917",
        serviceKey: "sos.contact.emotional.service",
        descriptionKey: "sos.contact.emotional.description",
        availabilityKey: "sos.contact.emotional.availability",
    },
    {
        id: "violencia-genero",
        number: "016",
        serviceKey: "sos.contact.016.service",
        descriptionKey: "sos.contact.016.description",
        availabilityKey: "sos.contact.016.availability",
        extraKey: "sos.contact.016.extra",
    },
    {
        id: "policia",
        number: "091",
        serviceKey: "sos.contact.091.service",
        descriptionKey: "sos.contact.091.description",
        availabilityKey: "sos.contact.091.availability",
    },
    {
        id: "guardia-civil",
        number: "062",
        serviceKey: "sos.contact.062.service",
        descriptionKey: "sos.contact.062.description",
        availabilityKey: "sos.contact.062.availability",
    },
];

function toTelHref(number: string): string {
    return `tel:${number.replace(/\s+/g, "")}`;
}

export function SOSModal({ open, onClose, theme }: SOSModalProps) {
    const { t } = useI18n();

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <>
            <div
                className={`fixed inset-0 ${theme.overlay} z-[60] transition-opacity`}
                onClick={onClose}
            />
            <div className={`fixed inset-3 sm:inset-8 md:inset-x-20 md:inset-y-12 lg:inset-x-48 lg:inset-y-16 ${theme.cardSolid} shadow-2xl z-[61] rounded-2xl overflow-hidden flex flex-col`}>
                <div className={`flex items-start justify-between gap-3 p-4 md:p-6 border-b ${theme.borderLight}`}>
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-red-300 bg-red-50 text-red-700 px-3 py-1 text-xs font-semibold">
                            <span aria-hidden="true">!</span>
                            {t("sos.badge")}
                        </div>
                        <h2 className={`text-lg sm:text-xl md:text-2xl font-bold mt-3 ${theme.text}`}>{t("sos.title")}</h2>
                        <p className={`text-xs sm:text-sm mt-1 ${theme.textMuted}`}>
                            {t("sos.urgent")}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`rounded-full p-2 ${theme.buttonPrimary} transition-colors`}
                        title={t("sos.closeTitle")}
                    >
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className={`rounded-xl border ${theme.border} p-4 ${theme.inputAlt} mb-4`}>
                        <p className={`text-sm ${theme.text}`}>
                            {t("sos.disclaimer")}
                        </p>
                    </div>

                    <div className="grid gap-3">
                        {EMERGENCY_CONTACTS_ES.map((contact) => (
                            <div key={contact.id} className={`rounded-xl border ${theme.border} p-4`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className={`text-sm sm:text-base font-semibold ${theme.text}`}>{t(contact.serviceKey)}</h3>
                                        <p className={`text-xs sm:text-sm mt-1 ${theme.textMuted}`}>{t(contact.descriptionKey)}</p>
                                        <p className={`text-xs mt-2 ${theme.textMuted}`}>{t(contact.availabilityKey)}</p>
                                        {contact.extraKey && (
                                            <p className={`text-xs mt-1 ${theme.textMuted}`}>{t(contact.extraKey)}</p>
                                        )}
                                    </div>
                                    <a
                                        href={toTelHref(contact.number)}
                                        className="shrink-0 rounded-lg bg-red-600 hover:bg-red-700 !text-white hover:!text-white visited:!text-white no-underline px-3 py-2 text-sm font-semibold transition-colors"
                                        aria-label={t("sos.contactCallAria", { number: contact.number })}
                                    >
                                        {contact.number}
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={`rounded-xl border ${theme.border} p-4 mt-4 ${theme.inputAlt}`}>
                        <p className={`text-xs sm:text-sm ${theme.textMuted}`}>
                            {t("sos.resources")} {t("sos.outsideSpain")}
                        </p>
                    </div>
                </div>

                <div className={`p-4 md:px-6 md:pb-6 border-t ${theme.borderLight} flex flex-wrap items-center justify-end gap-2`}>
                    <a
                        href="tel:112"
                        className="rounded-lg bg-red-600 hover:bg-red-700 !text-white hover:!text-white visited:!text-white no-underline px-4 py-2 text-sm font-semibold transition-colors"
                    >
                        {t("sos.call112")}
                    </a>
                    <button
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
