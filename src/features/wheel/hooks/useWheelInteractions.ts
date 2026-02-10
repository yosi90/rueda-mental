import { useRef, useState } from "react";
import type {
    Dispatch,
    MouseEvent as ReactMouseEvent,
    RefObject,
    SetStateAction,
    Touch as ReactTouchPoint,
    TouchEvent as ReactTouchEvent,
    WheelEvent as ReactWheelEvent,
} from "react";
import type {
    HoverInfo,
    InfoMenuContextual,
    ScoresByDate,
    SectorWithAngles,
} from "../../../shared/types/mentalWheel";

interface UseWheelInteractionsParams {
    svgRef: RefObject<SVGSVGElement | null>;
    size: number;
    cx: number;
    cy: number;
    radius: number;
    sectorsWithAngles: SectorWithAngles[];
    dateStr: string;
    inSector: (ang: number, sector: SectorWithAngles) => boolean;
    distanceToLevel: (distance: number) => number;
    setScoresByDate: Dispatch<SetStateAction<ScoresByDate>>;
    setHoverInfo: Dispatch<SetStateAction<HoverInfo | null>>;
    setInfoMenuContextual: Dispatch<SetStateAction<InfoMenuContextual | null>>;
}

interface PointHit {
    dist: number;
    sector: SectorWithAngles | undefined;
}

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

function toDeg(rad: number): number {
    return (rad * 180) / Math.PI;
}

function normDeg(d: number): number {
    return ((d % 360) + 360) % 360;
}

export function useWheelInteractions({
    svgRef,
    size,
    cx,
    cy,
    radius,
    sectorsWithAngles,
    dateStr,
    inSector,
    distanceToLevel,
    setScoresByDate,
    setHoverInfo,
    setInfoMenuContextual,
}: UseWheelInteractionsParams) {
    const [scale, setScale] = useState<number>(1);
    const [translateX, setTranslateX] = useState<number>(0);
    const [translateY, setTranslateY] = useState<number>(0);
    const [isPanning, setIsPanning] = useState<boolean>(false);
    const [startPan, setStartPan] = useState<{ x: number; y: number } | null>(null);
    const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
    const [hasPanned, setHasPanned] = useState<boolean>(false);

    const longPressTimerRef = useRef<number | null>(null);
    const longPressActivatedRef = useRef<boolean>(false);

    function toWheelPoint(
        svg: SVGSVGElement,
        clientX: number,
        clientY: number
    ): DOMPoint | null {
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const screenCTM = svg.getScreenCTM();
        if (!screenCTM) return null;
        const loc = pt.matrixTransform(screenCTM.inverse());
        loc.x = (loc.x - size / 2 - translateX) / scale + size / 2;
        loc.y = (loc.y - size / 2 - translateY) / scale + size / 2;
        return loc;
    }

    function findHit(pointX: number, pointY: number): PointHit | null {
        const dx = pointX - cx;
        const dy = pointY - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > radius) return null;
        const angle = toDeg(Math.atan2(dy, dx));
        const ang = normDeg(angle);
        const sector = sectorsWithAngles.find((s) => inSector(ang, s));
        return { dist, sector };
    }

    function clearLongPressTimer() {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    }

    function getTouchDistance(touch1: ReactTouchPoint, touch2: ReactTouchPoint): number {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function handleSvgContextMenu(e: ReactMouseEvent<SVGSVGElement>) {
        e.preventDefault();
        if (hasPanned) {
            setHasPanned(false);
            return;
        }
        const svg = svgRef.current;
        if (!svg) return;
        const point = toWheelPoint(svg, e.clientX, e.clientY);
        if (!point) return;
        const hit = findHit(point.x, point.y);
        if (!hit?.sector) return;
        setInfoMenuContextual({ idSector: hit.sector.id, x: e.clientX, y: e.clientY });
    }

    function handleSvgClick(e: ReactMouseEvent<SVGSVGElement>) {
        if (hasPanned || longPressActivatedRef.current) {
            setHasPanned(false);
            longPressActivatedRef.current = false;
            return;
        }
        const point = toWheelPoint(e.currentTarget, e.clientX, e.clientY);
        if (!point) return;
        const hit = findHit(point.x, point.y);
        const sector = hit?.sector;
        if (!hit || !sector) return;

        const level = distanceToLevel(hit.dist);
        setScoresByDate((prev) => ({
            ...prev,
            [dateStr]: { ...prev[dateStr], [sector.id]: level },
        }));
    }

    function handleSvgMove(e: ReactMouseEvent<SVGSVGElement>) {
        if (isPanning && startPan) {
            const dx = e.clientX - startPan.x;
            const dy = e.clientY - startPan.y;
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                setHasPanned(true);
            }
            setTranslateX((prev) => prev + dx);
            setTranslateY((prev) => prev + dy);
            setStartPan({ x: e.clientX, y: e.clientY });
            return;
        }

        const point = toWheelPoint(e.currentTarget, e.clientX, e.clientY);
        if (!point) {
            setHoverInfo(null);
            return;
        }
        const hit = findHit(point.x, point.y);
        if (!hit?.sector) {
            setHoverInfo(null);
            return;
        }
        const level = distanceToLevel(hit.dist);
        setHoverInfo({ sectorId: hit.sector.id, level });
    }

    function handleWheel(e: ReactWheelEvent<SVGSVGElement>) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale((prev) => clamp(prev * delta, 0.5, 5));
    }

    function handleTouchStart(e: ReactTouchEvent<SVGSVGElement>) {
        if (e.touches.length === 2) {
            const distance = getTouchDistance(e.touches[0], e.touches[1]);
            setLastTouchDistance(distance);
            setIsPanning(false);
            setStartPan(null);
            clearLongPressTimer();
        } else if (e.touches.length === 1) {
            const { clientX, clientY } = e.touches[0];
            longPressTimerRef.current = window.setTimeout(() => {
                if (!hasPanned && svgRef.current) {
                    const point = toWheelPoint(svgRef.current, clientX, clientY);
                    if (!point) return;
                    const hit = findHit(point.x, point.y);
                    if (!hit?.sector) return;
                    setInfoMenuContextual({ idSector: hit.sector.id, x: clientX, y: clientY });
                    longPressActivatedRef.current = true;
                    setIsPanning(false);
                    setStartPan(null);
                }
            }, 600);

            setIsPanning(true);
            setHasPanned(false);
            setStartPan({ x: clientX, y: clientY });
        }
    }

    function handleTouchMove(e: ReactTouchEvent<SVGSVGElement>) {
        if (e.touches.length === 2 && lastTouchDistance !== null) {
            e.preventDefault();
            const newDistance = getTouchDistance(e.touches[0], e.touches[1]);
            const delta = newDistance / lastTouchDistance;
            setScale((prev) => clamp(prev * delta, 0.5, 5));
            setLastTouchDistance(newDistance);
        } else if (e.touches.length === 1 && isPanning && startPan) {
            const dx = e.touches[0].clientX - startPan.x;
            const dy = e.touches[0].clientY - startPan.y;
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                setHasPanned(true);
                clearLongPressTimer();
            }
            setTranslateX((prev) => prev + dx);
            setTranslateY((prev) => prev + dy);
            setStartPan({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        }
    }

    function handleTouchEnd() {
        clearLongPressTimer();
        setLastTouchDistance(null);
        setIsPanning(false);
        setStartPan(null);
    }

    function handleMouseDown(e: ReactMouseEvent<SVGSVGElement>) {
        if (e.button === 0) {
            setIsPanning(true);
            setHasPanned(false);
            setStartPan({ x: e.clientX, y: e.clientY });
        }
    }

    function handleMouseUp() {
        setIsPanning(false);
        setStartPan(null);
    }

    function resetZoom() {
        setScale(1);
        setTranslateX(0);
        setTranslateY(0);
    }

    return {
        scale,
        translateX,
        translateY,
        isPanning,
        handleSvgContextMenu,
        handleSvgClick,
        handleSvgMove,
        handleWheel,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        handleMouseDown,
        handleMouseUp,
        resetZoom,
    };
}
