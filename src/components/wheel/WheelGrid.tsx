import { cx, cy, radius, ringThickness, RING_COUNT } from '../../constants';

interface WheelGridProps {
    darkMode: boolean;
}

export function WheelGrid({ darkMode }: WheelGridProps) {
    const gridColor = darkMode ? '#525252' : '#d4d4d4';

    return (
        <g id="grid">
            {/* Círculos concéntricos */}
            {Array.from({ length: RING_COUNT }, (_, i) => {
                const r = radius - i * ringThickness;
                return (
                    <circle
                        key={i}
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill="none"
                        stroke={gridColor}
                        strokeWidth={1}
                    />
                );
            })}

            {/* Círculo central */}
            <circle cx={cx} cy={cy} r={3} fill={gridColor} />
        </g>
    );
}