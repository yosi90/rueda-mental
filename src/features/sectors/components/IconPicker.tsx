import { useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Ban, Search } from "lucide-react";
import { useDialogA11y } from "../../../shared/hooks/useDialogA11y";
import { CloseIcon } from "../../../shared/components/CloseIcon";
import { useI18n } from "../../../shared/i18n/I18nContext";
import type { TranslationKey } from "../../../shared/i18n/translations";
import { theme } from "../../../shared/theme/theme";
import { getSectorIcon, ICON_CATEGORIES, searchSectorIcons, type IconCategory } from "../icons/sectorIcons";

interface IconPickerProps {
    sectorName: string;
    /** id del icono actual ("" o undefined = sin icono). */
    value: string | undefined;
    onChange: (iconId: string) => void;
    /** Tamaño del botón: compacto en el menú del sector. */
    size?: "sm" | "md";
}

/** Botón con el icono actual que abre un diálogo para elegir otro. */
export function IconPicker({ sectorName, value, onChange, size = "md" }: IconPickerProps) {
    const { t } = useI18n();
    const [open, setOpen] = useState(false);
    const current = getSectorIcon(value);
    const CurrentIcon = current?.Icon;
    const boxClass = size === "sm" ? "h-8 w-8" : "h-9 w-9";

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                title={t("icons.choose")}
                aria-label={`${t("icons.choose")}: ${sectorName}`}
                aria-haspopup="dialog"
                className={`inline-flex flex-shrink-0 items-center justify-center rounded-md border ${theme.border} ${theme.button} ${boxClass} transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
            >
                {CurrentIcon
                    ? <CurrentIcon size={18} aria-hidden="true" />
                    : <span className="text-base leading-none opacity-60" aria-hidden="true">+</span>}
            </button>
            {/* Portal: el menú del sector usa backdrop-filter, que haría de contenedor de los position: fixed */}
            {open && createPortal(
                <IconPickerDialog
                    sectorName={sectorName}
                    value={value}
                    onSelect={(iconId) => {
                        onChange(iconId);
                        setOpen(false);
                    }}
                    onClose={() => setOpen(false)}
                />,
                document.body
            )}
        </>
    );
}

function IconPickerDialog({ sectorName, value, onSelect, onClose }: {
    sectorName: string;
    value: string | undefined;
    onSelect: (iconId: string) => void;
    onClose: () => void;
}) {
    const { t } = useI18n();
    const dialogRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const titleId = useId();
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState<IconCategory | null>(null);
    useDialogA11y(true, onClose, dialogRef, searchRef);

    const icons = useMemo(() => searchSectorIcons(query, category), [query, category]);
    const chipClass = (active: boolean) =>
        `shrink-0 rounded-full border px-3 min-h-8 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            active
                ? "border-accent bg-accent text-accent-fg"
                : `${theme.border} ${theme.text} hover:bg-subtle`
        }`;
    const cellClass = (selected: boolean) =>
        `flex aspect-square items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            selected
                ? "border-accent bg-accent-soft text-fg"
                : `border-transparent ${theme.text} hover:bg-subtle`
        }`;

    return (
        <>
            <div className={`fixed inset-0 z-[70] ${theme.overlay}`} onClick={onClose} aria-hidden="true" />
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className={`fixed left-1/2 top-1/2 z-[71] flex max-h-[min(36rem,calc(100%-2rem))] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl shadow-2xl outline-none ${theme.cardSolid} ${theme.text}`}
            >
                <div className={`flex items-center justify-between gap-3 border-b ${theme.borderLight} p-4`}>
                    <h2 id={titleId} className="text-base font-semibold">{t("icons.title", { name: sectorName })}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t("common.close")}
                        title={t("common.close")}
                        className={`rounded-full p-1.5 ${theme.buttonPrimary} transition-colors`}
                    >
                        <CloseIcon />
                    </button>
                </div>

                <div className="flex flex-col gap-3 p-4 pb-2">
                    <label className={`flex items-center gap-2 rounded-lg border ${theme.input} px-3 focus-within:ring-2 focus-within:ring-blue-500`}>
                        <Search size={16} className="opacity-60" aria-hidden="true" />
                        <input
                            ref={searchRef}
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t("icons.search")}
                            aria-label={t("icons.search")}
                            className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
                        />
                    </label>
                    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label={t("icons.categories")}>
                        <button type="button" className={chipClass(category === null)} aria-pressed={category === null} onClick={() => setCategory(null)}>
                            {t("icons.category.all")}
                        </button>
                        {ICON_CATEGORIES.map((c) => (
                            <button key={c} type="button" className={chipClass(category === c)} aria-pressed={category === c} onClick={() => setCategory(c)}>
                                {t(`icons.category.${c}` as TranslationKey)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-7">
                        <button
                            type="button"
                            onClick={() => onSelect("")}
                            className={cellClass(!value)}
                            aria-pressed={!value}
                            title={t("icons.none")}
                            aria-label={t("icons.none")}
                        >
                            <Ban size={20} className="opacity-60" aria-hidden="true" />
                        </button>
                        {icons.map(({ id, Icon, keywords }) => {
                            const label = keywords.split(" ")[0];
                            return (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => onSelect(id)}
                                    className={cellClass(value === id)}
                                    aria-pressed={value === id}
                                    title={label}
                                    aria-label={label}
                                >
                                    <Icon size={22} aria-hidden="true" />
                                </button>
                            );
                        })}
                    </div>
                    {icons.length === 0 && (
                        <p className={`py-6 text-center text-sm ${theme.textMuted}`}>{t("icons.noResults")}</p>
                    )}
                </div>
            </div>
        </>
    );
}
