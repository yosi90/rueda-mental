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
    const detectSectorAndLevel = (clientX: number, clientY: number, svgElement: SVGSVGElement) => {
        const rect = svgElement.getBoundingClientRect();
        const scaleAdjusted = scale || 1;

        // Ajustar por escala y traslación
        const offsetX = (clientX - rect.left - translateX) / scaleAdjusted;
        const offsetY = (clientY - rect.top - translateY) / scaleAdjusted;

        const dx = offsetX - cx;
        const dy = offsetY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > radius || dist < 0) return null;

        const angleDeg = normDeg(toDeg(Math.atan2(dy, dx)));
        const sector = sectorsWithAngles.find((s) => inSector(angleDeg, s));

        if (!sector) return null;

        const level = clamp(Math.ceil((radius - dist) / ringThickness), 0, RING_COUNT);

        return { sectorId: sector.id, level };
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
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            style={{
                transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`,
                transformOrigin: 'center center',
                cursor: isClickingWheel ? 'grabbing' : 'grab',
                touchAction: 'none',
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
            <WheelGrid darkMode={darkMode} />
            <WheelSectors sectorsWithAngles={sectorsWithAngles} scores={scores} />
            <WheelLabels sectorsWithAngles={sectorsWithAngles} darkMode={darkMode} />
        </svg>
    );
}