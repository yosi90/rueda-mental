import { useState } from 'react';
import type { SectorWithAngles, HoverInfo, Scores } from '../../types';
import { SIZE, cx, cy, radius, RING_COUNT } from '../../constants';
import { normDeg, inSector, toDeg, clamp } from '../../utils';
import { WheelGrid } from './WheelGrid';
import { WheelSectors } from './WheelSectors';
import { WheelLabels } from './WheelLabels';

interface WheelChartProps {
    sectorsWithAngles: SectorWithAngles[];
    scores: Scores;
    darkMode: boolean;
    scale: number;
    translateX: number;
    translateY: number;
    hasPanned: boolean;
    onHoverChange: (info: HoverInfo | null) => void;
    onScoreChange: (sectorId: string, value: number) => void;
    onWheel: (e: React.WheelEvent<SVGSVGElement>) => void;
    onMouseDown: (e: React.MouseEvent<SVGSVGElement>) => void;
    onMouseMove: (e: React.MouseEvent<SVGSVGElement>) => void;
    onMouseUp: () => void;
    onTouchStart: (e: React.TouchEvent<SVGSVGElement>) => void;
    onTouchMove: (e: React.TouchEvent<SVGSVGElement>) => void;
    onTouchEnd: () => void;
}

export function WheelChart({
    sectorsWithAngles,
    scores,
    darkMode,
    scale,
    translateX,
    translateY,
    hasPanned,
    onHoverChange,
    onScoreChange,
    onWheel,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
}: WheelChartProps) {
    const [isClickingWheel, setIsClickingWheel] = useState(false);

    // Calcular sectores con ángulos
    const ringThickness = radius / RING_COUNT;

    // Detectar sector y nivel desde coordenadas del mouse
    // Usamos createSVGPoint + getScreenCTM inverse para mapear coords de pantalla a coords SVG
    const detectSectorAndLevel = (clientX: number, clientY: number, svgElement: SVGSVGElement) => {
        try {
            const pt = svgElement.createSVGPoint();
            pt.x = clientX;
            pt.y = clientY;
            const screenCTM = svgElement.getScreenCTM();
            if (!screenCTM) return null;
            const inv = screenCTM.inverse();
            const loc = pt.matrixTransform(inv);

            // Aplicar transformación inversa del zoom/pan que aplicamos en el <g>
            // La transformación aplicada es: translate(SIZE/2 + translateX, SIZE/2 + translateY) scale(scale) translate(-SIZE/2, -SIZE/2)
            const transformedX = (loc.x - SIZE / 2 - translateX) / scale + SIZE / 2;
            const transformedY = (loc.y - SIZE / 2 - translateY) / scale + SIZE / 2;

            const dx = transformedX - cx;
            const dy = transformedY - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > radius || dist < 0) return null;

            const angleDeg = normDeg(toDeg(Math.atan2(dy, dx)));
            const sector = sectorsWithAngles.find((s) => inSector(angleDeg, s));
            if (!sector) return null;

            const level = clamp(Math.ceil((radius - dist) / ringThickness), 0, RING_COUNT);
            return { sectorId: sector.id, level };
        } catch (err) {
            // en caso de fallo en transformaciones, no bloquear la UI
            console.error('detectSectorAndLevel error:', err);
            return null;
        }
    };

    const handleMouseMoveOnWheel = (e: React.MouseEvent<SVGSVGElement>) => {
        onMouseMove(e);

        if (hasPanned) return;

        const result = detectSectorAndLevel(e.clientX, e.clientY, e.currentTarget);
        onHoverChange(result);
    };

    const handleMouseDownOnWheel = (e: React.MouseEvent<SVGSVGElement>) => {
        onMouseDown(e);
        setIsClickingWheel(true);
    };

    const handleMouseUpOnWheel = (e: React.MouseEvent<SVGSVGElement>) => {
        onMouseUp();

        if (!hasPanned && isClickingWheel) {
            const result = detectSectorAndLevel(e.clientX, e.clientY, e.currentTarget);
            if (result) {
                onScoreChange(result.sectorId, result.level);
            }
        }

        setIsClickingWheel(false);
    };

    const handleTouchMoveOnWheel = (e: React.TouchEvent<SVGSVGElement>) => {
        onTouchMove(e);

        if (hasPanned || e.touches.length !== 1) return;

        const touch = e.touches[0];
        const result = detectSectorAndLevel(touch.clientX, touch.clientY, e.currentTarget);
        onHoverChange(result);
    };

    const handleTouchStartOnWheel = (e: React.TouchEvent<SVGSVGElement>) => {
        onTouchStart(e);
        setIsClickingWheel(true);
    };

    const handleTouchEndOnWheel = (e: React.TouchEvent<SVGSVGElement>) => {
        onTouchEnd();

        if (!hasPanned && isClickingWheel && e.changedTouches.length === 1) {
            const touch = e.changedTouches[0];
            const result = detectSectorAndLevel(touch.clientX, touch.clientY, e.currentTarget);
            if (result) {
                onScoreChange(result.sectorId, result.level);
            }
        }

        setIsClickingWheel(false);
        onHoverChange(null);
    };

    const handleMouseLeave = () => {
        onHoverChange(null);
        setIsClickingWheel(false);
    };

    return (
        <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            style={{
                maxWidth: `${SIZE}px`,
                maxHeight: `${SIZE}px`,
                cursor: isClickingWheel ? 'grabbing' : 'grab',
                touchAction: 'none',
                display: 'block',
            }}
            onWheel={onWheel}
            onMouseDown={handleMouseDownOnWheel}
            onMouseMove={handleMouseMoveOnWheel}
            onMouseUp={handleMouseUpOnWheel}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStartOnWheel}
            onTouchMove={handleTouchMoveOnWheel}
            onTouchEnd={handleTouchEndOnWheel}
        >
            {/* Aplicamos zoom/pan dentro del SVG con un <g> para que la caja del SVG no se vea transformada por CSS */}
            <g transform={`translate(${SIZE / 2 + translateX} ${SIZE / 2 + translateY}) scale(${scale}) translate(${-SIZE / 2} ${-SIZE / 2})`}>
                <WheelGrid darkMode={darkMode} />
                <WheelSectors sectorsWithAngles={sectorsWithAngles} scores={scores} />
                <WheelLabels sectorsWithAngles={sectorsWithAngles} darkMode={darkMode} />
            </g>
        </svg>
    );
}