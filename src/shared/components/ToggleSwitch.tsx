import type { ReactNode } from "react";

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    /** Nombre accesible del interruptor (lo que activa o desactiva). */
    label: string;
    /** id del texto que describe el estado actual, si existe. */
    describedBy?: string;
    title?: string;
    onClass?: string;
    offClass?: string;
    /** Contenido opcional dentro del círculo (p. ej. un icono). */
    knobContent?: ReactNode;
}

export function ToggleSwitch({
    checked,
    onChange,
    label,
    describedBy,
    title,
    onClass = "bg-accent",
    offClass = "bg-fg-muted/70",
    knobContent,
}: ToggleSwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            aria-describedby={describedBy}
            title={title ?? label}
            onClick={() => onChange(!checked)}
            className={`padding-esp flex-shrink-0 relative inline-flex h-8 w-14 items-center justify-start rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ${checked ? onClass : offClass}`}
        >
            <span
                aria-hidden="true"
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform motion-reduce:transition-none ${checked ? "translate-x-6" : "translate-x-0"}`}
            >
                {knobContent}
            </span>
        </button>
    );
}
