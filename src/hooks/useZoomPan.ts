import { useState } from 'react';

export function useZoomPan() {
    const [scale, setScale] = useState<number>(1);
    const [translateX, setTranslateX] = useState<number>(0);
    const [translateY, setTranslateY] = useState<number>(0);
    const [isPanning, setIsPanning] = useState<boolean>(false);
    const [startPan, setStartPan] = useState<{ x: number; y: number } | null>(null);
    const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
    const [hasPanned, setHasPanned] = useState<boolean>(false);

    const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale(prev => Math.max(0.5, Math.min(5, prev * delta)));
    };

    const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
        if (e.button === 0) {
            setIsPanning(true);
            setStartPan({ x: e.clientX - translateX, y: e.clientY - translateY });
            setHasPanned(false);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (isPanning && startPan) {
            const dx = e.clientX - startPan.x;
            const dy = e.clientY - startPan.y;
            setTranslateX(dx);
            setTranslateY(dy);
            if (Math.abs(dx - translateX) > 3 || Math.abs(dy - translateY) > 3) {
                setHasPanned(true);
            }
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
        setStartPan(null);
    };

    const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            setIsPanning(true);
            setStartPan({ x: touch.clientX - translateX, y: touch.clientY - translateY });
            setHasPanned(false);
        } else if (e.touches.length === 2) {
            const [t1, t2] = [e.touches[0], e.touches[1]];
            const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            setLastTouchDistance(dist);
            setIsPanning(false);
        }
    };

    const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
        if (e.touches.length === 1 && isPanning && startPan) {
            const touch = e.touches[0];
            const dx = touch.clientX - startPan.x;
            const dy = touch.clientY - startPan.y;
            setTranslateX(dx);
            setTranslateY(dy);
            if (Math.abs(dx - translateX) > 3 || Math.abs(dy - translateY) > 3) {
                setHasPanned(true);
            }
        } else if (e.touches.length === 2 && lastTouchDistance !== null) {
            const [t1, t2] = [e.touches[0], e.touches[1]];
            const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            const factor = dist / lastTouchDistance;
            setScale(prev => Math.max(0.5, Math.min(5, prev * factor)));
            setLastTouchDistance(dist);
        }
    };

    const handleTouchEnd = () => {
        setIsPanning(false);
        setStartPan(null);
        setLastTouchDistance(null);
    };

    const resetZoom = () => {
        setScale(1);
        setTranslateX(0);
        setTranslateY(0);
    };

    return {
        scale,
        translateX,
        translateY,
        isPanning,
        hasPanned,
        handleWheel,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        resetZoom,
    };
}