import type { KeyboardEvent } from "react";
import { theme } from "../../../shared/theme/theme";
import type { HoverInfo, Sector, SectorWithAngles } from "../../../shared/types/mentalWheel";
import { useI18n } from "../../../shared/i18n/I18nContext";
import { toDisplayScore } from "../../../shared/utils/scoreScale";
import { SectorLabel } from "./SectorLabel";

interface WheelLayersProps {
    cx: number;
    cy: number;
    radius: number;
    ringCount: number;
    isScaleInverted: boolean;
    ringNumberFontSize: number;
    sectors: Sector[];
    sectorsWithAngles: SectorWithAngles[];
    scores: Record<string, number>;
    /** Pantallas pequeñas: etiquetas con solo icono + puntuación. */
    compactLabels: boolean;
    /** Sector resaltado (lo señala el tutorial). */
    highlightSectorId?: string | null;
    /** Puntuaciones de otro día dibujadas como contorno discontinuo (referencia). */
    referenceScores?: Record<string, number> | null;
    hoverInfo: HoverInfo | null;
    dateStr: string;
    getComment: (date: string, sectorId: string) => string;
    levelOuterRadius: (level: number) => number;
    levelLabelRadius: (level: number) => number;
    /** id del texto con las instrucciones de teclado. */
    keyboardHintId: string;
    /** Puntuación en escala visible (0 = sin nota). */
    onKeyboardScore: (sectorId: string, displayScore: number) => void;
    /** Abre el menú del sector en las coordenadas de pantalla indicadas. */
    onOpenSectorMenu: (sectorId: string, x: number, y: number) => void;
}

const LABEL_OFFSET = 24; // distancia de la etiqueta al borde de la rueda

function toRad(deg: number): number {
    return (deg * Math.PI) / 180;
}

function polar(cx: number, cy: number, r: number, angDeg: number): [number, number] {
    const rad = toRad(angDeg);
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function sectorPath(cx: number, cy: number, innerR: number, outerR: number, a0: number, a1: number): string {
    const [x0i, y0i] = polar(cx, cy, innerR, a0);
    const [x0o, y0o] = polar(cx, cy, outerR, a0);
    const [x1o, y1o] = polar(cx, cy, outerR, a1);
    const [x1i, y1i] = polar(cx, cy, innerR, a1);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M ${x0i} ${y0i}
            L ${x0o} ${y0o}
            A ${outerR} ${outerR} 0 ${large} 1 ${x1o} ${y1o}
            L ${x1i} ${y1i}
            A ${innerR} ${innerR} 0 ${large} 0 ${x0i} ${y0i}
            Z`;
}

export function WheelLayers({
    cx,
    cy,
    radius,
    ringCount,
    isScaleInverted,
    ringNumberFontSize,
    sectors,
    sectorsWithAngles,
    scores,
    referenceScores,
    highlightSectorId,
    compactLabels,
    hoverInfo,
    dateStr,
    getComment,
    levelOuterRadius,
    levelLabelRadius,
    keyboardHintId,
    onKeyboardScore,
    onOpenSectorMenu,
}: WheelLayersProps) {
    const { t } = useI18n();

    // Arco discontinuo con la puntuación de referencia de cada sector
    const referenceArcs = referenceScores
        ? sectorsWithAngles.map((s) => {
            const level = Math.max(0, Math.min(ringCount, referenceScores[s.id] ?? 0));
            if (level <= 0) return null;
            const r = levelOuterRadius(level);
            const [x0, y0] = polar(cx, cy, r, s.a0);
            const [x1, y1] = polar(cx, cy, r, s.a1);
            const large = s.a1 - s.a0 > 180 ? 1 : 0;
            return (
                <path
                    key={`ref-${s.id}`}
                    d={`M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`}
                    fill="none"
                    stroke={theme.svgText}
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    strokeLinecap="round"
                    opacity={0.75}
                    pointerEvents="none"
                />
            );
        })
        : null;

    const gridRings = Array.from({ length: ringCount }, (_, i) => (
        <circle
            key={`r-${i + 1}`}
            cx={cx}
            cy={cy}
            r={levelOuterRadius(i + 1)}
            fill="none"
            stroke={theme.svgGrid}
            strokeDasharray="4 4"
        />
    ));

    const gridLines = sectorsWithAngles.map((s) => {
        const [x1, y1] = polar(cx, cy, radius, s.a0);
        return <line key={`l-${s.id}`} x1={cx} y1={cy} x2={x1} y2={y1} stroke={theme.svgGrid} />;
    });

    const filledSectors = sectorsWithAngles.map((s) => {
        const val = Math.max(0, Math.min(ringCount, scores[s.id] ?? 0));
        if (val <= 0) return null;
        const path = sectorPath(cx, cy, 0, levelOuterRadius(val), s.a0, s.a1);
        return (
            <path key={`v-${s.id}`} d={path} fill={s.color} opacity={0.6} stroke={s.color} strokeOpacity={0.9} />
        );
    });

    const labels = sectorsWithAngles.map((s) => {
        const [tx, ty] = polar(cx, cy, radius + LABEL_OFFSET, s.mid);
        const cosv = Math.cos(toRad(s.mid));
        const anchor = cosv > 0.25 ? "start" : cosv < -0.25 ? "end" : "middle";
        const hasComment = !!getComment(dateStr, s.id);

        return (
            <g key={`lab-${s.id}`}>
                <SectorLabel
                    x={tx}
                    y={ty}
                    anchor={anchor}
                    name={s.name}
                    score={toDisplayScore(scores[s.id] ?? 0, ringCount, isScaleInverted)}
                    iconId={s.icon}
                    compact={compactLabels}
                />

                {hasComment && (
                    <text
                        aria-hidden="true"
                        x={tx + (anchor === "start" ? 10 : anchor === "end" ? -10 : 0)}
                        y={ty - 10}
                        fontSize={12}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={theme.svgText}
                        aria-label={t("wheel.hasCommentAria")}
                        style={{ cursor: "help" }}
                    >
                        <title>{t("wheel.hasCommentTitle")}</title>
                        📌
                    </text>
                )}
            </g>
        );
    });

    const ringNumbers = sectors.length > 10
        ? null
        : Array.from({ length: ringCount }, (_, i) => {
            const level = i + 1;
            const r = levelLabelRadius(level);
            const [tx, ty] = polar(cx, cy, r, 0);
            const displayLevel = toDisplayScore(level, ringCount, isScaleInverted);
            return (
                <text
                    key={`n-${i}`}
                    x={tx}
                    y={ty}
                    fontSize={ringNumberFontSize}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={theme.svgText}
                    opacity={0.75}
                    className="hidden md:block"
                >
                    {displayLevel}
                </text>
            );
        });

    const highlightPath = (() => {
        const s = highlightSectorId ? sectorsWithAngles.find((x) => x.id === highlightSectorId) : null;
        if (!s) return null;
        return (
            <path
                d={sectorPath(cx, cy, 0, radius, s.a0, s.a1)}
                fill="var(--ui-accent-soft)"
                stroke="var(--ui-accent)"
                strokeWidth={3}
                strokeLinejoin="round"
                className="tutorial-highlight"
                pointerEvents="none"
                aria-hidden="true"
            />
        );
    })();

    const hoverLayer = (() => {
        if (!hoverInfo) return null;
        const s = sectorsWithAngles.find((x) => x.id === hoverInfo.sectorId);
        if (!s) return null;
        const r = levelOuterRadius(hoverInfo.level);
        const p = sectorPath(cx, cy, 0, r, s.a0, s.a1);
        return <path d={p} fill={s.color} opacity={0.2} pointerEvents="none" />;
    })();

    // Capa enfocable para teclado y lectores de pantalla: un slider por sector.
    // pointerEvents="none" para que el ratón siga usando la lógica de clic por coordenadas.
    function handleSectorKeyDown(event: KeyboardEvent<SVGPathElement>, sectorId: string, current: number) {
        const { key } = event;
        let next: number | null = null;
        if (key === "ArrowUp" || key === "ArrowRight") next = Math.min(ringCount, current + 1);
        else if (key === "ArrowDown" || key === "ArrowLeft") next = Math.max(0, current - 1);
        else if (key === "Home") next = 0;
        else if (key === "End") next = ringCount;
        else if (/^[0-9]$/.test(key)) next = Number(key);

        if (next !== null) {
            event.preventDefault();
            if (next !== current) onKeyboardScore(sectorId, next);
            return;
        }
        if (key === "Enter" || key === "ContextMenu" || (key === "F10" && event.shiftKey)) {
            event.preventDefault();
            const rect = event.currentTarget.getBoundingClientRect();
            onOpenSectorMenu(sectorId, rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
    }

    const keyboardSliders = sectorsWithAngles.map((s) => {
        const displayScore = toDisplayScore(scores[s.id] ?? 0, ringCount, isScaleInverted);
        return (
            <path
                key={`kb-${s.id}`}
                d={sectorPath(cx, cy, 0, radius, s.a0, s.a1)}
                fill="transparent"
                pointerEvents="none"
                className="wheel-sector-focus"
                tabIndex={0}
                role="slider"
                aria-label={s.name}
                aria-valuemin={0}
                aria-valuemax={ringCount}
                aria-valuenow={displayScore}
                aria-valuetext={displayScore > 0
                    ? t("wheel.valueText", { value: displayScore, max: ringCount })
                    : t("wheel.unscored")}
                aria-describedby={keyboardHintId}
                onKeyDown={(e) => handleSectorKeyDown(e, s.id, displayScore)}
            />
        );
    });

    return (
        <>
            {filledSectors}
            <g>
                {gridRings}
                {gridLines}
            </g>
            {referenceArcs}
            {labels}
            {ringNumbers}
            {hoverLayer}
            {highlightPath}
            {keyboardSliders}
        </>
    );
}
