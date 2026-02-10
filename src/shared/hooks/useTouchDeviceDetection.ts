import { useEffect, useState } from "react";

function prefersTouchUI(): boolean {
    const hasTouchPoints = navigator.maxTouchPoints > 0;
    const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    const hoverNone = window.matchMedia?.("(hover: none)").matches ?? false;
    return Boolean(hasTouchPoints && coarse && hoverNone);
}

export function useTouchDeviceDetection(): boolean {
    const [isTouchDevice, setIsTouchDevice] = useState<boolean>(() => prefersTouchUI());

    useEffect(() => {
        const updateFromMQ = () => setIsTouchDevice(prefersTouchUI());

        const mqCoarse = window.matchMedia?.("(pointer: coarse)");
        const mqHoverNone = window.matchMedia?.("(hover: none)");
        mqCoarse?.addEventListener?.("change", updateFromMQ);
        mqHoverNone?.addEventListener?.("change", updateFromMQ);

        const onPointerDown = (e: PointerEvent) => {
            if (e.pointerType === "touch") setIsTouchDevice(true);
            else if (e.pointerType === "mouse") setIsTouchDevice(false);
        };
        window.addEventListener("pointerdown", onPointerDown, { passive: true });

        return () => {
            mqCoarse?.removeEventListener?.("change", updateFromMQ);
            mqHoverNone?.removeEventListener?.("change", updateFromMQ);
            window.removeEventListener("pointerdown", onPointerDown);
        };
    }, []);

    return isTouchDevice;
}
