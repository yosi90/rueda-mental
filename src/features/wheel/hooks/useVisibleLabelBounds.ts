import { useEffect, useState, type RefObject } from "react";

export interface LabelBounds {
    minX: number;
    maxX: number;
}

const PAGE_MARGIN_PX = 8;

/**
 * Franja horizontal visible de la ventana expresada en unidades del viewBox de la rueda.
 * Las etiquetas pueden dibujarse fuera del lienzo (overflow visible) mientras quepan en la ventana.
 */
export function useVisibleLabelBounds(svgRef: RefObject<SVGSVGElement | null>, viewBoxSize: number): LabelBounds {
    const [bounds, setBounds] = useState<LabelBounds>({ minX: 0, maxX: viewBoxSize });

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        const update = () => {
            const rect = svg.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            // preserveAspectRatio="xMidYMid meet": el lienzo se escala al lado menor y se centra
            const scale = Math.min(rect.width, rect.height) / viewBoxSize;
            const originX = rect.left + (rect.width - viewBoxSize * scale) / 2;
            const minX = (PAGE_MARGIN_PX - originX) / scale;
            const maxX = (window.innerWidth - PAGE_MARGIN_PX - originX) / scale;
            setBounds((prev) => (
                Math.abs(prev.minX - minX) < 0.5 && Math.abs(prev.maxX - maxX) < 0.5 ? prev : { minX, maxX }
            ));
        };

        update();
        const observer = new ResizeObserver(update);
        observer.observe(svg);
        window.addEventListener("resize", update);
        return () => {
            observer.disconnect();
            window.removeEventListener("resize", update);
        };
    }, [svgRef, viewBoxSize]);

    return bounds;
}
