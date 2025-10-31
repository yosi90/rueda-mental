import type { SectorWithAngles, Scores } from '../../types';
import { cx, cy, radius, ringThickness, RING_COUNT } from '../../constants';
import { toRad } from '../../utils';

interface WheelSectorsProps {
    sectorsWithAngles: SectorWithAngles[];
    scores: Scores;
}

export function WheelSectors({ sectorsWithAngles, scores }: WheelSectorsProps) {
    const polarToCart = (angle: number, r: number) => {
        const rad = toRad(angle);
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    };

    const buildPath = (s: SectorWithAngles, level: number): string => {
        const innerR = radius - level * ringThickness;
        const outerR = radius - (level - 1) * ringThickness;

        const p0 = polarToCart(s.a0, innerR);
        const p1 = polarToCart(s.a1, innerR);
        const p2 = polarToCart(s.a1, outerR);
        const p3 = polarToCart(s.a0, outerR);

        const largeArc = s.a1 - s.a0 > 180 ? 1 : 0;

        return [
            `M ${p0.x} ${p0.y}`,
            `A ${innerR} ${innerR} 0 ${largeArc} 1 ${p1.x} ${p1.y}`,
            `L ${p2.x} ${p2.y}`,
            `A ${outerR} ${outerR} 0 ${largeArc} 0 ${p3.x} ${p3.y}`,
            'Z',
        ].join(' ');
    };

    return (
        <g id="sectors">
            {sectorsWithAngles.map((s) => {
                const level = scores[s.id] ?? 0;
                if (level === 0) return null;

                return (
                    <g key={s.id}>
                        {Array.from({ length: level }, (_, i) => {
                            const lv = level - i;
                            const opacity = 0.3 + (lv / RING_COUNT) * 0.7;

                            return (
                                <path
                                    key={`${s.id}-${lv}`}
                                    d={buildPath(s, lv)}
                                    fill={s.color}
                                    fillOpacity={opacity}
                                    stroke="none"
                                />
                            );
                        })}
                    </g>
                );
            })}
        </g>
    );
}