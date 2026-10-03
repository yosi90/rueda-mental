import { useState } from "react";
import { Archive, ArchiveRestore, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { theme } from "../../../shared/theme/theme";
import { useI18n } from "../../../shared/i18n/I18nContext";
import type { Sector } from "../../../shared/types/mentalWheel";
import { rgbToHex } from "../../../shared/utils/color";
import { IconPicker } from "../../sectors/components/IconPicker";
import { getSectorIcon } from "../../sectors/icons/sectorIcons";

interface SectorsSettingsSectionProps {
    addSector: (name: string) => void;
    sectors: Sector[];
    updateSector: (id: string, patch: Partial<Omit<Sector, "id">>) => void;
    moveSector: (id: string, dir: number) => void;
    removeSector: (id: string) => void;
    setSectorArchived: (id: string, archived: boolean) => void;
}

const iconButtonClass = `inline-flex items-center justify-center min-h-8 min-w-8 rounded-md border ${theme.border} ${theme.button} px-2 text-xs transition-colors flex-shrink-0 disabled:opacity-40`;

export function SectorsSettingsSection({
    addSector,
    sectors,
    updateSector,
    moveSector,
    removeSector,
    setSectorArchived,
}: SectorsSettingsSectionProps) {
    const { t } = useI18n();
    const [newName, setNewName] = useState("");
    const active = sectors.filter((s) => !s.archived);
    const archived = sectors.filter((s) => s.archived);

    function submitNewSector() {
        addSector(newName);
        setNewName("");
    }

    return (
        <div>
            <h3 className={`text-lg font-semibold mb-3 ${theme.text}`}>{t("sectors.title")}</h3>
            <div className="mb-4 flex gap-2">
                <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={t("sectors.newPlaceholder")}
                    aria-label={t("sectors.newPlaceholder")}
                    className={`flex-1 rounded-lg border ${theme.input} px-3 py-2 text-sm ${theme.focusRing}`}
                    onKeyDown={(e) => e.key === "Enter" && submitNewSector()}
                />
                <button type="button" onClick={submitNewSector} className={`rounded-lg ${theme.buttonPrimary} px-4 py-2 text-sm transition-colors`}>
                    {t("sectors.add")}
                </button>
            </div>

            <ul className="flex flex-col gap-2">
                {active.map((s, i) => (
                    <li key={s.id} className={`rounded-xl border ${theme.border} p-2 sm:p-3 ${theme.inputAlt}`}>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={rgbToHex(s.color)}
                                onChange={(e) =>
                                    updateSector(s.id, { color: e.target.value })
                                }
                                title={t("common.color")}
                                aria-label={`${t("common.color")}: ${s.name}`}
                                className="h-8 w-8 cursor-pointer rounded-md border flex-shrink-0"
                            />
                            <IconPicker
                                sectorName={s.name}
                                value={s.icon}
                                onChange={(icon) => updateSector(s.id, { icon })}
                            />
                            <input
                                value={s.name}
                                onChange={(e) =>
                                    updateSector(s.id, { name: e.target.value })
                                }
                                aria-label={t("sectors.newPlaceholder")}
                                className={`flex-1 min-w-0 rounded-lg border ${theme.input} px-2 sm:px-3 py-2 text-sm ${theme.focusRing}`}
                            />
                            <div className="flex gap-1">
                                <button
                                    type="button"
                                    onClick={() => moveSector(s.id, -1)}
                                    className={iconButtonClass}
                                    disabled={i === 0}
                                    title={t("sectors.moveUp")}
                                    aria-label={`${t("sectors.moveUp")}: ${s.name}`}
                                >
                                    <ChevronUp size={16} aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => moveSector(s.id, +1)}
                                    className={iconButtonClass}
                                    disabled={i === active.length - 1}
                                    title={t("sectors.moveDown")}
                                    aria-label={`${t("sectors.moveDown")}: ${s.name}`}
                                >
                                    <ChevronDown size={16} aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSectorArchived(s.id, true)}
                                    className={iconButtonClass}
                                    disabled={active.length <= 1}
                                    title={t("sectors.archive")}
                                    aria-label={`${t("sectors.archive")}: ${s.name}`}
                                >
                                    <Archive size={16} aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeSector(s.id)}
                                    className={iconButtonClass}
                                    title={t("sectors.delete")}
                                    aria-label={`${t("sectors.delete")}: ${s.name}`}
                                >
                                    <Trash2 size={16} aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            <h4 className={`mt-6 mb-1 text-sm font-semibold ${theme.text}`}>{t("sectors.archivedTitle")}</h4>
            <p className={`mb-3 text-xs ${theme.textMuted}`}>{t("sectors.archivedHint")}</p>
            {archived.length === 0 ? (
                <p className={`rounded-xl border border-dashed ${theme.border} p-3 text-sm ${theme.textMuted}`}>{t("sectors.archivedEmpty")}</p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {archived.map((s) => {
                        const Icon = getSectorIcon(s.icon)?.Icon;
                        return (
                            <li key={s.id} className={`flex items-center gap-2 rounded-xl border border-dashed ${theme.border} p-2 sm:p-3`}>
                                <span
                                    className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-white"
                                    style={{ backgroundColor: s.color }}
                                    aria-hidden="true"
                                >
                                    {Icon && <Icon size={16} />}
                                </span>
                                <span className={`flex-1 min-w-0 truncate text-sm ${theme.text}`}>{s.name}</span>
                                <button
                                    type="button"
                                    onClick={() => setSectorArchived(s.id, false)}
                                    className={`inline-flex items-center gap-1.5 min-h-8 rounded-md border ${theme.border} ${theme.button} px-2.5 text-xs transition-colors flex-shrink-0`}
                                    aria-label={`${t("sectors.restore")}: ${s.name}`}
                                >
                                    <ArchiveRestore size={16} aria-hidden="true" />
                                    {t("sectors.restore")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeSector(s.id)}
                                    className={iconButtonClass}
                                    title={t("sectors.delete")}
                                    aria-label={`${t("sectors.delete")}: ${s.name}`}
                                >
                                    <Trash2 size={16} aria-hidden="true" />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
