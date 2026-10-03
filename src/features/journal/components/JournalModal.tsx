import { Fragment, useDeferredValue, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { BookOpen, PencilLine, Search, Target } from "lucide-react";
import type { CommentsByDate, DailySummaryByDate, Sector } from "../../../shared/types/mentalWheel";
import { useI18n } from "../../../shared/i18n/I18nContext";
import type { TranslationKey } from "../../../shared/i18n/translations";
import { useDialogA11y } from "../../../shared/hooks/useDialogA11y";
import { CloseIcon } from "../../../shared/components/CloseIcon";
import { theme } from "../../../shared/theme/theme";
import { parseDateInput } from "../../../shared/utils/date";
import { getSectorIcon } from "../../sectors/icons/sectorIcons";
import { MOODS, PROMPTS } from "../../summary/summaryDefinitions";
import { buildJournalEntries, filterJournal, findMatches, type JournalFilter } from "../journal";

interface JournalModalProps {
    open: boolean;
    onClose: () => void;
    dailySummaryByDate: DailySummaryByDate;
    commentsByDate: CommentsByDate;
    /** Todos los sectores, también los archivados (sus comentarios siguen en el diario). */
    sectors: Sector[];
    /** Media del día ya formateada, o null si ese día no tiene puntuaciones. */
    dayAverage: (date: string) => string | null;
    onGoToDay: (date: string) => void;
    onEditSummary: (date: string) => void;
}

const PAGE_SIZE = 30;

const FILTERS: ReadonlyArray<{ id: JournalFilter; labelKey: TranslationKey }> = [
    { id: "all", labelKey: "journal.filter.all" },
    { id: "summaries", labelKey: "journal.filter.summaries" },
    { id: "comments", labelKey: "journal.filter.comments" },
];

/** Diario: resúmenes y comentarios de días anteriores, con búsqueda. */
export function JournalModal(props: JournalModalProps) {
    if (!props.open) return null;
    return <JournalDialog {...props} />;
}

function JournalDialog({
    onClose,
    dailySummaryByDate,
    commentsByDate,
    sectors,
    dayAverage,
    onGoToDay,
    onEditSummary,
}: JournalModalProps) {
    const { t, locale } = useI18n();
    const dialogRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const idPrefix = useId();
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<JournalFilter>("all");
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const deferredQuery = useDeferredValue(query);
    // En pantallas táctiles no se enfoca la búsqueda al abrir (sacaría el teclado)
    const [focusSearch] = useState(() => !window.matchMedia?.("(pointer: coarse)").matches);
    useDialogA11y(true, onClose, dialogRef, focusSearch ? searchRef : undefined);

    const sectorById = useMemo(() => new Map(sectors.map((s) => [s.id, s])), [sectors]);
    const allEntries = useMemo(
        () => buildJournalEntries(dailySummaryByDate, commentsByDate, sectors.map((s) => s.id)),
        [dailySummaryByDate, commentsByDate, sectors]
    );
    const entries = useMemo(
        () => filterJournal(allEntries, deferredQuery, filter, (id) => sectorById.get(id)?.name ?? ""),
        [allEntries, deferredQuery, filter, sectorById]
    );
    const shown = entries.slice(0, visibleCount);
    const titleId = `${idPrefix}-title`;

    const monthLabel = (date: string) => capitalize(parseDateInput(date).toLocaleDateString(locale, { month: "long", year: "numeric" }));
    const dayLabel = (date: string) => capitalize(parseDateInput(date).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" }));
    const highlight = (text: string) => <Highlighted text={text} query={deferredQuery} />;

    function changeFilter(next: JournalFilter) {
        setFilter(next);
        setVisibleCount(PAGE_SIZE);
    }

    return (
        <>
            <div className={`fixed inset-0 ${theme.overlay} z-50`} onClick={onClose} aria-hidden="true" />
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className={`fixed z-50 inset-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[min(48rem,calc(100%-2rem))] sm:h-[min(52rem,calc(100%-3rem))] sm:rounded-2xl ${theme.cardSolid} ${theme.text} shadow-2xl flex flex-col outline-none`}
            >
                <header className={`border-b ${theme.borderLight} px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:pt-5`}>
                    <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-fg" aria-hidden="true">
                            <BookOpen size={18} />
                        </span>
                        <h2 id={titleId} className="flex-1 text-xl sm:text-2xl font-bold leading-tight">{t("journal.title")}</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className={`rounded-full p-1.5 ${theme.buttonPrimary} transition-colors`}
                            title={t("journal.close")}
                            aria-label={t("journal.close")}
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    {allEntries.length > 0 && (
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                            <div className="relative flex-1">
                                <Search size={16} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${theme.textMuted}`} aria-hidden="true" />
                                <input
                                    ref={searchRef}
                                    type="search"
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        setVisibleCount(PAGE_SIZE);
                                    }}
                                    placeholder={t("journal.search")}
                                    aria-label={t("journal.search")}
                                    className={`w-full rounded-lg border ${theme.input} py-2 pl-9 pr-3 text-sm ${theme.focusRing}`}
                                />
                            </div>
                            <div role="group" aria-label={t("journal.filterLabel")} className={`inline-flex rounded-lg p-1 ${theme.subtle}`}>
                                {FILTERS.map(({ id, labelKey }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        aria-pressed={filter === id}
                                        onClick={() => changeFilter(id)}
                                        className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex-none ${
                                            filter === id ? "bg-surface text-fg shadow-sm" : `${theme.textMuted} hover:text-fg`
                                        }`}
                                    >
                                        {t(labelKey)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </header>

                <div className="flex-1 overflow-y-auto px-4 pb-6 sm:px-6">
                    <p className="sr-only" aria-live="polite">
                        {allEntries.length > 0 ? t("journal.count", { count: entries.length }) : ""}
                    </p>

                    {allEntries.length === 0 ? (
                        <EmptyState text={t("journal.empty")} />
                    ) : entries.length === 0 ? (
                        <EmptyState text={deferredQuery.trim() ? t("journal.noResults", { query: deferredQuery.trim() }) : t("journal.noResultsFilter")} />
                    ) : (
                        <ol className="space-y-3">
                            {shown.map((entry, index) => {
                                const month = monthLabel(entry.date);
                                const newMonth = index === 0 || monthLabel(shown[index - 1].date) !== month;
                                const mood = MOODS.find((m) => m.value === entry.summary?.mood);
                                const avg = dayAverage(entry.date);
                                return (
                                    <Fragment key={entry.date}>
                                        {newMonth && (
                                            <li aria-hidden="true" className={`sticky top-0 z-10 -mx-4 px-4 pb-1 pt-4 sm:-mx-6 sm:px-6 text-xs font-semibold uppercase tracking-wide ${theme.textMuted} ${theme.cardSolid}`}>
                                                {month}
                                            </li>
                                        )}
                                        <li>
                                            <article className={`rounded-xl border ${theme.borderLight} ${theme.inputAlt} p-3 sm:p-4`} aria-labelledby={`${idPrefix}-${entry.date}`}>
                                                <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                    <h3 id={`${idPrefix}-${entry.date}`} className="text-sm sm:text-base font-semibold">{dayLabel(entry.date)}</h3>
                                                    {mood && (
                                                        <span className={`inline-flex items-center gap-1 text-xs ${theme.textMuted}`}>
                                                            <mood.Icon size={16} aria-hidden="true" />
                                                            {t(mood.labelKey)}
                                                        </span>
                                                    )}
                                                    {avg && (
                                                        <span className={`text-xs ${theme.textMuted}`}>{t("journal.average", { value: avg })}</span>
                                                    )}
                                                </header>

                                                {entry.summary && PROMPTS.map(({ field, labelKey, Icon, tint }) => {
                                                    const text = entry.summary?.[field]?.trim();
                                                    if (!text) return null;
                                                    return (
                                                        <div key={field} className="mt-3 flex gap-2.5">
                                                            <span className={`mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${tint}`} aria-hidden="true">
                                                                <Icon size={13} />
                                                            </span>
                                                            <div className="min-w-0">
                                                                <p className={`text-xs font-semibold ${theme.textMuted}`}>{t(labelKey)}</p>
                                                                <p className="whitespace-pre-line break-words text-sm leading-relaxed">{highlight(text)}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {entry.comments.length > 0 && (
                                                    <ul className={`mt-3 space-y-1.5 ${entry.summary ? `border-t ${theme.borderLight} pt-3` : ""}`}>
                                                        {entry.comments.map(({ sectorId, text }) => {
                                                            const sector = sectorById.get(sectorId);
                                                            const SectorIcon = getSectorIcon(sector?.icon)?.Icon;
                                                            return (
                                                                <li key={sectorId} className="flex items-start gap-2 text-sm">
                                                                    <span
                                                                        className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-white"
                                                                        style={{ backgroundColor: sector?.color ?? "var(--ui-line)" }}
                                                                        aria-hidden="true"
                                                                    >
                                                                        {SectorIcon && <SectorIcon size={12} />}
                                                                    </span>
                                                                    <p className="min-w-0 break-words">
                                                                        <span className="font-semibold">{highlight(sector?.name ?? t("journal.unknownSector"))}:</span>{" "}
                                                                        {highlight(text)}
                                                                    </p>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                )}

                                                <div className="mt-3 flex flex-wrap justify-end gap-2">
                                                    {entry.summary && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onEditSummary(entry.date)}
                                                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${theme.button} transition-colors`}
                                                        >
                                                            <PencilLine size={14} aria-hidden="true" />
                                                            {t("journal.editSummary")}
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => onGoToDay(entry.date)}
                                                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${theme.button} transition-colors`}
                                                    >
                                                        <Target size={14} aria-hidden="true" />
                                                        {t("journal.goToDay")}
                                                    </button>
                                                </div>
                                            </article>
                                        </li>
                                    </Fragment>
                                );
                            })}
                        </ol>
                    )}

                    {entries.length > shown.length && (
                        <div className="mt-4 flex justify-center">
                            <button
                                type="button"
                                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                                className={`rounded-lg px-4 py-2 text-sm font-medium ${theme.button} transition-colors`}
                            >
                                {t("journal.showMore", { count: entries.length - shown.length })}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className={`mt-10 flex flex-col items-center gap-3 px-6 text-center ${theme.textMuted}`}>
            <BookOpen size={36} strokeWidth={1.5} aria-hidden="true" />
            <p className="max-w-sm text-sm">{text}</p>
        </div>
    );
}

/** Resalta las coincidencias de la búsqueda (sin distinguir tildes ni mayúsculas). */
function Highlighted({ text, query }: { text: string; query: string }) {
    const matches = findMatches(text, query);
    if (matches.length === 0) return <>{text}</>;
    const parts: ReactNode[] = [];
    let last = 0;
    matches.forEach(([start, end], i) => {
        if (start > last) parts.push(text.slice(last, start));
        parts.push(<mark key={i} className="rounded-sm bg-amber-300/70 px-0.5 text-inherit dark:bg-amber-400/40">{text.slice(start, end)}</mark>);
        last = end;
    });
    if (last < text.length) parts.push(text.slice(last));
    return <>{parts}</>;
}
