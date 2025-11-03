import { useEffect, useMemo, useRef, useState } from "react";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// === Mental Performance Wheel (single-file React component) ===
// - Añade/Quita sectores (aspectos de vida)
// - Puntúa de 0 a 10 cada sector haciendo clic en la rueda o con slider
// - Guarda automáticamente por día en localStorage
// - Exporta/Importa JSON
// - Modal de estadísticas y gráficos
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

interface InfoMenuContextual {
    idSector: string;
    x: number;
    y: number;
}

interface CommentsByDate {
    [date: string]: { [sectorId: string]: string }; // un comentario por sector y día
}

type StatsVisibility = {
    enabled: boolean;                 // Master: si es false, no hay botón ni modal
    showDailyAverage: boolean;        // 📈 Evolución de la Media Diaria
    showSectorProgress: boolean;      // 📊 Progresión por Sector
    showLast7AllSectors: boolean;     // 📅 Últimos 7 días - Todos los sectores
    showComparison: boolean;          // 📊 Comparación: Actual vs Promedio
    showWeeklyTrend: boolean;         // 📅 Promedio por día de la semana
    showHeatMap: boolean;             // 🔥 Heatmap
    showInsights: boolean;            // 💡 Insights
};

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

    // Estado nuevo (junto al resto de useState)
    const [commentsByDate, setCommentsByDate] = useState<CommentsByDate>(() => loadComments());
    const commentTextRef = useRef<HTMLTextAreaElement>(null);


    // --- Nuevo estado y referencias para menú contextual ---
    const [infoMenuContextual, setInfoMenuContextual] = useState<InfoMenuContextual | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);               // Referencia al SVG principal
    const selectorColorRef = useRef<HTMLInputElement>(null);   // Referencia a input color oculto
    const temporizadorLongPress = useRef<number | null>(null); // Temporizador para detección de pulsación prolongada
    const refLongPressActivado = useRef<boolean>(false);       // Marca si se activó menú contextual por long-press

    // UI state
    const [newName, setNewName] = useState<string>("");
    const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [statsOpen, setStatsOpen] = useState<boolean>(false);
    const [selectedSectorId, setSelectedSectorId] = useState<string>("");
    const [darkMode, setDarkMode] = useState<boolean>(() => {
        try {
            const saved = localStorage.getItem("mental-wheel-dark-mode");
            return saved ? JSON.parse(saved) : false;
        } catch {
            return false;
        }
    });

    // Estado para zoom y pan del SVG
    const [scale, setScale] = useState<number>(1);
    const [translateX, setTranslateX] = useState<number>(0);
    const [translateY, setTranslateY] = useState<number>(0);
    const [isPanning, setIsPanning] = useState<boolean>(false);
    const [startPan, setStartPan] = useState<{ x: number; y: number } | null>(null);
    const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
    const [hasPanned, setHasPanned] = useState<boolean>(false);
    const [visibleSectors, setVisibleSectors] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        sectors.forEach(s => initial[s.id] = true);
        return initial;
    });

    const STATS_VIS_KEY = "mental-wheel-stats-visibility-v1";

    // Actualizar visibleSectors cuando cambien los sectores
    useEffect(() => {
        setVisibleSectors(prev => {
            const updated: Record<string, boolean> = {};
            sectors.forEach(s => {
                updated[s.id] = prev[s.id] !== undefined ? prev[s.id] : true;
            });
            return updated;
        });
    }, [sectors]);


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

    // Establecer el primer sector como seleccionado por defecto
    useEffect(() => {
        if (!selectedSectorId && sectors.length > 0) {
            setSelectedSectorId(sectors[0].id);
        }
    }, [sectors, selectedSectorId]);

    //Establecer la posición del menú contextual
    useEffect(() => {
        if (!infoMenuContextual || !menuRef.current) return;

        const PADDING = 8; // margen de seguridad
        const rect = menuRef.current.getBoundingClientRect();

        let left = infoMenuContextual.x;
        let top = infoMenuContextual.y;

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Si se sale por la derecha, muévelo a la izquierda del click
        if (left + rect.width + PADDING > vw) {
            left = Math.max(PADDING, vw - rect.width - PADDING);
        }
        // Si se sale por abajo, súbelo por encima
        if (top + rect.height + PADDING > vh) {
            top = Math.max(PADDING, vh - rect.height - PADDING);
        }
        // Si se sale por la izquierda/arriba, empuja dentro
        if (left < PADDING) left = PADDING;
        if (top < PADDING) top = PADDING;

        if (left !== infoMenuContextual.x || top !== infoMenuContextual.y) {
            setInfoMenuContextual({ ...infoMenuContextual, x: left, y: top });
        }
    }, [infoMenuContextual]);


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

    // --- Cálculos de estadísticas ---
    const statsData = useMemo(() => {
        const allDates = Object.keys(scoresByDate).sort();

        // Encontrar la primera fecha con datos reales (al menos un valor > 0)
        const firstDateWithData = allDates.find(date => {
            const dayScores = scoresByDate[date];
            const values = Object.values(dayScores);
            return values.some(score => score > 0);
        });

        // Filtrar fechas: solo desde la primera fecha con datos en adelante
        const dates = firstDateWithData
            ? allDates.filter(date => date >= firstDateWithData)
            : [];

        // Media diaria
        const dailyAverage = dates.map(date => {
            const dayScores = scoresByDate[date];
            const values = Object.values(dayScores);
            const avg = values.length > 0
                ? values.reduce((a, b) => a + b, 0) / values.length
                : 0;
            return {
                date: date,
                media: parseFloat(avg.toFixed(2)),
                displayDate: new Date(date).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short'
                })
            };
        });

        // Progresión por sector
        const sectorProgress = (sectorId: string) => {
            return dates.map(date => {
                const score = scoresByDate[date][sectorId] || 0;
                return {
                    date: date,
                    puntuacion: score,
                    displayDate: new Date(date).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short'
                    })
                };
            });
        };

        // Comparación de sectores (última vs promedio histórico)
        const sectorComparison = sectors.map(sector => {
            const allScores = dates.map(date => scoresByDate[date][sector.id] || 0);
            const avg = allScores.length > 0
                ? allScores.reduce((a, b) => a + b, 0) / allScores.length
                : 0;
            const current = scores[sector.id] || 0;
            return {
                sector: sector.name,
                actual: current,
                promedio: parseFloat(avg.toFixed(2)),
                color: sector.color
            };
        });

        // Sectores de HOY (independiente del día seleccionado)
        const todayScores = scoresByDate[todayStr] || {};
        const todaySectorScores = sectors.map(sector => ({
            sector: sector.name,
            score: todayScores[sector.id] || 0
        }));

        // Sectores históricos (promedio de todos los días)
        const historicalSectorScores = sectors.map(sector => {
            const allScores = dates.map(date => scoresByDate[date][sector.id] || 0).filter(s => s > 0);
            const avg = allScores.length > 0
                ? allScores.reduce((a, b) => a + b, 0) / allScores.length
                : 0;
            return {
                sector: sector.name,
                score: parseFloat(avg.toFixed(2))
            };
        });

        // Tendencia semanal
        const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const weeklyData = weekDays.map((day, index) => {
            const daysData = dates.filter(date => new Date(date).getDay() === index);
            const scores = daysData.flatMap(date => Object.values(scoresByDate[date]));
            const avg = scores.length > 0
                ? scores.reduce((a, b) => a + b, 0) / scores.length
                : 0;
            return {
                dia: day,
                media: parseFloat(avg.toFixed(2))
            };
        });

        // Heat map data (últimos 60 días)
        const heatMapData = dates.slice(-60).map(date => {
            const dayScores = scoresByDate[date];
            const values = Object.values(dayScores);
            const avg = values.length > 0
                ? values.reduce((a, b) => a + b, 0) / values.length
                : 0;
            const dayOfWeek = new Date(date).getDay();
            const weekNumber = Math.floor(dates.slice(-60).indexOf(date) / 7);
            return {
                date: date,
                displayDate: new Date(date).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit'
                }),
                value: parseFloat(avg.toFixed(2)),
                day: dayOfWeek,
                week: weekNumber,
                hasData: values.length > 0
            };
        });

        // Mejor día histórico (día específico con mayor puntuación)
        const bestHistoricalDay = dailyAverage.length > 0
            ? dailyAverage.reduce((prev, current) =>
                current.media > prev.media ? current : prev
            )
            : null;

        // Últimos 7 días - todos los sectores (para gráfico de evolución multi-línea)
        const last7DaysAllSectors = () => {
            if (dates.length < 7) return null; // No mostrar si no hay 7 días

            const last7Dates = dates.slice(-7);
            const todayStr = formatDateInput(new Date());

            return last7Dates.map((date) => {
                const isToday = date === todayStr;
                const dataPoint: any = {
                    date: date,
                    displayDate: isToday ? 'Hoy' : new Date(date).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short'
                    }),
                    isToday: isToday
                };

                // Agregar la puntuación de cada sector
                sectors.forEach(sector => {
                    dataPoint[sector.name] = scoresByDate[date][sector.id] || 0;
                });

                return dataPoint;
            });
        };

        return {
            todaySectorScores,
            historicalSectorScores,
            dailyAverage,
            sectorProgress,
            sectorComparison,
            weeklyData,
            heatMapData,
            bestHistoricalDay,
            last7DaysAllSectors: last7DaysAllSectors(),
            totalDays: dates.length,
            currentStreak: calculateStreak(dates)
        };
    }, [scoresByDate, sectors, scores]);

    // Calcular racha de días consecutivos con datos
    function calculateStreak(sortedDates: string[]): number {
        if (sortedDates.length === 0) return 0;

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = sortedDates.length - 1; i >= 0; i--) {
            const date = new Date(sortedDates[i]);
            date.setHours(0, 0, 0, 0);

            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() - streak);

            if (date.getTime() === expectedDate.getTime()) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

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

    function genId() {
        return Math.random().toString(36).slice(2, 10);
    }
    function hslFor(i: number): string {
        const goldenAngle = 137.508;
        const hue = Math.round((i * goldenAngle) % 360);
        return `hsl(${hue} 70% 50%)`;
    }

    function loadComments(): CommentsByDate {
        try {
            const raw = localStorage.getItem("mental-wheel-comments-v1");
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }

    function saveComments(data: CommentsByDate): void {
        try {
            localStorage.setItem("mental-wheel-comments-v1", JSON.stringify(data));
        } catch (error) {
            console.error("Error al guardar comentarios:", error);
        }
    }

    useEffect(() => saveComments(commentsByDate), [commentsByDate]);

    function getComment(date: string, sectorId: string): string {
        return commentsByDate[date]?.[sectorId] ?? "";
    }

    function setComment(date: string, sectorId: string, text: string) {
        setCommentsByDate(prev => ({
            ...prev,
            [date]: { ...(prev[date] ?? {}), [sectorId]: text }
        }));
    }

    function deleteComment(date: string, sectorId: string) {
        setCommentsByDate(prev => {
            const day = { ...(prev[date] ?? {}) };
            delete day[sectorId];
            const copy = { ...prev };
            if (Object.keys(day).length === 0) {
                delete copy[date];
            } else {
                copy[date] = day;
            }
            return copy;
        });
    }

    // --- Geometría SVG ---
    function polar(cx: number, cy: number, r: number, angDeg: number): [number, number] {
        const rad = toRad(angDeg);
        return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
    }
    function sectorPath(innerR: number, outerR: number, a0: number, a1: number): string {
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

    // --- Nuevo manejador para clic derecho (menú contextual) ---
    function handleSvgContextMenu(e: React.MouseEvent<SVGSVGElement>) {
        e.preventDefault(); // prevenir menú contextual por defecto del navegador
        if (hasPanned) {
            setHasPanned(false);
            return;
        }
        const pt = svgRef.current?.createSVGPoint();
        if (!pt || !svgRef.current) return;
        pt.x = e.clientX;
        pt.y = e.clientY;
        const screenCTM = svgRef.current.getScreenCTM();
        if (!screenCTM) return;
        const loc = pt.matrixTransform(screenCTM.inverse());
        // Transformar a coordenadas del SVG (considerando zoom/pan):
        const svgX = (loc.x - SIZE / 2 - translateX) / scale + SIZE / 2;
        const svgY = (loc.y - SIZE / 2 - translateY) / scale + SIZE / 2;
        const dx = svgX - cx, dy = svgY - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > radius) return; // fuera de la rueda
        const angle = toDeg(Math.atan2(dy, dx));
        const ang = normDeg(angle);
        const sector = sectorsWithAngles.find(s => inSector(ang, s));
        if (!sector) return;
        // Abrir menú contextual en posición del puntero para el sector encontrado
        setInfoMenuContextual({ idSector: sector.id, x: e.clientX, y: e.clientY });
    }

    // --- Interacción (clic en rueda) ---
    function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
        if (hasPanned || refLongPressActivado.current) {
            setHasPanned(false);
            refLongPressActivado.current = false;
            return;
        }
        const pt = getSvgPoint(e);
        const dx = pt.x - cx;
        const dy = pt.y - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > radius) return;

        const angle = toDeg(Math.atan2(dy, dx));
        const ang = normDeg(angle);

        const sector = sectorsWithAngles.find((s) => inSector(ang, s));
        if (!sector) return;

        const level = clamp(Math.ceil(dist / ringThickness), 0, RING_COUNT);
        setScoresByDate((prev) => ({
            ...prev,
            [dateStr]: { ...prev[dateStr], [sector.id]: level },
        }));
    }

    function handleSvgMove(e: React.MouseEvent<SVGSVGElement>) {
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

        const transformedX = (loc.x - SIZE / 2 - translateX) / scale + SIZE / 2;
        const transformedY = (loc.y - SIZE / 2 - translateY) / scale + SIZE / 2;

        loc.x = transformedX;
        loc.y = transformedY;
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
        evt.target.value = "";
    }

    function loadStatsVisibility(): StatsVisibility {
        try {
            const raw = localStorage.getItem(STATS_VIS_KEY);
            if (raw) return JSON.parse(raw);
        } catch { }
        return {
            enabled: true,
            showDailyAverage: true,
            showSectorProgress: true,
            showLast7AllSectors: true,
            showComparison: true,
            showWeeklyTrend: true,
            showHeatMap: true,
            showInsights: true,
        };
    }

    const [statsVisibility, setStatsVisibility] = useState<StatsVisibility>(() => loadStatsVisibility());

    // Guardar cambios
    useEffect(() => {
        try {
            localStorage.setItem(STATS_VIS_KEY, JSON.stringify(statsVisibility));
        } catch { }
    }, [statsVisibility]);

    // Si desactivo todo, cierro el modal si está abierto
    useEffect(() => {
        if (!statsVisibility.enabled && statsOpen) setStatsOpen(false);
    }, [statsVisibility.enabled, statsOpen]);

    // --- Render auxiliares ---
    function renderGrid() {
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

            // ¿tiene comentario el día seleccionado?
            const hasComment = !!getComment(dateStr, s.id);

            return (
                <g key={`lab-${s.id}`}>
                    <text x={tx} y={ty} fontSize={12} textAnchor={anchor} dominantBaseline="middle" fill={theme.svgText}>
                        {s.name}
                    </text>

                    {hasComment && (
                        // pequeña “chincheta” al lado de la etiqueta
                        <text
                            x={tx + (anchor === "start" ? 10 : anchor === "end" ? -10 : 0)}
                            y={ty - 10}
                            fontSize={12}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={theme.svgText}
                            aria-label="Tiene comentario"
                            style={{ cursor: "help" }} // opcional, para mostrar el puntero de ayuda
                        >
                            <title>Tiene un comentario</title>
                            📌
                        </text>
                    )}

                </g>
            );
        });
    }

    function renderRingNumbers() {
        if (sectors.length > 10) return null;

        return Array.from({ length: RING_COUNT }, (_, i) => {
            const level = i + 1;
            const r = (level - 0.5) * ringThickness;
            const [tx, ty] = polar(cx, cy, r, 0);
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

    // === Funciones de zoom y pan ===
    const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale((prev) => clamp(prev * delta, 0.5, 5));
    };

    // const getTouchDistance = (touch1: React.Touch, touch2: React.Touch): number => {
    //     const dx = touch1.clientX - touch2.clientX;
    //     const dy = touch1.clientY - touch2.clientY;
    //     return Math.sqrt(dx * dx + dy * dy);
    // };

    // --- Modificar manejadores táctiles para detección de pulsación prolongada ---
    const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
        if (e.touches.length === 2) {
            // ... [lógica existente de zoom] ...
        } else if (e.touches.length === 1) {
            // Iniciar temporizador de pulsación prolongada (long press)
            const { clientX, clientY } = e.touches[0];
            temporizadorLongPress.current = window.setTimeout(() => {
                if (!hasPanned && svgRef.current) {  // solo abrir si no hubo desplazamiento
                    // Calcular sector bajo el dedo al momento del long press
                    const pt = svgRef.current.createSVGPoint();
                    pt.x = clientX; pt.y = clientY;
                    const screenCTM = svgRef.current.getScreenCTM();
                    if (!screenCTM) return;
                    const loc = pt.matrixTransform(screenCTM.inverse());
                    const svgX = (loc.x - SIZE / 2 - translateX) / scale + SIZE / 2;
                    const svgY = (loc.y - SIZE / 2 - translateY) / scale + SIZE / 2;
                    const dx = svgX - cx, dy = svgY - cy;
                    const dist = Math.hypot(dx, dy);
                    if (dist <= radius) {  // dentro de la rueda
                        const angle = toDeg(Math.atan2(dy, dx));
                        const ang = normDeg(angle);
                        const sector = sectorsWithAngles.find(s => inSector(ang, s));
                        if (sector) {
                            // Abrir menú contextual para sector (pulsación prolongada)
                            setInfoMenuContextual({ idSector: sector.id, x: clientX, y: clientY });
                            refLongPressActivado.current = true;   // marcar que ya se abrió menú contextual
                            setIsPanning(false);                   // cancelar modo arrastre
                            setStartPan(null);
                        }
                    }
                }
            }, 600); // ~0.6s para activar menú contextual
            // Continuar con lógica existente de inicio de pan (por si es un desplazamiento breve)
            setIsPanning(true);
            setHasPanned(false);
            setStartPan({ x: clientX, y: clientY });
        }
    };

    const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
        if (e.touches.length === 2 && lastTouchDistance !== null) {
            // ... [lógica existente de zoom táctil] ...
        } else if (e.touches.length === 1 && isPanning && startPan) {
            const dx = e.touches[0].clientX - startPan.x;
            const dy = e.touches[0].clientY - startPan.y;
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                setHasPanned(true);
                // Cancelar temporizador de long press si el usuario comenzó a arrastrar
                if (temporizadorLongPress.current) {
                    clearTimeout(temporizadorLongPress.current);
                    temporizadorLongPress.current = null;
                }
            }
            // ... [continuar lógica existente de pan] ...
            setTranslateX(prev => prev + dx);
            setTranslateY(prev => prev + dy);
            setStartPan({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        }
    };

    const handleTouchEnd = () => {
        // Limpiar temporizador de long press si el usuario soltó antes de tiempo
        if (temporizadorLongPress.current) {
            clearTimeout(temporizadorLongPress.current);
            temporizadorLongPress.current = null;
        }
        setLastTouchDistance(null);
        setIsPanning(false);
        setStartPan(null);
    };

    const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
        if (e.button === 0) {
            setIsPanning(true);
            setHasPanned(false);
            setStartPan({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
        setStartPan(null);
    };

    const resetZoom = () => {
        setScale(1);
        setTranslateX(0);
        setTranslateY(0);
    };

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
        chartGrid: darkMode ? "#444" : "#e0e0e0",
        chartText: darkMode ? "#aaa" : "#666",
    };

    return (
        <div className={`fixed inset-0 ${theme.bg} ${theme.text} overflow-hidden`} style={{ margin: 0, padding: 0 }}>
            {/* Botones flotantes */}
            <div className="fixed top-[17px] sm:top-4 right-5 sm:right-4 z-40 flex gap-2">
                {/* Botón de estadísticas */}
                {statsVisibility.enabled && (
                    <button
                        onClick={() => setStatsOpen(true)}
                        className={`rounded-lg ${theme.buttonPrimary} p-2 sm:px-4 sm:py-2 shadow-lg transition-colors`}
                        title="Estadísticas"
                    >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 translate-x-[-1px] sm:translate-x-0 translate-y-[-1px] sm:translate-y-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 3v18h18" />
                            <path d="M18 17V9" />
                            <path d="M13 17V5" />
                            <path d="M8 17v-3" />
                        </svg>
                    </button>
                )}

                {/* Botón de configuración */}
                <button
                    onClick={() => setDrawerOpen(true)}
                    className={`rounded-lg ${theme.buttonPrimary} p-2 sm:px-4 sm:py-2 shadow-lg transition-colors`}
                    title="Configuración"
                >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 translate-x-[-1px] sm:translate-x-0 translate-y-[-2px] sm:translate-y-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
            </div>

            {/* Botón de reset zoom */}
            {(scale !== 1 || translateX !== 0 || translateY !== 0) && (
                <button
                    onClick={resetZoom}
                    className={`fixed bottom-4 right-4 z-40 rounded-full ${theme.buttonPrimary} px-4 py-3 shadow-lg transition-colors text-sm font-medium`}
                    title="Resetear zoom"
                >
                    🔍
                </button>
            )}

            {/* Información flotante */}
            <div className="fixed top-4 left-4 z-40 flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className={`rounded-xl sm:rounded-2xl ${theme.card} backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 shadow-lg w-fit min-w-40 sm: min-w-none`}>
                    <div className={`text-xs sm:text-sm ${theme.textMuted}`}>
                        {hoverInfo ? (
                            <HoverText sectors={sectors} hoverInfo={hoverInfo} darkMode={darkMode} />
                        ) : (
                            <span>Media del día: <b className={`text-base sm:text-lg ${theme.text}`}>{avg}</b></span>
                        )}
                    </div>
                </div>

                <div className={`rounded-xl sm:rounded-2xl ${theme.card} backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 mt-1 sm:mt-0 shadow-lg`}>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                const date = new Date(dateStr);
                                date.setDate(date.getDate() - 1);
                                setDateStr(formatDateInput(date));
                            }}
                            className={`${theme.button} rounded-md px-2 py-1 text-sm font-bold transition-colors`}
                            title="Día anterior"
                        >
                            &lt;
                        </button>

                        <input
                            type="date"
                            value={dateStr}
                            onChange={(e) => setDateStr(e.target.value)}
                            className={`text-xs sm:text-sm border-0 bg-transparent p-0 cursor-pointer focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-neutral-100' : 'focus:ring-neutral-900'} rounded ${theme.text}`}
                            style={{ fontFamily: 'inherit', colorScheme: darkMode ? 'dark' : 'light' }}
                        />

                        <button
                            onClick={() => {
                                const date = new Date(dateStr);
                                date.setDate(date.getDate() + 1);
                                setDateStr(formatDateInput(date));
                            }}
                            className={`${theme.button} rounded-md px-2 py-1 text-sm font-bold transition-colors`}
                            title="Día siguiente"
                        >
                            &gt;
                        </button>

                        <button
                            onClick={() => setDateStr(todayStr)}
                            className={`${theme.buttonPrimary} rounded-md px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium transition-colors`}
                            title="Ir a hoy"
                        >
                            Hoy
                        </button>
                    </div>
                </div>
            </div>

            {/* Rueda principal */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ padding: '80px 20px 20px 20px' }}>
                <div className="w-full h-full max-h-full flex items-center justify-center">
                    <svg
                        ref={svgRef}  /* referencia al SVG para cálculos de posición */
                        onContextMenu={handleSvgContextMenu}  /* manejador de menú contextual */
                        width="100%"
                        height="100%"
                        viewBox={`0 0 ${SIZE} ${SIZE}`}
                        onClick={handleSvgClick}
                        onMouseMove={handleSvgMove}
                        onMouseLeave={() => setHoverInfo(null)}
                        onWheel={handleWheel}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        className="select-none touch-none drop-shadow-2xl"
                        style={{ maxWidth: '100%', maxHeight: '100%', cursor: isPanning ? 'grabbing' : 'grab' }}
                        preserveAspectRatio="xMidYMid meet"
                    >
                        <g transform={`translate(${SIZE / 2 + translateX} ${SIZE / 2 + translateY}) scale(${scale}) translate(${-SIZE / 2} ${-SIZE / 2})`}>
                            <circle cx={cx} cy={cy} r={radius} fill={theme.svgBg} />
                            {renderFilledSectors()}
                            {renderGrid()}
                            {renderLabelsFixed()}
                            {renderRingNumbers()}
                            {renderSectorHover()}
                            <circle cx={cx} cy={cy} r={ringThickness * 0.6} fill={theme.svgCenter} stroke={theme.svgCenterBorder} />
                        </g>
                    </svg>
                </div>
            </div>

            <div className="fixed bottom-0 p-2 me-20">
                <p className="text-xs text-center">
                    Todos tus datos son almacenados localmente, de forma 100% privada y no se usan para nada.
                </p>
            </div>

            {/* Menú contextual emergente */}
            {infoMenuContextual && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setInfoMenuContextual(null)} />

                    <div
                        ref={menuRef}
                        className={`fixed z-50 w-[200px] sm:w-[300px] rounded-xl border ${theme.border} bg-neutral-800/90 backdrop-blur-sm p-4 shadow-xl`}
                        style={{ top: `${infoMenuContextual.y}px`, left: `${infoMenuContextual.x}px` }}
                    >
                        {(() => {
                            const sector = sectors.find(s => s.id === infoMenuContextual.idSector);
                            const valorActual = scores[infoMenuContextual.idSector] ?? 0;
                            if (!sector) return null;

                            const isMobile = window.innerWidth <= 768;

                            return (
                                <div className="flex flex-col gap-3">
                                    {/* Fila principal: color, nombre, eliminar */}
                                    <div className="flex items-center gap-2 mb-3 flex-wrap sm:flex-nowrap">
                                        {/* Color */}
                                        <input
                                            type="color"
                                            defaultValue={rgbToHex(sector.color)}
                                            onChange={(e) => {
                                                const nuevoColor = e.target.value;
                                                setSectors(prev =>
                                                    prev.map(s =>
                                                        s.id === sector.id ? { ...s, color: nuevoColor } : s
                                                    )
                                                );
                                            }}
                                            className="h-4 w-4 sm:h-8 sm:w-8 cursor-pointer rounded-md border flex-shrink-0"
                                        />

                                        {/* Nombre */}
                                        <input
                                            type="text"
                                            defaultValue={sector.name}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    const nombre = (e.target as HTMLInputElement).value;
                                                    setSectors(prev =>
                                                        prev.map(s =>
                                                            s.id === sector.id ? { ...s, name: nombre } : s
                                                        )
                                                    );
                                                    setInfoMenuContextual(null);
                                                }
                                            }}
                                            onBlur={(e) => {
                                                const nombre = e.target.value;
                                                setSectors(prev =>
                                                    prev.map(s =>
                                                        s.id === sector.id ? { ...s, name: nombre } : s
                                                    )
                                                );
                                            }}
                                            className={`flex-1 min-w-0 rounded-lg border ${theme.input} px-1 sm:px-3 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-neutral-100' : 'focus:ring-neutral-900'}`}
                                        />

                                        {/* Eliminar */}
                                        <button
                                            title="Eliminar"
                                            className={`rounded-md border ${theme.border} ${theme.button} px-1 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] sm:text-xs transition-colors flex-shrink-0`}
                                            onClick={() => {
                                                if (confirm("¿Eliminar este sector?")) {
                                                    setSectors(prev => prev.filter(s => s.id !== sector.id));
                                                    setInfoMenuContextual(null);
                                                }
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </div>

                                    {/* Slider de puntuación */}
                                    <div className="flex items-center gap-2">
                                        <label className={`text-xs ${theme.textMuted} flex-shrink-0`}>Puntuación:</label>
                                        {!isMobile &&
                                            <input
                                                type="range"
                                                min={0}
                                                max={RING_COUNT}
                                                defaultValue={valorActual}
                                                onMouseUp={(e) => setScore(sector.id, (e.target as HTMLInputElement).value)}
                                                className={`flex-1 min-w-0 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer
                                                [&::-webkit-slider-thumb]:appearance-none
                                                [&::-webkit-slider-thumb]:w-3
                                                [&::-webkit-slider-thumb]:h-3
                                                [&::-webkit-slider-thumb]:rounded-full
                                                [&::-webkit-slider-thumb]:bg-blue-600
                                                [&::-webkit-slider-thumb]:cursor-pointer
                                                [&::-webkit-slider-thumb]:transition
                                                [&::-webkit-slider-thumb]:hover:bg-blue-700
                                                [&::-moz-range-thumb]:w-3
                                                [&::-moz-range-thumb]:h-3
                                                [&::-moz-range-thumb]:rounded-full
                                                [&::-moz-range-thumb]:bg-blue-600`}
                                            />}
                                        <input
                                            type="number"
                                            min={0}
                                            max={10}
                                            value={valorActual}
                                            onChange={(e) => {
                                                const nuevoValor = parseInt(e.target.value);
                                                setScore(sector.id, nuevoValor);
                                            }}
                                            className={`w-12 sm:w-16 rounded-md border ${theme.input} px-1 sm:px-2 py-1 text-xs sm:text-sm text-center focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-neutral-100' : 'focus:ring-neutral-900'} flex-shrink-0`}
                                        />
                                    </div>

                                    <hr className={`my-1 ${theme.borderLight} border-t`} />

                                    {/* Comentario del día */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <label className={`text-xs ${theme.textMuted}`}>Comentario</label>

                                            {/* Botón rápido para limpiar si ya hay comentario */}
                                            {getComment(dateStr, sector.id) && (
                                                <button
                                                    className={`text-xs px-2 py-1 rounded ${theme.buttonPrimary}`}
                                                    onClick={() => {
                                                        deleteComment(dateStr, sector.id);
                                                        // opcional: limpiar textarea si abierto
                                                        if (commentTextRef.current) commentTextRef.current.value = "";
                                                    }}
                                                    title="Eliminar comentario del día"
                                                >
                                                    Borrar
                                                </button>
                                            )}
                                        </div>

                                        <textarea
                                            ref={commentTextRef}
                                            defaultValue={getComment(dateStr, sector.id)}
                                            maxLength={100}
                                            rows={3}
                                            placeholder="Escribe tu comentario..."
                                            className={`w-full resize-none rounded-md border ${theme.input} px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-neutral-100' : 'focus:ring-neutral-900'}`}
                                            onKeyDown={(e) => {
                                                // Guardar con Ctrl+Enter / Cmd+Enter, Enter solo hace salto de línea
                                                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                                                    const t = (e.target as HTMLTextAreaElement).value.trim();
                                                    if (t.length > 0) setComment(dateStr, sector.id, t);
                                                    else deleteComment(dateStr, sector.id);
                                                    setInfoMenuContextual(null); // cerrar menú al guardar
                                                }
                                            }}
                                        />

                                        <div className="flex items-center justify-between">
                                            {/* Contador de caracteres */}
                                            <span className={`text-[10px] ${theme.textMuted}`}>
                                                {(commentTextRef.current?.value?.length ?? getComment(dateStr, sector.id).length)}/100
                                            </span>

                                            <div className="flex gap-2">
                                                <button
                                                    className={`text-xs px-1.5 sm:px-3 py-1 rounded ${theme.button}`}
                                                    onClick={() => setInfoMenuContextual(null)}
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    className={`text-xs px-1.5 sm:px-3 py-1 rounded ${theme.buttonPrimary}`}
                                                    onClick={() => {
                                                        const t = (commentTextRef.current?.value ?? "").trim();
                                                        if (t.length > 0) setComment(dateStr, sector.id, t);
                                                        else deleteComment(dateStr, sector.id);
                                                        setInfoMenuContextual(null);
                                                    }}
                                                >
                                                    Guardar
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Separador para el botón de cerrar */}
                                    {isMobile && (
                                        <hr className={`my-1 ${theme.borderLight} border-t`} />
                                    )}

                                    {/* Botón cerrar solo en móvil */}
                                    {isMobile && (
                                        <button
                                            onClick={() => setInfoMenuContextual(null)}
                                            className={`text-xs ${theme.buttonPrimary} px-3 py-1 rounded w-full`}
                                        >
                                            Cerrar
                                        </button>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </>
            )}


            {/* Input de color oculto para cambiar color de sector */}
            <input
                type="color"
                ref={selectorColorRef}
                className="hidden"
                onChange={(e) => {
                    if (!infoMenuContextual) return;
                    const nuevoColor = e.target.value;
                    setSectors(prev => prev.map(x =>
                        x.id === infoMenuContextual.idSector ? { ...x, color: nuevoColor } : x
                    ));
                    setInfoMenuContextual(null);
                }}
            />

            {/* Modal de Estadísticas */}
            {statsOpen && (
                <>
                    <div
                        className={`fixed inset-0 ${theme.overlay} z-50 transition-opacity`}
                        onClick={() => setStatsOpen(false)}
                    />
                    <div className={`fixed inset-4 md:inset-8 lg:inset-16 ${theme.cardSolid} shadow-2xl z-50 rounded-2xl overflow-hidden flex flex-col`}>
                        {/* Header del modal */}
                        <div className={`flex items-center justify-between p-4 md:p-6 border-b ${theme.borderLight}`}>
                            <div>
                                <h2 className={`text-xl md:text-2xl font-bold ${theme.text}`}>📊 Estadísticas y Progreso</h2>
                                <p className={`text-xs md:text-sm ${theme.textMuted} mt-1`}>
                                    {statsData.totalDays} días registrados · Racha actual: {statsData.currentStreak} días
                                </p>
                            </div>
                            <button
                                onClick={() => setStatsOpen(false)}
                                className={`rounded-full p-2 ${theme.buttonPrimary} transition-colors`}
                            >
                                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {/* Contenido con scroll */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                            {statsData.dailyAverage.length === 0 ? (
                                <div className={`text-center py-12 ${theme.textMuted}`}>
                                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <p className="text-lg">No hay datos suficientes aún</p>
                                    <p className="text-sm mt-2">Comienza a registrar tus puntuaciones para ver estadísticas</p>
                                </div>
                            ) : (
                                <>
                                    {/* Gráfico 1: Media Diaria */}
                                    {statsVisibility.showDailyAverage && (
                                        <div className={`rounded-xl border ${theme.border} p-4 ${theme.inputAlt}`}>
                                            <h3 className={`text-base md:text-lg font-semibold mb-4 ${theme.text}`}>📈 Evolución de la Media Diaria</h3>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <AreaChart data={statsData.dailyAverage}>
                                                    <defs>
                                                        <linearGradient id="colorMedia" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                                                    <XAxis
                                                        dataKey="displayDate"
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <YAxis
                                                        domain={[0, 10]}
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: darkMode ? '#262626' : '#fff',
                                                            border: `1px solid ${darkMode ? '#404040' : '#e5e5e5'}`,
                                                            borderRadius: '8px'
                                                        }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="media"
                                                        stroke="#8884d8"
                                                        fillOpacity={1}
                                                        fill="url(#colorMedia)"
                                                        strokeWidth={2}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}

                                    {/* Gráfico 2: Progresión por Sector */}
                                    {statsVisibility.showSectorProgress && (
                                        <div className={`rounded-xl border ${theme.border} p-4 ${theme.inputAlt}`}>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                                <h3 className={`text-base md:text-lg font-semibold ${theme.text}`}>📊 Progresión por Sector</h3>
                                                <select
                                                    value={selectedSectorId}
                                                    onChange={(e) => setSelectedSectorId(e.target.value)}
                                                    className={`rounded-lg border ${theme.input} px-3 py-2 text-sm focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-neutral-100' : 'focus:ring-neutral-900'}`}
                                                >
                                                    {sectors.map(s => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <LineChart data={statsData.sectorProgress(selectedSectorId)}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                                                    <XAxis
                                                        dataKey="displayDate"
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <YAxis
                                                        domain={[0, 10]}
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: darkMode ? '#262626' : '#fff',
                                                            border: `1px solid ${darkMode ? '#404040' : '#e5e5e5'}`,
                                                            borderRadius: '8px'
                                                        }}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="puntuacion"
                                                        stroke={sectors.find(s => s.id === selectedSectorId)?.color || "#8884d8"}
                                                        strokeWidth={3}
                                                        dot={{ r: 4 }}
                                                        activeDot={{ r: 6 }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}

                                    {/* Gráfico: Últimos 7 Días - Todos los Sectores */}
                                    {statsVisibility.showLast7AllSectors && statsData.last7DaysAllSectors && (
                                        <div className={`rounded-xl border ${theme.border} p-4 ${theme.inputAlt}`}>
                                            <h3 className={`text-base md:text-lg font-semibold mb-4 ${theme.text}`}>📅 Evolución Últimos 7 Días - Comparativa</h3>

                                            <ResponsiveContainer width="100%" height={300}>
                                                <LineChart data={statsData.last7DaysAllSectors}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                                                    <XAxis
                                                        dataKey="displayDate"
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <YAxis
                                                        domain={[0, 10]}
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: darkMode ? '#262626' : '#fff',
                                                            border: `1px solid ${darkMode ? '#404040' : '#e5e5e5'}`,
                                                            borderRadius: '8px'
                                                        }}
                                                        formatter={(value: any, name: string) => [value, name]}
                                                    />
                                                    <Legend />
                                                    {sectors.filter(s => visibleSectors[s.id]).map(sector => (
                                                        <Line
                                                            key={sector.id}
                                                            type="monotone"
                                                            dataKey={sector.name}
                                                            stroke={rgbToHex(sector.color)}
                                                            strokeWidth={2}
                                                            dot={{ r: 4, fill: rgbToHex(sector.color) }}
                                                            activeDot={{ r: 6 }}
                                                            name={sector.name}
                                                        />
                                                    ))}
                                                </LineChart>
                                            </ResponsiveContainer>

                                            {/* Checkboxes para mostrar/ocultar sectores */}
                                            <div className="mt-4 pt-4 border-t border-opacity-20" style={{ borderColor: theme.borderLight }}>
                                                <p className={`text-xs font-semibold mb-3 ${theme.textMuted}`}>Mostrar sectores:</p>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                                    {sectors.map(sector => (
                                                        <label
                                                            key={sector.id}
                                                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${visibleSectors[sector.id]
                                                                ? darkMode ? 'bg-neutral-700' : 'bg-neutral-100'
                                                                : darkMode ? 'bg-neutral-800' : 'bg-neutral-50'
                                                                }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={visibleSectors[sector.id] || false}
                                                                onChange={(e) => {
                                                                    setVisibleSectors(prev => ({
                                                                        ...prev,
                                                                        [sector.id]: e.target.checked
                                                                    }));
                                                                }}
                                                                className="w-4 h-4 cursor-pointer"
                                                                style={{ accentColor: rgbToHex(sector.color) }}
                                                            />
                                                            <div className="flex items-center gap-1 flex-1 min-w-0">
                                                                <div
                                                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                                                    style={{ backgroundColor: rgbToHex(sector.color) }}
                                                                />
                                                                <span className={`text-xs truncate ${theme.text}`}>
                                                                    {sector.name}
                                                                </span>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Gráfico 3: Comparación de Sectores */}
                                    {statsVisibility.showComparison && (
                                        <div className={`rounded-xl border ${theme.border} p-4 ${theme.inputAlt}`}>
                                            <h3 className={`text-base md:text-lg font-semibold mb-4 ${theme.text}`}>📊 Comparación: Actual vs Promedio Histórico</h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={statsData.sectorComparison}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                                                    <XAxis
                                                        dataKey="sector"
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '11px' }}
                                                        angle={-45}
                                                        textAnchor="end"
                                                        height={80}
                                                    />
                                                    <YAxis
                                                        domain={[0, 10]}
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: darkMode ? '#262626' : '#fff',
                                                            border: `1px solid ${darkMode ? '#404040' : '#e5e5e5'}`,
                                                            borderRadius: '8px'
                                                        }}
                                                    />
                                                    <Legend />
                                                    <Bar dataKey="actual" fill="#82ca9d" name="Puntuación Actual" />
                                                    <Bar dataKey="promedio" fill="#8884d8" name="Promedio Histórico" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}

                                    {/* Gráfico 4: Tendencia Semanal */}
                                    {statsVisibility.showWeeklyTrend && (
                                        <div className={`rounded-xl border ${theme.border} p-4 ${theme.inputAlt}`}>
                                            <h3 className={`text-base md:text-lg font-semibold mb-4 ${theme.text}`}>📅 Promedio por Día de la Semana</h3>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <BarChart data={statsData.weeklyData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                                                    <XAxis
                                                        dataKey="dia"
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <YAxis
                                                        domain={[0, 10]}
                                                        stroke={theme.chartText}
                                                        style={{ fontSize: '12px' }}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: darkMode ? '#262626' : '#fff',
                                                            border: `1px solid ${darkMode ? '#404040' : '#e5e5e5'}`,
                                                            borderRadius: '8px'
                                                        }}
                                                    />
                                                    <Bar dataKey="media" fill="#ffc658" name="Media" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                            <p className={`text-xs ${theme.textMuted} mt-2 text-center`}>
                                                ¿Qué días de la semana tienes mejor desempeño?
                                            </p>
                                        </div>
                                    )}

                                    {/* Gráfico 5: Heat Map de Consistencia */}
                                    {statsVisibility.showHeatMap && (
                                        <div className={`rounded-xl border ${theme.border} p-4 ${theme.inputAlt}`}>
                                            <h3 className={`text-base md:text-lg font-semibold mb-4 ${theme.text}`}>🔥 Mapa de Calor - Últimos 60 Días</h3>
                                            <div className="grid lg:grid-cols-30 grid-cols-10 gap-1 sm:gap-2">
                                                {statsData.heatMapData.map((day, index) => {
                                                    const intensity = day.hasData ? Math.round((day.value / 10) * 4) : 0;
                                                    const colors = darkMode
                                                        ? ['#1a1a1a', '#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa']
                                                        : ['#f3f4f6', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa'];
                                                    return (
                                                        <div
                                                            key={index}
                                                            className="aspect-square rounded-sm relative group cursor-pointer"
                                                            style={{ backgroundColor: colors[intensity] }}
                                                            title={`${day.displayDate}: ${day.hasData ? day.value.toFixed(1) : 'Sin datos'}`}
                                                        >
                                                            <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 ${theme.cardSolid} px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border ${theme.border}`}>
                                                                {day.displayDate}: {day.hasData ? day.value.toFixed(1) : 'N/A'}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="flex items-center justify-between mt-4 text-xs">
                                                <span className={theme.textMuted}>Menos</span>
                                                <div className="flex gap-1">
                                                    {[0, 1, 2, 3, 4].map(i => {
                                                        const colors = darkMode
                                                            ? ['#1a1a1a', '#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa']
                                                            : ['#f3f4f6', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa'];
                                                        return (
                                                            <div
                                                                key={i}
                                                                className="w-4 h-4 rounded-sm"
                                                                style={{ backgroundColor: colors[i] }}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                                <span className={theme.textMuted}>Más</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Resumen de Insights */}
                                    {statsVisibility.showInsights && (
                                        <div className={`rounded-xl border ${theme.border} p-4 ${theme.inputAlt}`}>
                                            <h3 className={`text-base md:text-lg font-semibold mb-3 ${theme.text}`}>💡 Insights</h3>
                                            <div className="space-y-2 text-sm">
                                                {(() => {
                                                    const lastAvg = statsData.dailyAverage[statsData.dailyAverage.length - 1]?.media || 0;
                                                    const firstAvg = statsData.dailyAverage[0]?.media || 0;
                                                    const trend = lastAvg - firstAvg;

                                                    const bestSectorToday = statsData.todaySectorScores.reduce((prev, current) =>
                                                        current.score > prev.score ? current : prev
                                                    );

                                                    const worstSectorToday = statsData.todaySectorScores.reduce((prev, current) =>
                                                        current.score < prev.score ? current : prev
                                                    );

                                                    const bestSectorHistorical = statsData.historicalSectorScores.reduce((prev, current) =>
                                                        current.score > prev.score ? current : prev
                                                    );

                                                    const worstSectorHistorical = statsData.historicalSectorScores.reduce((prev, current) =>
                                                        current.score < prev.score ? current : prev
                                                    );

                                                    const bestWeekDay = statsData.weeklyData.reduce((prev, current) =>
                                                        current.media > prev.media ? current : prev
                                                    );

                                                    return (
                                                        <>
                                                            <div className={`p-3 rounded-lg ${darkMode ? 'bg-neutral-700' : 'bg-neutral-100'}`}>
                                                                <p className={theme.text}>
                                                                    <span className="font-semibold">Tendencia general:</span>{' '}
                                                                    {trend > 0 ? (
                                                                        <span className="text-green-500">↗ Mejorando (+{trend.toFixed(2)})</span>
                                                                    ) : trend < 0 ? (
                                                                        <span className="text-red-500">↘ Descendiendo ({trend.toFixed(2)})</span>
                                                                    ) : (
                                                                        <span className={theme.textMuted}>→ Estable</span>
                                                                    )}
                                                                </p>
                                                            </div>

                                                            <div className={`p-3 rounded-lg ${darkMode ? 'bg-neutral-700' : 'bg-neutral-100'}`}>
                                                                <p className={theme.text}>
                                                                    <span className="font-semibold">Tu sector más fuerte:</span>
                                                                    <br />
                                                                    <span className={`text-xs ${theme.textMuted}`}>Hoy:</span> {bestSectorToday.sector} ({bestSectorToday.score}/10)
                                                                    <br />
                                                                    <span className={`text-xs ${theme.textMuted}`}>Histórico:</span> {bestSectorHistorical.sector} ({bestSectorHistorical.score}/10)
                                                                </p>
                                                            </div>

                                                            <div className={`p-3 rounded-lg ${darkMode ? 'bg-neutral-700' : 'bg-neutral-100'}`}>
                                                                <p className={theme.text}>
                                                                    <span className="font-semibold">Área de mejora:</span>
                                                                    <br />
                                                                    <span className={`text-xs ${theme.textMuted}`}>Hoy:</span> {worstSectorToday.sector} ({worstSectorToday.score}/10)
                                                                    <br />
                                                                    <span className={`text-xs ${theme.textMuted}`}>Histórico:</span> {worstSectorHistorical.sector} ({worstSectorHistorical.score}/10)
                                                                </p>
                                                            </div>

                                                            <div className={`p-3 rounded-lg ${darkMode ? 'bg-neutral-700' : 'bg-neutral-100'}`}>
                                                                <p className={theme.text}>
                                                                    <span className="font-semibold">Tu mejor día:</span>
                                                                    <br />
                                                                    <span className={`text-xs ${theme.textMuted}`}>De la semana:</span> {bestWeekDay.dia} ({bestWeekDay.media.toFixed(2)}/10 promedio)
                                                                    <br />
                                                                    {statsData.bestHistoricalDay && (
                                                                        <>
                                                                            <span className={`text-xs ${theme.textMuted}`}>Histórico:</span> {new Date(statsData.bestHistoricalDay.date).toLocaleDateString('es-ES', {
                                                                                day: '2-digit',
                                                                                month: 'long',
                                                                                year: 'numeric'
                                                                            })} ({statsData.bestHistoricalDay.media}/10)
                                                                        </>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}

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

                    <hr className={`my-6 ${theme.borderLight} border-t`} />

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
                                            className="h-6 w-6 sm:h-8 sm:w-8 cursor-pointer rounded-md border flex-shrink-0"
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

                    {/* === Sección: Datos (Reset / Export / Import) === */}
                    <div className={`mb-6 p-4 rounded-xl ${theme.inputAlt} ${theme.border} border`}>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <div className={`text-lg font-semibold ${theme.text}`}>Datos</div>
                                <div className={`text-xs ${theme.textLight}`}>
                                    Resetea el día actual o guarda/carga tus datos en JSON para poder usarlos en otro dispositivo
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                            <button
                                onClick={() => {
                                    if (confirm("¿Seguro que quieres resetear las puntuaciones del día actual?")) {
                                        resetDay();
                                    }
                                }}
                                className={`flex-1 rounded-lg border ${theme.border} ${theme.button} px-3 py-2 text-sm transition-colors`}
                            >
                                Resetear día
                            </button>

                            <button
                                onClick={exportJSON}
                                className={`flex-1 rounded-lg border ${theme.border} ${theme.button} px-3 py-2 text-sm transition-colors`}
                            >
                                Exportar JSON
                            </button>

                            <label className={`flex-1 rounded-lg border ${theme.border} ${theme.button} px-3 py-2 text-sm cursor-pointer text-center transition-colors`}>
                                Importar JSON
                                <input type="file" accept="application/json" className="hidden" onChange={importJSON} />
                            </label>
                        </div>
                    </div>


                    <hr className={`my-6 ${theme.borderLight} border-t`} />

                    {/* === Preferencias de Estadísticas === */}
                    <div className={`mb-6 p-4 rounded-xl ${theme.inputAlt} ${theme.border} border`}>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <div className={`text-lg font-semibold ${theme.text}`}>Estadísticas</div>
                                <div className={`text-xs ${theme.textLight}`}>
                                    Alterna la visibilidad de las estadísticas
                                </div>
                            </div>

                            {/* Master toggle: desactivar todo (oculta también el botón) */}
                            <button
                                onClick={() =>
                                    setStatsVisibility(v => ({ ...v, enabled: !v.enabled }))
                                }
                                className={`relative inline-flex h-8 w-14 items-center justify-start rounded-full transition-colors ${statsVisibility.enabled ? "bg-green-500/70" : "bg-neutral-400/60"} padding-esp`}
                                title="Desactivar todo (oculta el botón de estadísticas)"
                            >
                                <span
                                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${statsVisibility.enabled ? "translate-x-6" : "translate-x-0"}`}
                                />
                            </button>
                        </div>

                        {/* Toggles individuales (deshabilitados cuando master OFF) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                            {[
                                ["showDailyAverage", "📈 Evolución de la Media Diaria"],
                                ["showSectorProgress", "📊 Progresión por Sector"],
                                ["showLast7AllSectors", "📅 Últimos 7 días (comparativa)"],
                                ["showComparison", "📊 Comparación Actual vs Promedio"],
                                ["showWeeklyTrend", "📅 Promedio por día de la semana"],
                                ["showHeatMap", "🔥 Heatmap (60 días)"],
                                ["showInsights", "💡 Insights"],
                            ].map(([key, label]) => (
                                <label key={key} className={`flex items-center justify-between p-2 rounded-lg ${theme.card}`}>
                                    <span className={`text-sm ${theme.text}`}>{label}</span>
                                    <input
                                        type="checkbox"
                                        checked={(statsVisibility as any)[key]}
                                        disabled={!statsVisibility.enabled}
                                        onChange={(e) =>
                                            setStatsVisibility(v => ({ ...v, [key]: e.target.checked } as StatsVisibility))
                                        }
                                        className="h-4 w-4 cursor-pointer"
                                    />
                                </label>
                            ))}
                        </div>
                    </div>

                    <hr className={`my-6 ${theme.borderLight} border-t`} />

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
    if (!input) return "#888888";
    if (input.startsWith("#")) return input;
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
        r = g = b = l;
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