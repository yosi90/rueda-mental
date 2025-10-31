import type { SectorWithAngles } from '../../types';
import { cx, cy, radius } from '../../constants';
import { toRad } from '../../utils';

interface WheelLabelsProps {
    sectorsWithAngles: SectorWithAngles[];
    darkMode: boolean;
}

export function WheelLabels({ sectorsWithAngles, darkMode }: WheelLabelsProps) {
    const labelColor = darkMode ? '#e5e5e5' : '#171717';
    const labelDistance = radius + 30;

    const polarToCart = (angle: number, r: number) => {
        const rad = toRad(angle);
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    };

    return (
        <g id="labels">
            {sectorsWithAngles.map((s) => {
                const pos = polarToCart(s.mid, labelDistance);
                const angle = s.mid;

                // Ajustar alineación del texto según posición
                let textAnchor: 'start' | 'middle' | 'end' = 'middle';
                if (angle > 45 && angle < 135) textAnchor = 'start';
                else if (angle > 225 && angle < 315) textAnchor = 'end';

                return (
                    <text
                        key={s.id}
                        x={pos.x}
                        y={pos.y}
                        textAnchor={textAnchor}
                        dominantBaseline="middle"
                        fill={labelColor}
                        fontSize={14}
                        fontWeight="500"
                        pointerEvents="none"
                    >
                        {s.name}
                    </text>
                );
            })}
        </g>
    );
}