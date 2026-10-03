import { useId, useMemo, useRef, useState } from "react";
import { theme } from "../../../shared/theme/theme";
import { useI18n } from "../../../shared/i18n/I18nContext";
import type { TranslationKey } from "../../../shared/i18n/translations";
import { useDialogA11y } from "../../../shared/hooks/useDialogA11y";
import { CloseIcon } from "../../../shared/components/CloseIcon";
import { loadSosCountry, saveSosCountry } from "../../../shared/services/storage/mentalWheelStorage";
import {
    DEFAULT_SOS_COUNTRY,
    getSosCountry,
    OTHER_COUNTRY,
    SOS_COUNTRIES,
    toTelHref,
    type SupportContact,
    type SupportKind,
} from "../sosDirectory";

interface SOSModalProps {
    open: boolean;
    onClose: () => void;
}

const KIND_LABEL: Record<SupportKind, TranslationKey> = {
    emergency: "sos.kind.emergency",
    medical: "sos.kind.medical",
    police: "sos.kind.police",
    crisis: "sos.kind.crisis",
    support: "sos.kind.support",
    violence: "sos.kind.violence",
};

const callButtonClass = "shrink-0 rounded-lg bg-red-600 hover:bg-red-700 !text-white hover:!text-white visited:!text-white no-underline px-3 py-2 text-sm font-semibold transition-colors";

export function SOSModal({ open, onClose }: SOSModalProps) {
    const { t, locale } = useI18n();
    const dialogRef = useRef<HTMLDivElement>(null);
    const titleId = useId();
    const selectId = useId();
    const [countryCode, setCountryCode] = useState(() => loadSosCountry() ?? DEFAULT_SOS_COUNTRY);
    useDialogA11y(open, onClose, dialogRef);

    const regionNames = useMemo(() => new Intl.DisplayNames([locale], { type: "region" }), [locale]);
    const countryOptions = useMemo(
        () => SOS_COUNTRIES.map((c) => ({ code: c.code, name: regionNames.of(c.code) ?? c.code }))
            .sort((a, b) => a.name.localeCompare(b.name, locale)),
        [regionNames, locale]
    );

    if (!open) return null;

    const country = getSosCountry(countryCode);
    const emergencyNumber = country?.emergency ?? "112";

    function changeCountry(code: string) {
        setCountryCode(code);
        saveSosCountry(code);
    }

    // Se pinta en dos sitios (cabecera en escritorio, pie en móvil); solo uno es visible a la vez
    function countrySelect(id: string) {
        return (
            <>
                <label htmlFor={id} className="sr-only">{t("sos.country")}</label>
                <select
                    id={id}
                    value={country ? countryCode : OTHER_COUNTRY}
                    onChange={(e) => changeCountry(e.target.value)}
                    title={t("sos.country")}
                    className={`min-h-9 max-w-full rounded-lg border ${theme.input} px-2 sm:px-3 text-sm ${theme.focusRing}`}
                >
                    {countryOptions.map(({ code, name }) => (
                        <option key={code} value={code}>{name}</option>
                    ))}
                    <option value={OTHER_COUNTRY}>{t("sos.otherCountry")}</option>
                </select>
            </>
        );
    }

    function contactDetails(contact: SupportContact): string {
        return [
            contact.available24 ? t("sos.available24") : contact.hours ? t("sos.hours", { hours: contact.hours }) : null,
            contact.free ? t("sos.free") : null,
            contact.area ? t("sos.area", { area: contact.area }) : null,
            contact.nationwide ? t("sos.nationwide") : null,
            contact.mobileOnly ? t("sos.mobileOnly") : null,
        ].filter(Boolean).join(" · ");
    }

    return (
        <>
            <div className={`fixed inset-0 ${theme.overlay} z-[60] transition-opacity`} onClick={onClose} aria-hidden="true" />
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className={`fixed inset-3 sm:inset-8 md:inset-x-20 md:inset-y-12 lg:inset-x-48 lg:inset-y-16 ${theme.cardSolid} shadow-2xl z-[61] rounded-2xl overflow-hidden flex flex-col outline-none`}
            >
                <div className={`flex items-start justify-between gap-3 p-4 md:p-6 border-b ${theme.borderLight}`}>
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-red-300 bg-red-50 text-red-700 px-3 py-1 text-xs font-semibold">
                            <span aria-hidden="true">!</span>
                            {t("sos.badge")}
                        </div>
                        <h2 id={titleId} className={`text-lg sm:text-xl md:text-2xl font-bold mt-3 ${theme.text}`}>{t("sos.title")}</h2>
                        <p className={`text-xs sm:text-sm mt-1 ${theme.textMuted}`}>
                            {t("sos.urgent", { number: emergencyNumber })}
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                        <div className="hidden sm:block">{countrySelect(`${selectId}-top`)}</div>
                        <button
                            type="button"
                            onClick={onClose}
                            className={`rounded-full p-2 ${theme.buttonPrimary} transition-colors`}
                            title={t("sos.closeTitle")}
                            aria-label={t("sos.closeTitle")}
                        >
                            <CloseIcon />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className={`rounded-xl border ${theme.border} p-4 ${theme.inputAlt} mb-4`}>
                        <p className={`text-sm ${theme.text}`}>{t("sos.disclaimer")}</p>
                    </div>

                    {country ? (
                        <div className="grid gap-3">
                            {country.contacts.map((contact) => (
                                <div key={`${contact.number}-${contact.kind}`} className={`rounded-xl border ${theme.border} p-4`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className={`text-sm sm:text-base font-semibold ${theme.text}`}>{t(KIND_LABEL[contact.kind])}</h3>
                                            {contact.name && <p className={`text-xs sm:text-sm mt-0.5 ${theme.text}`}>{contact.name}</p>}
                                            <p className={`text-xs mt-1.5 ${theme.textMuted}`}>{contactDetails(contact)}</p>
                                            {contact.noteKey && <p className={`text-xs mt-1 ${theme.textMuted}`}>{t(contact.noteKey)}</p>}
                                        </div>
                                        <a
                                            href={toTelHref(contact.number)}
                                            className={callButtonClass}
                                            aria-label={t("sos.contactCallAria", { number: contact.number })}
                                        >
                                            {contact.number}
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`rounded-xl border ${theme.border} p-4`}>
                            <p className={`text-sm ${theme.text}`}>{t("sos.otherCountryText")}</p>
                            <p className={`text-sm mt-2 ${theme.textMuted}`}>{t("sos.findHelpline")} findahelpline.com</p>
                        </div>
                    )}
                </div>

                <div className={`p-4 md:px-6 md:pb-6 border-t ${theme.borderLight} flex items-center justify-end gap-2`}>
                    <div className="mr-auto min-w-0 sm:hidden">{countrySelect(`${selectId}-bottom`)}</div>
                    <a href={toTelHref(emergencyNumber)} className={`${callButtonClass} px-4`}>
                        {t("sos.callEmergency", { number: emergencyNumber })}
                    </a>
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
