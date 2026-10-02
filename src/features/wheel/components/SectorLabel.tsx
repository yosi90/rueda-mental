import { useLayoutEffect, useRef, useState } from "react";
import { getSectorIcon } from "../../sectors/icons/sectorIcons";
import { theme } from "../../../shared/theme/theme";
import type { LabelBounds } from "../hooks/useVisibleLabelBounds";

interface SectorLabelProps {
    x: number;
    y: number;
    anchor: "start" | "middle" | "end";
    name: string;
    /** Puntuación en escala visible (0 = sin nota: no se muestra la pastilla). */
    score: number;
    iconId?: string;
    /** Pantallas pequeñas: solo icono + puntuación (el nombre, si no hay icono). */
    compact: boolean;
    /** Franja visible (unidades del viewBox): solo se desplaza la etiqueta si se saldría de ella. */
    bounds: LabelBounds;
}

const EDGE_MARGIN = 4;

/**
 * Etiqueta exterior de un sector: icono + nombre + pastilla con la puntuación.
 * El conjunto respeta el anclaje (izquierda, derecha o centrado) y solo se desplaza hacia dentro
 * si fuera a salirse de la parte visible de la ventana.
 */
export function SectorLabel({ x, y, anchor, name, score, iconId, compact, bounds }: SectorLabelProps) {
    const nameRef = useRef<SVGTextElement>(null);
    const [nameWidth, setNameWidth] = useState(0);
    const icon = getSectorIcon(iconId);
    const IconComponent = icon?.Icon;
    const showName = !compact || !icon;

    const iconSize = compact ? 22 : 16;
    const fontSize = 12;
    const badgeFontSize = compact ? 12 : 11;
    const badgeHeight = compact ? 19 : 16;
    const gap = 5;

    useLayoutEffect(() => {
        setNameWidth(showName ? nameRef.current?.getComputedTextLength() ?? 0 : 0);
    }, [name, showName]);

    const hasBadge = score > 0;
    const badgeWidth = hasBadge ? Math.max(badgeHeight, 8 + String(score).length * (badgeFontSize * 0.62)) : 0;
    const parts = [icon ? iconSize : 0, showName ? nameWidth : 0, badgeWidth].filter((w) => w > 0);
    const total = parts.reduce((sum, w) => sum + w, 0) + gap * Math.max(0, parts.length - 1);

    let left = anchor === "start" ? x : anchor === "end" ? x - total : x - total / 2;
    left = Math.max(bounds.minX + EDGE_MARGIN, Math.min(left, bounds.maxX - EDGE_MARGIN - total));

    let cursor = left;
    const iconX = cursor;
    if (icon) cursor += iconSize + gap;
    const nameX = cursor;
    if (showName) cursor += nameWidth + gap;
    const badgeX = cursor;

    return (
        <g aria-hidden="true">
            {IconComponent && (
                <IconComponent
                    x={iconX}
                    y={y - iconSize / 2}
                    size={iconSize}
                    color={theme.svgText}
                    strokeWidth={2}
                />
            )}
            {showName && (
                <text
                    ref={nameRef}
                    x={nameX}
                    y={y}
                    fontSize={fontSize}
                    textAnchor="start"
                    dominantBaseline="central"
                    fill={theme.svgText}
                    // Halo del color de fondo: legible sobre fondos ilustrados
                    stroke="var(--ui-page)"
                    strokeWidth={3}
                    strokeOpacity={0.85}
                    strokeLinejoin="round"
                    paintOrder="stroke"
                >
                    {name}
                </text>
            )}
            {hasBadge && (
                <>
                    <rect x={badgeX} y={y - badgeHeight / 2} width={badgeWidth} height={badgeHeight} rx={badgeHeight / 2} fill={theme.svgText} />
                    <text
                        x={badgeX + badgeWidth / 2}
                        y={y}
                        fontSize={badgeFontSize}
                        fontWeight={700}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={theme.svgBg}
                    >
                        {score}
                    </text>
                </>
            )}
        </g>
    );
}
