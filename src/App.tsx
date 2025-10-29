import { useEffect, useMemo, useState } from "react";

// === Mental Performance Wheel (single-file React component) ===
// - Añade/Quita sectores (aspectos de vida)
// - Puntúa de 0 a 10 cada sector haciendo clic en la rueda o con slider
// - Guarda automáticamente por día en localStorage
// - Exporta/Importa JSON
// - UI en español (ES)

interface Sector {
    id: string;
    name: string;
    color: string;
}

interface SectorWithAngles extends Sector {
    a0: number;
    a1: number;
    mid: number;
    a0n: number;
    a1n: number;
}

interface HoverInfo {
    sectorId: string;
    level: number;
}

interface Scores {
    [key: string]: number;
}

interface ScoresByDate {
    [key: string]: Scores;
}

export default function MentalWheelApp() {
    // --- Configuración base ---
    const RING_COUNT = 10; // 0..10 (0 = sin nota)
    const SIZE = 520; // tamaño SVG
    const PADDING = 70; // margen para etiquetas externas (aumentado para mejor visualización)
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const radius = (SIZE / 2) - PADDING;
    const ringThickness = radius / RING_COUNT;

    // --- Helpers ---
    const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));
    const toRad = (deg: number): number => (deg * Math.PI) / 180;
    const toDeg = (rad: number): number => (rad * 180) / Math.PI;

    const formatDateInput = (d: Date): string => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${dd}`;
    };

    const normDeg = (d: number): number => ((d % 360) + 360) % 360; // 0..360
    const inSector = (ang: number, s: SectorWithAngles): boolean => {
        const a0 = s.a0n, a1 = s.a1n;           // ya normalizados
        return a0 <= a1 ? (ang >= a0 && ang <= a1)
            : (ang >= a0 || ang <= a1); // sector que cruza 360°
    };

    // --- Estado ---
    const todayStr = formatDateInput(new Date());
    const [dateStr, setDateStr] = useState<string>(todayStr);
    const [sectors, setSectors] = useState<Sector[]>(() => loadConfig() || defaultSectors());
    // scores: mapa { dateStr: { id: value } }
    const [scoresByDate, setScoresByDate] = useState<ScoresByDate>(() => loadScores());
    const scores = scoresByDate[dateStr] || {};

    // UI state
    const [newName, setNewName] = useState<string>("");
    const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [darkMode, setDarkMode] = useState<boolean>(() => {
        try {
            const saved = localStorage.getItem("mental-wheel-dark-mode");
            return saved ? JSON.parse(saved) : false;
        } catch {
            return false;
        }
    });

    // Guardar preferencia de tema
    useEffect(() => {
        try {
            localStorage.setItem("mental-wheel-dark-mode", JSON.stringify(darkMode));
        } catch (error) {
            console.error("Error al guardar el tema:", error);
        }
    }, [darkMode]);

    // Guardar en localStorage cuando cambia config o datos
    useEffect(() => saveConfig(sectors), [sectors]);
    useEffect(() => saveScores(scoresByDate), [scoresByDate]);

    // Asegura que todos los sectores tengan un score en el día actual
    useEffect(() => {
        if (!scoresByDate[dateStr]) {
            setScoresByDate((prev) => ({ ...prev, [dateStr]: {} }));
        }
    }, [dateStr, scoresByDate]);

    const sectorsWithAngles = useMemo(() => {
        const gapDeg = 2;
        const count = Math.max(1, sectors.length);
        const full = 360;
        const sectorSpan = (full - count * gapDeg) / count;
        let start = -90; // arriba

        return sectors.map((s) => {
            const a0 = start + gapDeg / 2;
            const a1 = a0 + sectorSpan;
            const mid = (a0 + a1) / 2;
            start += sectorSpan + gapDeg;
            return { ...s, a0, a1, mid, a0n: normDeg(a0), a1n: normDeg(a1) };
        });
    }, [sectors]);

    // --- LocalStorage ---
    function loadConfig() {
        try {
            const raw = localStorage.getItem("mental-wheel-config-v1");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }
    function saveConfig(cfg: Sector[]): void {
        try {
            localStorage.setItem("mental-wheel-config-v1", JSON.stringify(cfg));
        } catch (error) {
            console.error("Error al guardar la configuración:", error);
        }
    }

    function saveScores(data: ScoresByDate): void {
        try {
            localStorage.setItem("mental-wheel-scores-v1", JSON.stringify(data));
        } catch (error) {
            console.error("Error al guardar las puntuaciones:", error);
        }
    }
    function defaultSectors() {
        const names = [
            "Familia",
            "Amigos",
            "Dinero",
            "Amor",
            "Trabajo",
            "Salud",
            "Ocio",
            "Aprendizaje",
        ];
        return names.map((name, i) => ({ id: genId(), name, color: hslFor(i) }));
    }
    function loadScores() {
        try {
            const raw = localStorage.getItem("mental-wheel-scores-v1");
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }
    // La función saveScores se ha movido más arriba con tipos apropiados

    function genId() {
        return Math.random().toString(36).slice(2, 10);
    }
    function hslFor(i: number): string {
        // Usar el ángulo dorado (~137.5°) para mejor distribución de colores
        // Esto asegura que los colores estén bien distribuidos incluso con muchos sectores
        const goldenAngle = 137.508;
        const hue = Math.round((i * goldenAngle) % 360);
        return `hsl(${hue} 70% 50%)`;
    }

    // --- Geometría SVG ---
    function polar(cx: number, cy: number, r: number, angDeg: number): [number, number] {
        const rad = toRad(angDeg);
        return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
    }
    function sectorPath(innerR: number, outerR: number, a0: number, a1: number): string {
        // path para un anillo sectorial (entre innerR y outerR)
        const [x0i, y0i] = polar(cx, cy, innerR, a0);
        const [x0o, y0o] = polar(cx, cy, outerR, a0);
        const [x1o, y1o] = polar(cx, cy, outerR, a1);
        const [x1i, y1i] = polar(cx, cy, innerR, a1);
        const large = a1 - a0 > 180 ? 1 : 0;
        return `M ${x0i} ${y0i}
            L ${x0o} ${y0o}
            A ${outerR} ${outerR} 0 ${large} 1 ${x1o} ${y1o}
            L ${x1i} ${y1i}
            A ${innerR} ${innerR} 0 ${large} 0 ${x0i} ${y0i}
            Z`;
    }

    // --- Interacción (clic en rueda) ---
    function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
        const pt = getSvgPoint(e);
        const dx = pt.x - cx;
        const dy = pt.y - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > radius) return; // fuera de la rueda

        const angle = toDeg(Math.atan2(dy, dx)); // -180..180, 0° derecha
        const ang = normDeg(angle);            // 0..360

        const sector = sectorsWithAngles.find((s) => inSector(ang, s));
        if (!sector) return;

        const level = clamp(Math.ceil(dist / ringThickness), 0, RING_COUNT);
        setScoresByDate((prev) => ({
            ...prev,
            [dateStr]: { ...prev[dateStr], [sector.id]: level },
        }));
    }

    function handleSvgMove(e: React.MouseEvent<SVGSVGElement>) {
        const pt = getSvgPoint(e);
        const dx = pt.x - cx;
        const dy = pt.y - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > radius) {
            setHoverInfo(null);
            return;
        }
        const angle = toDeg(Math.atan2(dy, dx));
        const ang = normDeg(angle);
        const sector = sectorsWithAngles.find((s) => inSector(ang, s));
        if (!sector) {
            setHoverInfo(null);
            return;
        }
        const level = clamp(Math.ceil(dist / ringThickness), 0, RING_COUNT);
        setHoverInfo({ sectorId: sector.id, level });
    }

    function getSvgPoint(evt: React.MouseEvent<SVGSVGElement>): DOMPoint {
        const svg = evt.currentTarget;
        const pt = svg.createSVGPoint();
        pt.x = evt.clientX;
        pt.y = evt.clientY;
        const screenCTM = svg.getScreenCTM();
        if (!screenCTM) {
            throw new Error("Failed to get screen CTM");
        }
        const inv = screenCTM.inverse();
        const loc = pt.matrixTransform(inv);
        return loc;
    }

    // --- UI Ops ---
    function addSector() {
        const name = newName.trim() || `Sector ${sectors.length + 1}`;
        const color = hslFor(sectors.length);
        setSectors((prev) => [...prev, { id: genId(), name, color }]);
        setNewName("");
    }
    function removeSector(id: string): void {
        setSectors((prev) => prev.filter((s) => s.id !== id));
        setScoresByDate((prev) => {
            const copy = { ...prev };
            for (const d of Object.keys(copy)) {
                const day = { ...copy[d] };
                delete day[id];
                copy[d] = day;
            }
            return copy;
        });
    }
    function moveSector(id: string, dir: number): void {
        setSectors((prev) => {
            const i = prev.findIndex((s) => s.id === id);
            const j = i + dir;
            if (i < 0 || j < 0 || j >= prev.length) return prev;
            const arr = [...prev];
            const [it] = arr.splice(i, 1);
            arr.splice(j, 0, it);
            return arr;
        });
    }
    function setScore(id: string, val: string | number): void {
        const level = clamp(Number(val) || 0, 0, RING_COUNT);
        setScoresByDate((prev) => ({ ...prev, [dateStr]: { ...prev[dateStr], [id]: level } }));
    }
    function resetDay() {
        setScoresByDate((prev) => ({ ...prev, [dateStr]: {} }));
    }

    function exportJSON() {
        const blob = new Blob(
            [
                JSON.stringify(
                    { config: sectors, scoresByDate },
                    null,
                    2
                ),
            ],
            { type: "application/json" }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `rueda-desempeno-${dateStr}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    function importJSON(evt: React.ChangeEvent<HTMLInputElement>): void {
        const file = evt.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(String(reader.result));
                if (data.config && Array.isArray(data.config)) setSectors(data.config);
                if (data.scoresByDate && typeof data.scoresByDate === "object") setScoresByDate(data.scoresByDate);
            } catch (error) {
                alert("Archivo JSON no válido");
                console.error("Error al importar JSON:", error);
            }
        };
        reader.readAsText(file);
        // reset input
        evt.target.value = "";
    }

    // --- Render auxiliares ---
    function renderGrid() {
        // círculos concéntricos + divisiones de sector
        const rings = Array.from({ length: RING_COUNT }, (_, i) => (
            <circle
                key={`r-${i + 1}`}
                cx={cx}
                cy={cy}
                r={(i + 1) * ringThickness}
                fill="none"
                stroke={theme.svgGrid}
                strokeDasharray="4 4"
            />
        ));
        const sectorLines = sectorsWithAngles.map((s) => {
            // Las líneas del sector comienzan desde el centro
            const [x1, y1] = polar(cx, cy, radius, s.a0);
            return (
                <line key={`l-${s.id}`} x1={cx} y1={cy} x2={x1} y2={y1} stroke={theme.svgGrid} />
            );
        });
        return (
            <g>
                {rings}
                {sectorLines}
            </g>
        );
    }

    function renderFilledSectors() {
        return sectorsWithAngles.map((s) => {
            const val = clamp(scores[s.id] ?? 0, 0, RING_COUNT);
            if (val <= 0) return null;
            const path = sectorPath(0, val * ringThickness, s.a0, s.a1);
            return (
                <path key={`v-${s.id}`} d={path} fill={s.color} opacity={0.6} stroke={s.color} strokeOpacity={0.9} />
            );
        });
    }

    function renderSectorHover() {
        if (!hoverInfo) return null;
        const s = sectorsWithAngles.find((x) => x.id === hoverInfo.sectorId);
        if (!s) return null;
        const r = hoverInfo.level * ringThickness;
        const p = sectorPath(0, r, s.a0, s.a1);
        return <path d={p} fill={s.color} opacity={0.2} pointerEvents="none" />;
    }

    function renderLabelsFixed() {
        return sectorsWithAngles.map((s) => {
            const [tx, ty] = polar(cx, cy, radius + 24, s.mid);
            const cosv = Math.cos(toRad(s.mid));
            const anchor = cosv > 0.25 ? "start" : cosv < -0.25 ? "end" : "middle";
            return (
                <g key={`lab-${s.id}`}>
                    <text x={tx} y={ty} fontSize={12} textAnchor={anchor} dominantBaseline="middle" fill={theme.svgText}>
                        {s.name}
                    </text>
                </g>
            );
        });
    }

    function renderRingNumbers() {
        // Números 1..10 escalados según su posición, solo visibles en pantallas grandes y con 10 o menos sectores
        if (sectors.length > 10) return null;
        
        return Array.from({ length: RING_COUNT }, (_, i) => {
            const level = i + 1;
            // Posicionar en el centro del anillo, no en el borde
            const r = (level - 0.5) * ringThickness;
            const [tx, ty] = polar(cx, cy, r, 0); // 0° = derecha
            // Escalar el tamaño del texto según el nivel (de 6px a 14px)
            const fontSize = 6 + (level / RING_COUNT) * 8;
            return (
                <text 
                    key={`n-${i}`} 
                    x={tx} 
                    y={ty} 
                    fontSize={fontSize} 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    fill={theme.svgText}
                    opacity={0.6}
                    className="hidden md:block"
                >
                    {level}
                </text>
            );
        });
    }

    const total = sectors.reduce((acc, s) => acc + (scores[s.id] || 0), 0);
    const avg = sectors.length ? (total / sectors.length).toFixed(2) : "0.00";

    // Colores según tema
    const theme = {
        bg: darkMode ? "bg-neutral-600" : "bg-neutral-300",
        card: darkMode ? "bg-neutral-800/90" : "bg-white/90",
        cardSolid: darkMode ? "bg-neutral-800" : "bg-white",
        text: darkMode ? "text-neutral-100" : "text-neutral-900",
        textMuted: darkMode ? "text-neutral-400" : "text-neutral-600",
        textLight: darkMode ? "text-neutral-500" : "text-neutral-500",
        border: darkMode ? "border-neutral-600" : "border-neutral-300",
        borderLight: darkMode ? "border-neutral-600" : "border-neutral-200",
        input: darkMode ? "bg-neutral-700 border-neutral-600 text-neutral-100" : "bg-white border-neutral-300 text-neutral-900",
        inputAlt: darkMode ? "bg-neutral-700 border-neutral-600 text-neutral-100" : "bg-neutral-50 border-neutral-200 text-neutral-900",
        button: darkMode ? "bg-neutral-600 hover:bg-neutral-800" : "bg-neutral-100 hover:bg-neutral-200",
        buttonPrimary: darkMode ? "bg-neutral-400 text-neutral-900 hover:bg-neutral-200" : "bg-neutral-100 text-black hover:bg-neutral-200",
        svgBg: darkMode ? "hsl(0 0% 15%)" : "white",
        svgGrid: darkMode ? "hsl(0 0% 35% / 0.5)" : "hsl(0 0% 85% / 0.6)",
        svgText: darkMode ? "hsl(0 0% 80%)" : "hsl(0 0% 20%)",
        svgCenter: darkMode ? "hsl(0 0% 20%)" : "white",
        svgCenterBorder: darkMode ? "hsl(0 0% 40%)" : "hsl(0 0% 80%)",
        overlay: darkMode ? "bg-black/60" : "bg-black/40",
    };

    return (
        <div className={`fixed inset-0 ${theme.bg} ${theme.text} overflow-hidden`} style={{ margin: 0, padding: 0 }}>
            {/* Botón para abrir drawer */}
            <button
                onClick={() => setDrawerOpen(true)}
                className={`fixed top-4 right-4 z-40 rounded-lg ${theme.buttonPrimary} p-3 shadow-lg transition-colors`}
                title="Configuración"
            >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>

            {/* Información flotante arriba a la izquierda */}
            <div className="fixed top-4 left-4 z-40 flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-[calc(100%-120px)] sm:max-w-none">
                {/* Card de promedio */}
                <div className={`rounded-xl sm:rounded-2xl ${theme.card} backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 shadow-lg`}>
                    <div className={`text-xs sm:text-sm ${theme.textMuted} mb-1 sm:mb-2`}>
                        {hoverInfo ? (
                            <HoverText sectors={sectors} hoverInfo={hoverInfo} darkMode={darkMode} />
                        ) : (
                            <span>Media del día: <b className={`text-base sm:text-lg ${theme.text}`}>{avg}</b></span>
                        )}
                    </div>
                    <div className={`text-[10px] sm:text-xs ${theme.textLight}`}>Click para puntuar</div>
                </div>

                {/* Card de fecha */}
                <div className={`rounded-xl sm:rounded-2xl ${theme.card} backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 shadow-lg`}>
                    <input
                        type="date"
                        value={dateStr}
                        onChange={(e) => setDateStr(e.target.value)}
                        className={`text-xs sm:text-sm border-0 bg-transparent p-0 cursor-pointer focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-neutral-100' : 'focus:ring-neutral-900'} rounded ${theme.text} mb-2 sm:mb-3`}
                        style={{ fontFamily: 'inherit', colorScheme: darkMode ? 'dark' : 'light' }}
                    />
                    <div className={`text-[10px] sm:text-xs ${theme.textLight}`}>Día seleccionado</div>
                </div>
            </div>

            {/* Rueda principal - ocupa todo el viewport */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ padding: '80px 20px 20px 20px' }}>
                <div className="w-full h-full max-h-full flex items-center justify-center">
                    <svg
                        width="100%"
                        height="100%"
                        viewBox={`0 0 ${SIZE} ${SIZE}`}
                        onClick={handleSvgClick}
                        onMouseMove={handleSvgMove}
                        onMouseLeave={() => setHoverInfo(null)}
                        className="select-none touch-none drop-shadow-2xl"
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                        preserveAspectRatio="xMidYMid meet"
                    >
                        {/* fondo */}
                        <circle cx={cx} cy={cy} r={radius} fill={theme.svgBg} />

                        {/* sectores rellenados (valores) */}
                        {renderFilledSectors()}

                        {/* rejilla */}
                        {renderGrid()}

                        {/* labels */}
                        {renderLabelsFixed()}

                        {/* números de anillos */}
                        {renderRingNumbers()}

                        {/* hover visual */}
                        {renderSectorHover()}

                        {/* círculo central */}
                        <circle cx={cx} cy={cy} r={ringThickness * 0.6} fill={theme.svgCenter} stroke={theme.svgCenterBorder} />
                    </svg>
                </div>
            </div>

            <div className="fixed bottom-0 p-2">
                <p className="text-xs text-center">
                    Todos tus datos son almacenados localmente, de forma 100% privada y no se usan para nada.
                </p>
            </div>

            {/* Overlay del drawer */}
            {drawerOpen && (
                <div
                    className={`fixed inset-0 ${theme.overlay} z-40 transition-opacity`}
                    onClick={() => setDrawerOpen(false)}
                />
            )}

            {/* Drawer lateral */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-lg ${theme.cardSolid} shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto`}
                style={{
                    transform: drawerOpen ? "translateX(0)" : "translateX(100%)"
                }}
            >
                <div className="p-6">
                    {/* Header del drawer */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className={`text-2xl font-bold ${theme.text}`}>Configuración</h2>
                        <button
                            onClick={() => setDrawerOpen(false)}
                            className={`rounded-full p-2 ${theme.buttonPrimary} transition-colors`}
                        >
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* Controles de acciones */}
                    <div className="mb-6 space-y-3">
                        <div className="flex gap-2">
                            <button onClick={resetDay} className={`flex-1 rounded-lg border ${theme.border} ${theme.button} px-3 py-2 text-sm transition-colors`}>
                                Resetear día
                            </button>
                            <button onClick={exportJSON} className={`flex-1 rounded-lg border ${theme.border} ${theme.button} px-3 py-2 text-sm transition-colors`}>
                                Exportar JSON
                            </button>
                        </div>

                        <label className={`block w-full rounded-lg border ${theme.border} ${theme.button} px-3 py-2 text-sm cursor-pointer text-center transition-colors`}>
                            Importar JSON
                            <input type="file" accept="application/json" className="hidden" onChange={importJSON} />
                        </label>
                    </div>

                    <hr className={`my-6 ${theme.borderLight} border-t`} />

                    {/* Gestión de sectores */}
                    <div>
                        <h3 className={`text-lg font-semibold mb-3 ${theme.text}`}>Sectores</h3>
                        <div className="mb-4 flex gap-2">
                            <input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Nombre del sector"
                                className={`flex-1 rounded-lg border ${theme.input} px-3 py-2 text-sm focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-neutral-100' : 'focus:ring-neutral-900'}`}
                                onKeyPress={(e) => e.key === 'Enter' && addSector()}
                            />
                            <button onClick={addSector} className={`rounded-lg ${theme.buttonPrimary} px-4 py-2 text-sm transition-colors`}>
                                Añadir
                            </button>
                        </div>

                        <ul className="flex flex-col gap-3">
                            {sectors.map((s, i) => (
                                <li key={s.id} className={`rounded-xl border ${theme.border} p-3 sm:p-4 ${theme.inputAlt}`}>
                                    <div className="flex items-center gap-2 mb-3 flex-wrap sm:flex-nowrap">
                                        <input
                                            type="color"
                                            value={rgbToHex(s.color)}
                                            onChange={(e) =>
                                                setSectors((prev) => prev.map((x) => (x.id === s.id ? { ...x, color: e.target.value } : x)))
                                            }
                                            title="Color"
                                            className={`h-5 w-5 sm:h-7 sm:w-7 cursor-pointer rounded-sm border ${ darkMode ? 'border-black' : 'border-white'} flex-shrink-0`}
                                        />
                                        <input
                                            value={s.name}
                                            onChange={(e) =>
                                                setSectors((prev) => prev.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)))
                                            }
                                            className={`flex-1 min-w-0 rounded-lg border ${theme.input} px-2 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-neutral-100' : 'focus:ring-neutral-900'}`}
                                        />
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => moveSector(s.id, -1)}
                                                className={`rounded-md border ${theme.border} ${theme.button} px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs transition-colors flex-shrink-0`}
                                                disabled={i === 0}
                                                title="Subir"
                                            >
                                                ▲
                                            </button>
                                            <button
                                                onClick={() => moveSector(s.id, +1)}
                                                className={`rounded-md border ${theme.border} ${theme.button} px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs transition-colors flex-shrink-0`}
                                                disabled={i === sectors.length - 1}
                                                title="Bajar"
                                            >
                                                ▼
                                            </button>
                                            <button
                                                onClick={() => removeSector(s.id)}
                                                className={`rounded-md border ${theme.border} ${theme.button} px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs transition-colors flex-shrink-0`}
                                                title="Eliminar"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1 sm:gap-2">
                                            <span className={`text-xs ${theme.textMuted} w-16 sm:w-20 flex-shrink-0`}>Puntuación:</span>
                                            <input
                                                type="range"
                                                min={0}
                                                max={RING_COUNT}
                                                value={scores[s.id] ?? 0}
                                                onChange={(e) => setScore(s.id, e.target.value)}
                                                className="flex-1 min-w-0"
                                            />
                                            <input
                                                type="number"
                                                min={0}
                                                max={RING_COUNT}
                                                value={scores[s.id] ?? 0}
                                                onChange={(e) => setScore(s.id, e.target.value)}
                                                className={`w-12 sm:w-16 rounded-md border ${theme.input} px-1 sm:px-2 py-1 text-xs sm:text-sm text-center focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-neutral-100' : 'focus:ring-neutral-900'} flex-shrink-0`}
                                            />
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <hr className={`my-6 ${theme.borderLight} border-t`} />

                    {/* Toggle de tema */}
                    <div className={`mb-6 p-4 rounded-xl ${theme.inputAlt} ${theme.border} border`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className={`text-sm font-medium ${theme.text}`}>Tema</div>
                                <div className={`text-xs ${theme.textLight}`}>
                                    {darkMode ? "Modo oscuro activado" : "Modo claro activado"}
                                </div>
                            </div>
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className={`padding-esp relative inline-flex h-8 w-14 items-center justify-start rounded-full transition-colors ${darkMode ? "bg-neutral-600" : "bg-neutral-300"
                                    }`}
                            >
                                <span
                                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${darkMode ? "translate-x-6" : "translate-x-0"
                                        }`}
                                >
                                    {darkMode ? (
                                        <svg className="h-6 w-6 p-1 text-neutral-900" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                        </svg>
                                    ) : (
                                        <svg className="h-6 w-6 p-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface HoverTextProps {
    sectors: Sector[];
    hoverInfo: HoverInfo;
    darkMode: boolean;
}

function HoverText({ sectors, hoverInfo, darkMode }: HoverTextProps) {
    const s = sectors.find((x: Sector) => x.id === hoverInfo.sectorId);
    if (!s) return null;
    return (
        <span>
            {s.name}: <b className={`text-base sm:text-lg ${darkMode ? 'text-neutral-100' : 'text-neutral-900'}`}>{hoverInfo.level}</b>
        </span>
    );
}

// --- utilidades de color ---
function rgbToHex(input: string): string {
    // admite hsl() o #hex y normaliza a hex para el input color
    if (!input) return "#888888";
    if (input.startsWith("#")) return input;
    // hsl(h s% l%) -> convertir a hex aproximado
    const match = input.match(/hsl\((\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\)/i);
    if (!match) return "#888888";
    const h = parseFloat(match[1]);
    const s = parseFloat(match[2]) / 100;
    const l = parseFloat(match[3]) / 100;
    const [r, g, b] = hslToRgb(h / 360, s, l);
    const toHex = (v: number): string => v.toString(16).padStart(2, "0");
    return `#${toHex(Math.round(r * 255))}${toHex(Math.round(g * 255))}${toHex(Math.round(b * 255))}`;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    let r: number, g: number, b: number;
    if (s === 0) {
        r = g = b = l; // achromático
    } else {
        const hue2rgb = (p: number, q: number, t: number): number => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [r, g, b];
}