import { useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import { useI18n } from "../../../shared/i18n/I18nContext";
import type { InfoMenuContextual, Sector } from "../../../shared/types/mentalWheel";
import type { ThemeClasses } from "../../../shared/types/theme";
import { rgbToHex } from "../../../shared/utils/color";
import { toDisplayScore } from "../../../shared/utils/scoreScale";

interface SectorContextMenuProps {
    infoMenuContextual: InfoMenuContextual | null;
    menuRef: RefObject<HTMLDivElement | null>;
    theme: Pick<ThemeClasses, "card" | "text" | "border" | "input" | "button" | "buttonPrimary" | "borderLight" | "textMuted">;
    darkMode: boolean;
    sectors: Sector[];
    scores: Record<string, number>;
    dateStr: string;
    ringCount: number;
    isScaleInverted: boolean;
    onClose: () => void;
    setSectors: Dispatch<SetStateAction<Sector[]>>;
    removeSector: (id: string) => void;
    setScore: (id: string, val: string | number) => void;
    getComment: (date: string, sectorId: string) => string;
    setComment: (date: string, sectorId: string, text: string) => void;
    deleteComment: (date: string, sectorId: string) => void;
}

export function SectorContextMenu({
    infoMenuContextual,
    menuRef,
    theme,
    darkMode,
    sectors,
    scores,
    dateStr,
    ringCount,
    isScaleInverted,
    onClose,
    setSectors,
    removeSector,
    setScore,
    getComment,
    setComment,
    deleteComment,
}: SectorContextMenuProps) {
    if (!infoMenuContextual) return null;

    const sector = sectors.find((s) => s.id === infoMenuContextual.idSector);

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />

            <div
                ref={menuRef}
                className={`fixed z-50 w-[200px] sm:w-[300px] rounded-xl border ${theme.border} ${theme.card} ${theme.text} backdrop-blur-sm p-4 shadow-xl`}
                style={{ top: `${infoMenuContextual.y}px`, left: `${infoMenuContextual.x}px` }}
            >
                {sector && (
                    <SectorMenuContent
                        key={`${sector.id}-${dateStr}`}
                        sector={sector}
                        theme={theme}
                        darkMode={darkMode}
                        score={scores[sector.id] ?? 0}
                        dateStr={dateStr}
                        ringCount={ringCount}
                        isScaleInverted={isScaleInverted}
                        onClose={onClose}
                        setSectors={setSectors}
                        removeSector={removeSector}
                        setScore={setScore}
                        initialComment={getComment(dateStr, sector.id)}
                        setComment={setComment}
                        deleteComment={deleteComment}
                    />
                )}
            </div>
        </>
    );
}

const COMMENT_MAX_LENGTH = 100;

interface SectorMenuContentProps extends Pick<SectorContextMenuProps,
    "theme" | "darkMode" | "dateStr" | "ringCount" | "isScaleInverted" | "onClose" | "setSectors"
    | "removeSector" | "setScore" | "setComment" | "deleteComment"> {
    sector: Sector;
    score: number;
    initialComment: string;
}

function SectorMenuContent({
    sector,
    theme,
    darkMode,
    score,
    dateStr,
    ringCount,
    isScaleInverted,
    onClose,
    setSectors,
    removeSector,
    setScore,
    initialComment,
    setComment,
    deleteComment,
}: SectorMenuContentProps) {
    const { t } = useI18n();
    const [commentDraft, setCommentDraft] = useState(initialComment);
    const valorActual = toDisplayScore(score, ringCount, isScaleInverted);
    const isMobile = window.innerWidth <= 768;

    function saveComment() {
        const text = commentDraft.trim();
        if (text.length > 0) setComment(dateStr, sector.id, text);
        else deleteComment(dateStr, sector.id);
        onClose();
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-3 flex-wrap sm:flex-nowrap">
                <input
                    type="color"
                    defaultValue={rgbToHex(sector.color)}
                    onChange={(e) => {
                        const nuevoColor = e.target.value;
                        setSectors((prev) =>
                            prev.map((s) =>
                                s.id === sector.id ? { ...s, color: nuevoColor } : s
                            )
                        );
                    }}
                    className="h-4 w-4 sm:h-8 sm:w-8 cursor-pointer rounded-md border flex-shrink-0"
                />

                <input
                    type="text"
                    defaultValue={sector.name}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            const nombre = (e.target as HTMLInputElement).value;
                            setSectors((prev) =>
                                prev.map((s) =>
                                    s.id === sector.id ? { ...s, name: nombre } : s
                                )
                            );
                            onClose();
                        }
                    }}
                    onBlur={(e) => {
                        const nombre = e.target.value;
                        setSectors((prev) =>
                            prev.map((s) =>
                                s.id === sector.id ? { ...s, name: nombre } : s
                            )
                        );
                    }}
                    className={`flex-1 min-w-0 rounded-lg border ${theme.input} px-1 sm:px-3 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 ${darkMode ? "focus:ring-neutral-100" : "focus:ring-neutral-900"}`}
                />

                <button
                    title={t("sectorMenu.deleteTitle")}
                    className={`rounded-md border ${theme.border} ${theme.button} px-1 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] sm:text-xs transition-colors flex-shrink-0`}
                    onClick={() => {
                        if (confirm(t("sectorMenu.deleteConfirm"))) {
                            removeSector(sector.id);
                            onClose();
                        }
                    }}
                >
                    🗑️
                </button>
            </div>

            <div className="flex items-center gap-2">
                <label className={`text-xs ${theme.textMuted} flex-shrink-0`}>{t("sectors.scoreLabel")}</label>
                {!isMobile && (
                    <input
                        type="range"
                        min={0}
                        max={ringCount}
                        value={valorActual}
                        onChange={(e) => setScore(sector.id, e.target.value)}
                        aria-label={t("sectors.scoreLabel")}
                        className={`flex-1 min-w-0 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none
                            [&::-webkit-slider-thumb]:w-3
                            [&::-webkit-slider-thumb]:h-3
                            [&::-webkit-slider-thumb]:rounded-full
                            [&::-webkit-slider-thumb]:bg-blue-600
                            [&::-webkit-slider-thumb]:cursor-pointer
                            [&::-webkit-slider-thumb]:transition
                            [&::-webkit-slider-thumb]:hover:bg-blue-700
                            [&::-moz-range-thumb]:w-3
                            [&::-moz-range-thumb]:h-3
                            [&::-moz-range-thumb]:rounded-full
                            [&::-moz-range-thumb]:bg-blue-600`}
                    />
                )}
                <input
                    type="number"
                    min={0}
                    max={ringCount}
                    value={valorActual}
                    onChange={(e) => {
                        const nuevoValor = parseInt(e.target.value, 10);
                        setScore(sector.id, nuevoValor);
                    }}
                    className={`w-12 sm:w-16 rounded-md border ${theme.input} px-1 sm:px-2 py-1 text-xs sm:text-sm text-center focus:outline-none focus:ring-2 ${darkMode ? "focus:ring-neutral-100" : "focus:ring-neutral-900"} flex-shrink-0`}
                />
            </div>

            <hr className={`my-1 ${theme.borderLight} border-t`} />

            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <label className={`text-xs ${theme.textMuted}`}>{t("sectorMenu.comment")}</label>

                    {initialComment && (
                        <button
                            className={`text-xs px-2 py-1 rounded ${theme.buttonPrimary}`}
                            onClick={() => {
                                deleteComment(dateStr, sector.id);
                                setCommentDraft("");
                            }}
                            title={t("sectorMenu.deleteCommentTitle")}
                        >
                            {t("common.delete")}
                        </button>
                    )}
                </div>

                <textarea
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    maxLength={COMMENT_MAX_LENGTH}
                    rows={3}
                    placeholder={t("sectorMenu.commentPlaceholder")}
                    className={`w-full resize-none rounded-md border ${theme.input} px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 ${darkMode ? "focus:ring-neutral-100" : "focus:ring-neutral-900"}`}
                    onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") saveComment();
                    }}
                />

                <div className="flex items-center justify-between">
                    <span className={`text-[10px] ${theme.textMuted}`}>
                        {commentDraft.length}/{COMMENT_MAX_LENGTH}
                    </span>

                    <div className="flex gap-2">
                        <button
                            className={`text-xs px-1.5 sm:px-3 py-1 rounded ${theme.button}`}
                            onClick={onClose}
                        >
                            {t("common.cancel")}
                        </button>
                        <button
                            className={`text-xs px-1.5 sm:px-3 py-1 rounded ${theme.buttonPrimary}`}
                            onClick={saveComment}
                        >
                            {t("common.save")}
                        </button>
                    </div>
                </div>
            </div>

            {isMobile && <hr className={`my-1 ${theme.borderLight} border-t`} />}

            {isMobile && (
                <button
                    onClick={onClose}
                    className={`text-xs ${theme.buttonPrimary} px-3 py-1 rounded w-full`}
                >
                    {t("sectorMenu.mobileClose")}
                </button>
            )}
        </div>
    );
}
