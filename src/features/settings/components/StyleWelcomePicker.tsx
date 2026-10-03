import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useDialogA11y } from "../../../shared/hooks/useDialogA11y";
import { useI18n } from "../../../shared/i18n/I18nContext";
import type { TranslationKey } from "../../../shared/i18n/translations";
import { theme } from "../../../shared/theme/theme";
import { APP_STYLE_DEFINITIONS, APP_STYLES, applyAppStyle, type AppStyle } from "../../../shared/theme/styles";
import { StylePreview } from "./StylePreview";

interface StyleWelcomePickerProps {
    currentStyle: AppStyle;
    backgroundImage: boolean;
    onConfirm: (style: AppStyle) => void;
    /** «Ahora no»: se mantiene el estilo actual. */
    onDismiss: () => void;
}

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const isCarousel = () => window.matchMedia?.("(max-width: 639px)").matches;

/**
 * Selector de estilo de bienvenida. La página de detrás muestra en directo el estilo elegido
 * (sin guardarlo hasta confirmar). Escritorio: rejilla de tarjetas; móvil: carrusel deslizable
 * en el que el estilo centrado es el elegido.
 */
export function StyleWelcomePicker({ currentStyle, backgroundImage, onConfirm, onDismiss }: StyleWelcomePickerProps) {
    const { t } = useI18n();
    const dialogRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const initialFocusRef = useRef<HTMLButtonElement | null>(null);
    const titleId = useId();
    const descId = useId();
    const [selected, setSelected] = useState<AppStyle>(currentStyle);
    const selectedIndex = APP_STYLES.indexOf(selected);
    const scrollingFromSelection = useRef(false);

    function dismiss() {
        applyAppStyle(currentStyle, backgroundImage);
        onDismiss();
    }

    useDialogA11y(true, dismiss, dialogRef, initialFocusRef);

    // Vista previa en directo sobre la página
    useEffect(() => {
        applyAppStyle(selected, backgroundImage);
    }, [selected, backgroundImage]);

    // Carrusel (móvil): la tarjeta elegida se centra; al deslizar, la centrada pasa a ser la elegida
    function centerOption(index: number) {
        if (!isCarousel()) return;
        scrollingFromSelection.current = true;
        optionRefs.current[index]?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", inline: "center", block: "nearest" });
        window.setTimeout(() => { scrollingFromSelection.current = false; }, 450);
    }

    useEffect(() => {
        const list = listRef.current;
        if (!list) return;
        centerOption(APP_STYLES.indexOf(currentStyle));
        let frame = 0;
        const handleScroll = () => {
            if (scrollingFromSelection.current || !isCarousel()) return;
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const center = list.getBoundingClientRect().left + list.clientWidth / 2;
                let closest = 0;
                let best = Infinity;
                optionRefs.current.forEach((el, i) => {
                    if (!el) return;
                    const r = el.getBoundingClientRect();
                    const distance = Math.abs(r.left + r.width / 2 - center);
                    if (distance < best) {
                        best = distance;
                        closest = i;
                    }
                });
                setSelected(APP_STYLES[closest]);
            });
        };
        list.addEventListener("scroll", handleScroll, { passive: true });
        return () => {
            list.removeEventListener("scroll", handleScroll);
            cancelAnimationFrame(frame);
        };
        // Solo al montar: centrar el estilo actual y escuchar el deslizamiento
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function select(index: number, focus = false) {
        setSelected(APP_STYLES[index]);
        centerOption(index);
        if (focus) optionRefs.current[index]?.focus({ preventScroll: isCarousel() });
    }

    function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
        const last = APP_STYLES.length - 1;
        const next = event.key === "ArrowRight" || event.key === "ArrowDown" ? Math.min(last, selectedIndex + 1)
            : event.key === "ArrowLeft" || event.key === "ArrowUp" ? Math.max(0, selectedIndex - 1)
            : event.key === "Home" ? 0
            : event.key === "End" ? last
            : null;
        if (next === null) return;
        event.preventDefault();
        select(next, true);
    }

    return (
        <>
            {/* Capa transparente: la página se ve (con el estilo en directo) pero no se puede tocar */}
            <div className="fixed inset-0 z-[60]" aria-hidden="true" />
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descId}
                tabIndex={-1}
                className={`fixed z-[61] inset-x-0 bottom-0 rounded-t-2xl border-t sm:inset-x-auto sm:bottom-6 sm:left-1/2 sm:w-[min(64rem,calc(100%-3rem))] sm:-translate-x-1/2 sm:rounded-2xl sm:border ${theme.border} bg-surface/95 backdrop-blur-md ${theme.text} shadow-2xl outline-none motion-safe:animate-[toast-in_250ms_ease-out]`}
            >
                <div className="px-5 pt-5 sm:px-6">
                    <h2 id={titleId} className="text-xl sm:text-2xl font-bold">{t("welcome.styleTitle")}</h2>
                    {/* En móvil se oculta (sigue como descripción accesible del diálogo) */}
                    <p id={descId} className={`mt-1 hidden text-sm sm:block ${theme.textMuted}`}>{t("welcome.styleSubtitle")}</p>
                </div>

                <div
                    ref={listRef}
                    role="radiogroup"
                    aria-labelledby={titleId}
                    className="mt-2 flex snap-x snap-mandatory gap-3 overflow-x-auto px-[15%] py-3 [scrollbar-width:none] sm:mt-4 sm:py-0 sm:pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-6 lg:grid-cols-6"
                >
                    {APP_STYLES.map((id, index) => {
                        const definition = APP_STYLE_DEFINITIONS[id];
                        const active = id === selected;
                        return (
                            <button
                                key={id}
                                ref={(el) => {
                                    optionRefs.current[index] = el;
                                    if (id === currentStyle) initialFocusRef.current = el;
                                }}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                tabIndex={active ? 0 : -1}
                                onClick={() => select(index, true)}
                                onKeyDown={handleKeyDown}
                                data-style={id}
                                data-theme={definition.mode}
                                className={`app-backdrop w-[70%] shrink-0 snap-center overflow-hidden rounded-xl border-2 p-2 text-left transition-[transform,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 sm:w-auto ${
                                    active ? "border-accent motion-safe:scale-[1.02]" : "border-line opacity-90 hover:opacity-100"
                                }`}
                            >
                                <StylePreview large />
                                <span className="mt-2 block rounded-md bg-surface/85 px-2 py-1.5 text-fg">
                                    <span className="flex items-center justify-between gap-1 text-sm font-semibold">
                                        {t(definition.labelKey)}
                                        {active && <span aria-hidden="true">✓</span>}
                                    </span>
                                    <span className="block text-xs leading-snug text-fg-muted">{t(`style.${id}.desc` as TranslationKey)}</span>
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Puntos del carrusel (solo móvil) */}
                <div className="mt-1 flex justify-center gap-1.5 sm:hidden" aria-hidden="true">
                    {APP_STYLES.map((id) => (
                        <span key={id} className={`h-1.5 rounded-full transition-all ${id === selected ? "w-5 bg-accent" : "w-1.5 bg-line"}`} />
                    ))}
                </div>

                <div className="flex flex-col-reverse gap-2 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:flex-row sm:justify-end sm:px-6 sm:pb-5">
                    <button
                        type="button"
                        onClick={dismiss}
                        className={`rounded-lg px-4 py-2.5 text-sm font-medium ${theme.button} transition-colors`}
                    >
                        {t("welcome.later")}
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm(selected)}
                        className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg shadow-md transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
                    >
                        {t("welcome.useStyle", { style: t(APP_STYLE_DEFINITIONS[selected].labelKey) })}
                    </button>
                </div>
            </div>
        </>
    );
}
