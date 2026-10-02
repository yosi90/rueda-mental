import { useId, useLayoutEffect, useRef, useState } from "react";
import { theme } from "../../../shared/theme/theme";
import { useI18n } from "../../../shared/i18n/I18nContext";
import { useDialogA11y } from "../../../shared/hooks/useDialogA11y";
import type { InfoMenuContextual, Sector } from "../../../shared/types/mentalWheel";
import { rgbToHex } from "../../../shared/utils/color";
import { toDisplayScore } from "../../../shared/utils/scoreScale";

interface SectorContextMenuProps {
    menu: InfoMenuContextual | null;
    sectors: Sector[];
    scores: Record<string, number>;
    dateStr: string;
    ringCount: number;
    isScaleInverted: boolean;
    onClose: () => void;
    updateSector: (id: string, patch: Partial<Omit<Sector, "id">>) => void;
    removeSector: (id: string) => void;
    /** Puntuación en escala visible. */
    setScore: (id: string, displayScore: number) => void;
    getComment: (date: string, sectorId: string) => string;
    setComment: (date: string, sectorId: string, text: string) => void;
    deleteComment: (date: string, sectorId: string) => void;
}

const VIEWPORT_MARGIN = 8;

export function SectorContextMenu({
    menu,
    sectors,
    scores,
    dateStr,
    ringCount,
    isScaleInverted,
    onClose,
    updateSector,
    removeSector,
    setScore,
    getComment,
    setComment,
    deleteComment,
}: SectorContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
    useDialogA11y(Boolean(menu), onClose, menuRef);

    // Coloca el menú junto al punto pedido sin que se salga de la ventana.
    useLayoutEffect(() => {
        if (!menu || !menuRef.current) {
            setPosition(null);
            return;
        }
        const rect = menuRef.current.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width - VIEWPORT_MARGIN;
        const maxY = window.innerHeight - rect.height - VIEWPORT_MARGIN;
        setPosition({
            x: Math.max(VIEWPORT_MARGIN, Math.min(menu.x, maxX)),
            y: Math.max(VIEWPORT_MARGIN, Math.min(menu.y, maxY)),
        });
    }, [menu]);

    if (!menu) return null;

    const sector = sectors.find((s) => s.id === menu.idSector);

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />

            <div
                ref={menuRef}
                role="dialog"
                aria-modal="true"
                aria-label={sector?.name}
                tabIndex={-1}
                className={`fixed z-50 w-[240px] sm:w-[300px] rounded-xl border ${theme.border} ${theme.card} ${theme.text} backdrop-blur-sm p-4 shadow-xl outline-none`}
                style={{
                    left: `${position?.x ?? menu.x}px`,
                    top: `${position?.y ?? menu.y}px`,
                }}
            >
                {sector && (
                    <SectorMenuContent
                        key={`${sector.id}-${dateStr}`}
                        sector={sector}
                        score={scores[sector.id] ?? 0}
                        dateStr={dateStr}
                        ringCount={ringCount}
                        isScaleInverted={isScaleInverted}
                        onClose={onClose}
                        updateSector={updateSector}
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
    "dateStr" | "ringCount" | "isScaleInverted" | "onClose" | "updateSector"
    | "removeSector" | "setScore" | "setComment" | "deleteComment"> {
    sector: Sector;
    score: number;
    initialComment: string;
}

function SectorMenuContent({
    sector,
    score,
    dateStr,
    ringCount,
    isScaleInverted,
    onClose,
    updateSector,
    removeSector,
    setScore,
    initialComment,
    setComment,
    deleteComment,
}: SectorMenuContentProps) {
    const { t } = useI18n();
    const idPrefix = useId();
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
                    onChange={(e) => updateSector(sector.id, { color: e.target.value })}
                    title={t("common.color")}
                    aria-label={t("common.color")}
                    className="h-8 w-8 cursor-pointer rounded-md border flex-shrink-0"
                />

                <input
                    type="text"
                    defaultValue={sector.name}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            updateSector(sector.id, { name: e.currentTarget.value });
                            onClose();
                        }
                    }}
                    onBlur={(e) => updateSector(sector.id, { name: e.target.value })}
                    aria-label={t("sectors.newPlaceholder")}
                    className={`flex-1 min-w-0 rounded-lg border ${theme.input} px-2 sm:px-3 py-1 text-sm ${theme.focusRing}`}
                />

                <button
                    type="button"
                    title={t("sectorMenu.deleteTitle")}
                    aria-label={t("sectorMenu.deleteTitle")}
                    className={`inline-flex items-center justify-center min-h-8 min-w-8 rounded-md border ${theme.border} ${theme.button} px-2 text-xs transition-colors flex-shrink-0`}
                    onClick={() => {
                        onClose();
                        removeSector(sector.id);
                    }}
                >
                    <span aria-hidden="true">🗑️</span>
                </button>
            </div>

            <div className="flex items-center gap-2">
                <label htmlFor={`${idPrefix}-score`} className={`text-xs ${theme.textMuted} flex-shrink-0`}>{t("sectors.scoreLabel")}</label>
                {!isMobile && (
                    <input
                        type="range"
                        min={0}
                        max={ringCount}
                        value={valorActual}
                        onChange={(e) => setScore(sector.id, Number(e.target.value))}
                        aria-label={t("common.score")}
                        className={`flex-1 min-w-0 h-2 bg-gray-400 rounded-lg appearance-none cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none
                            [&::-webkit-slider-thumb]:w-4
                            [&::-webkit-slider-thumb]:h-4
                            [&::-webkit-slider-thumb]:rounded-full
                            [&::-webkit-slider-thumb]:bg-blue-600
                            [&::-webkit-slider-thumb]:cursor-pointer
                            [&::-webkit-slider-thumb]:transition
                            [&::-webkit-slider-thumb]:hover:bg-blue-700
                            [&::-moz-range-thumb]:w-4
                            [&::-moz-range-thumb]:h-4
                            [&::-moz-range-thumb]:rounded-full
                            [&::-moz-range-thumb]:bg-blue-600`}
                    />
                )}
                <input
                    id={`${idPrefix}-score`}
                    type="number"
                    min={0}
                    max={ringCount}
                    value={valorActual}
                    onChange={(e) => setScore(sector.id, Number(e.target.value) || 0)}
                    className={`w-14 sm:w-16 rounded-md border ${theme.input} px-1 sm:px-2 py-1 text-sm text-center ${theme.focusRing} flex-shrink-0`}
                />
            </div>

            <hr className={`my-1 ${theme.borderLight} border-t`} />

            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <label htmlFor={`${idPrefix}-comment`} className={`text-xs ${theme.textMuted}`}>{t("sectorMenu.comment")}</label>

                    {initialComment && (
                        <button
                            type="button"
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
                    id={`${idPrefix}-comment`}
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    maxLength={COMMENT_MAX_LENGTH}
                    rows={3}
                    placeholder={t("sectorMenu.commentPlaceholder")}
                    className={`w-full resize-none rounded-md border ${theme.input} px-2 py-1 text-sm ${theme.focusRing}`}
                    onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") saveComment();
                    }}
                />

                <div className="flex items-center justify-between">
                    <span className={`text-xs ${theme.textMuted}`}>
                        {commentDraft.length}/{COMMENT_MAX_LENGTH}
                    </span>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            className={`text-xs min-h-8 px-3 rounded ${theme.button}`}
                            onClick={onClose}
                        >
                            {t("common.cancel")}
                        </button>
                        <button
                            type="button"
                            className={`text-xs min-h-8 px-3 rounded ${theme.buttonPrimary}`}
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
                    type="button"
                    onClick={onClose}
                    className={`text-xs ${theme.buttonPrimary} min-h-8 px-3 rounded w-full`}
                >
                    {t("sectorMenu.mobileClose")}
                </button>
            )}
        </div>
    );
}
