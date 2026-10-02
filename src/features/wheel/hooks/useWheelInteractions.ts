import { useEffect, useRef, useState } from "react";
import type {
    Dispatch,
    MouseEvent as ReactMouseEvent,
    PointerEvent as ReactPointerEvent,
    RefObject,
    SetStateAction,
} from "react";
import type { HoverInfo, InfoMenuContextual, SectorWithAngles } from "../../../shared/types/mentalWheel";
import { normalizeDeg } from "../utils/wheelGeometry";

interface UseWheelInteractionsParams {
    svgRef: RefObject<SVGSVGElement | null>;
    size: number;
    cx: number;
    cy: number;
    radius: number;
    sectorsWithAngles: SectorWithAngles[];
    inSector: (angle: number, sector: SectorWithAngles) => boolean;
    distanceToLevel: (distance: number) => number;
    /** Clic en un sector: `level` es la puntuación interna (anillo) pulsada. */
    onWheelScore: (sectorId: string, level: number) => void;
    setHoverInfo: Dispatch<SetStateAction<HoverInfo | null>>;
    setInfoMenuContextual: Dispatch<SetStateAction<InfoMenuContextual | null>>;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;
const DRAG_THRESHOLD_PX = 4;
const LONG_PRESS_MS = 600;

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

/**
 * Interacciones de la rueda con Pointer Events (ratón, táctil y lápiz):
 * clic para puntuar, clic derecho / pulsación larga para el menú, rueda o pellizco para zoom
 * y arrastre para desplazar (solo con zoom distinto de 1).
 * El estado transitorio del gesto vive en refs para no re-renderizar en cada movimiento.
 */
export function useWheelInteractions({
    svgRef,
    size,
    cx,
    cy,
    radius,
    sectorsWithAngles,
    inSector,
    distanceToLevel,
    onWheelScore,
    setHoverInfo,
    setInfoMenuContextual,
}: UseWheelInteractionsParams) {
    const [scale, setScale] = useState(1);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);

    const pointersRef = useRef(new Map<number, { x: number; y: number }>());
    const gestureRef = useRef({
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0,
        moved: false,
        pinchDistance: null as number | null,
        suppressClick: false,
    });
    const longPressTimerRef = useRef<number | null>(null);
    const scaleRef = useRef(scale);
    const translateRef = useRef(translate);
    useEffect(() => {
        scaleRef.current = scale;
        translateRef.current = translate;
    });

    function toWheelPoint(clientX: number, clientY: number): { x: number; y: number } | null {
        const svg = svgRef.current;
        const screenCTM = svg?.getScreenCTM();
        if (!svg || !screenCTM) return null;
        const point = new DOMPoint(clientX, clientY).matrixTransform(screenCTM.inverse());
        const { x: tx, y: ty } = translateRef.current;
        return {
            x: (point.x - size / 2 - tx) / scaleRef.current + size / 2,
            y: (point.y - size / 2 - ty) / scaleRef.current + size / 2,
        };
    }

    function hitTest(clientX: number, clientY: number): { sector: SectorWithAngles; level: number } | null {
        const point = toWheelPoint(clientX, clientY);
        if (!point) return null;
        const dx = point.x - cx;
        const dy = point.y - cy;
        const distance = Math.hypot(dx, dy);
        if (distance > radius) return null;
        const angle = normalizeDeg((Math.atan2(dy, dx) * 180) / Math.PI);
        const sector = sectorsWithAngles.find((s) => inSector(angle, s));
        return sector ? { sector, level: distanceToLevel(distance) } : null;
    }

    function clearLongPress() {
        if (longPressTimerRef.current !== null) {
            window.clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    }

    function openMenuAt(clientX: number, clientY: number) {
        const hit = hitTest(clientX, clientY);
        if (hit) setInfoMenuContextual({ idSector: hit.sector.id, x: clientX, y: clientY });
    }

    function pinchDistance(): number | null {
        const points = [...pointersRef.current.values()];
        return points.length === 2 ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) : null;
    }

    // Zoom con la rueda del ratón: listener nativo no pasivo para poder evitar el scroll de la página.
    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        const handleWheel = (event: WheelEvent) => {
            event.preventDefault();
            setScale((prev) => clamp(prev * (event.deltaY > 0 ? 0.9 : 1.1), MIN_SCALE, MAX_SCALE));
        };
        svg.addEventListener("wheel", handleWheel, { passive: false });
        return () => svg.removeEventListener("wheel", handleWheel);
    }, [svgRef]);

    useEffect(() => clearLongPress, []);

    function onPointerDown(e: ReactPointerEvent<SVGSVGElement>) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const gesture = gestureRef.current;

        if (pointersRef.current.size === 2) {
            // Segundo dedo: empieza un pellizco y se cancela cualquier clic o pulsación larga
            clearLongPress();
            gesture.pinchDistance = pinchDistance();
            gesture.suppressClick = true;
            setIsPanning(false);
            return;
        }

        Object.assign(gesture, {
            startX: e.clientX,
            startY: e.clientY,
            lastX: e.clientX,
            lastY: e.clientY,
            moved: false,
            pinchDistance: null,
            suppressClick: false,
        });
        if (scaleRef.current !== 1) setIsPanning(true);

        if (e.pointerType !== "mouse") {
            const { clientX, clientY } = e;
            longPressTimerRef.current = window.setTimeout(() => {
                longPressTimerRef.current = null;
                if (gestureRef.current.moved) return;
                gestureRef.current.suppressClick = true;
                setIsPanning(false);
                openMenuAt(clientX, clientY);
            }, LONG_PRESS_MS);
        }
    }

    function onPointerMove(e: ReactPointerEvent<SVGSVGElement>) {
        const gesture = gestureRef.current;
        if (!pointersRef.current.has(e.pointerId)) {
            // Sin botón pulsado: solo resaltado al pasar el ratón
            if (e.pointerType === "mouse") {
                const hit = hitTest(e.clientX, e.clientY);
                setHoverInfo(hit ? { sectorId: hit.sector.id, level: hit.level } : null);
            }
            return;
        }
        pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pointersRef.current.size === 2) {
            const distance = pinchDistance();
            if (distance && gesture.pinchDistance) {
                const ratio = distance / gesture.pinchDistance;
                setScale((prev) => clamp(prev * ratio, MIN_SCALE, MAX_SCALE));
            }
            gesture.pinchDistance = distance;
            return;
        }

        if (!gesture.moved && Math.hypot(e.clientX - gesture.startX, e.clientY - gesture.startY) > DRAG_THRESHOLD_PX) {
            gesture.moved = true;
            gesture.suppressClick = true;
            clearLongPress();
        }
        if (gesture.moved && scaleRef.current !== 1) {
            const dx = e.clientX - gesture.lastX;
            const dy = e.clientY - gesture.lastY;
            setTranslate((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        }
        gesture.lastX = e.clientX;
        gesture.lastY = e.clientY;
    }

    function onPointerUp(e: ReactPointerEvent<SVGSVGElement>) {
        pointersRef.current.delete(e.pointerId);
        clearLongPress();
        if (pointersRef.current.size < 2) gestureRef.current.pinchDistance = null;
        if (pointersRef.current.size === 0) setIsPanning(false);
    }

    function onPointerLeave(e: ReactPointerEvent<SVGSVGElement>) {
        if (e.pointerType === "mouse") setHoverInfo(null);
    }

    function onClick(e: ReactMouseEvent<SVGSVGElement>) {
        if (gestureRef.current.suppressClick) {
            gestureRef.current.suppressClick = false;
            return;
        }
        const hit = hitTest(e.clientX, e.clientY);
        if (hit) onWheelScore(hit.sector.id, hit.level);
    }

    function onContextMenu(e: ReactMouseEvent<SVGSVGElement>) {
        e.preventDefault();
        // En táctil la pulsación larga ya abre el menú (y algunos navegadores emiten además contextmenu)
        if (gestureRef.current.moved) return;
        openMenuAt(e.clientX, e.clientY);
    }

    function resetZoom() {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
    }

    return {
        scale,
        translateX: translate.x,
        translateY: translate.y,
        isPanning,
        resetZoom,
        handlers: {
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerCancel: onPointerUp,
            onPointerLeave,
            onClick,
            onContextMenu,
        },
    };
}
