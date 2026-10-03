/**
 * Miniatura de un estilo: «Aa» con la tipografía de títulos y las muestras de acento, botón y línea.
 * Debe ir dentro de un elemento con data-style/data-theme del estilo que representa.
 */
export function StylePreview({ large = false }: { large?: boolean }) {
    return (
        <span
            className={`flex flex-col justify-between rounded-lg bg-surface/85 text-fg shadow-sm ${large ? "h-24 p-3" : "h-16 p-2"}`}
            aria-hidden="true"
        >
            <span className={`${large ? "text-3xl" : "text-lg"} leading-none`} style={{ fontFamily: "var(--font-display, system-ui, sans-serif)" }}>Aa</span>
            <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                <span className="h-2.5 w-6 rounded-full bg-primary" />
                <span className="h-2.5 w-4 rounded-full bg-line" />
            </span>
        </span>
    );
}
