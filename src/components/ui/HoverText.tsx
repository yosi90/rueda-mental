import type { Sector, HoverInfo } from '../../types';

interface HoverTextProps {
    sectors: Sector[];
    hoverInfo: HoverInfo;
    darkMode: boolean;
}

export function HoverText({ sectors, hoverInfo, darkMode }: HoverTextProps) {
    const sector = sectors.find((s) => s.id === hoverInfo.sectorId);

    if (!sector) return null;

    return (
        <span>
            {sector.name}:{' '}
            <b className={`text-base sm:text-lg ${darkMode ? 'text-neutral-100' : 'text-neutral-900'}`}>
                {hoverInfo.level}
            </b>
        </span>
    );
}