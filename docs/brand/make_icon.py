"""Genera el icono (ejecutar desde la raíz del proyecto: python docs/brand/make_icon.py).
Los PNG de public/ se obtienen renderizando estos SVG.

Icono: rueda de «pétalos» (sectores redondeados de distinta longitud) con un corazón en el centro."""
import math

HEART = "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
COLORS = ["#fda4af", "#fdba74", "#fde047", "#86efac", "#5eead4", "#7dd3fc", "#a5b4fc", "#f0abfc"]
# Longitud de cada pétalo (fracción del radio máximo): una rueda «real», no un círculo perfecto
LENGTHS = [1.0, 0.78, 0.9, 0.7, 0.96, 0.8, 0.88, 0.74]


def petal(cx, cy, r0, r1, a0, a1):
    p = lambda r, a: (cx + r * math.cos(a), cy + r * math.sin(a))
    x0, y0 = p(r0, a0); x1, y1 = p(r1, a0); x2, y2 = p(r1, a1); x3, y3 = p(r0, a1)
    return (f"M{x0:.2f} {y0:.2f} L{x1:.2f} {y1:.2f} A{r1:.2f} {r1:.2f} 0 0 1 {x2:.2f} {y2:.2f} "
            f"L{x3:.2f} {y3:.2f} A{r0:.2f} {r0:.2f} 0 0 0 {x0:.2f} {y0:.2f}Z")


def mark(cx, cy, scale, center=50, heart=2.75):
    """Rueda + corazón centrados en (cx, cy); scale = 1 ocupa ~400 px."""
    rmax, r0, gap_deg, round_w = 212 * scale, (center + 12) * scale, 7, 22 * scale
    out = []
    n = len(COLORS)
    for i, (color, length) in enumerate(zip(COLORS, LENGTHS)):
        span = 2 * math.pi / n
        gap = math.radians(gap_deg)
        a0 = -math.pi / 2 + i * span + gap / 2
        a1 = a0 + span - gap
        r1 = r0 + (rmax - r0) * length
        # El trazo del mismo color con unión redondeada suaviza las esquinas del sector
        # (se recorta hacia dentro para que el tamaño final no cambie)
        inset = round_w / 2
        d = petal(cx, cy, r0 + inset, r1 - inset, a0 + inset / ((r0 + r1) / 2), a1 - inset / ((r0 + r1) / 2))
        out.append(f'<path d="{d}" fill="{color}" stroke="{color}" stroke-width="{round_w:.2f}" stroke-linejoin="round"/>')
    out.append(f'<circle cx="{cx}" cy="{cy}" r="{center * scale:.2f}" fill="#ffffff"/>')
    hs = heart * scale
    out.append(f'<path d="{HEART}" transform="translate({cx} {cy + 1.5 * scale:.2f}) scale({hs:.3f}) translate(-12 -12)" fill="#e11d48"/>')
    return "\n  ".join(out)


def rounded_wedge(cx, cy, r1, a0, a1, corner):
    """Sector desde el centro hasta r1 con las esquinas exteriores redondeadas."""
    p = lambda r, a: (cx + r * math.cos(a), cy + r * math.sin(a))
    da = corner / r1
    x0, y0 = p(r1 - corner, a0); kx0, ky0 = p(r1, a0); ax0, ay0 = p(r1, a0 + da)
    ax1, ay1 = p(r1, a1 - da); kx1, ky1 = p(r1, a1); x1, y1 = p(r1 - corner, a1)
    return (f"M{cx:.2f} {cy:.2f} L{x0:.2f} {y0:.2f} Q{kx0:.2f} {ky0:.2f} {ax0:.2f} {ay0:.2f} "
            f"A{r1:.2f} {r1:.2f} 0 0 1 {ax1:.2f} {ay1:.2f} Q{kx1:.2f} {ky1:.2f} {x1:.2f} {y1:.2f}Z")


def flower(cx, cy, rmax, border, corner, heart):
    """Flor del centro de la rueda: pétalos hasta el centro, bordeados de blanco, y corazón con contorno blanco."""
    out = []
    n = len(COLORS)
    for i, (color, length) in enumerate(zip(COLORS, LENGTHS)):
        a0 = -math.pi / 2 + i * 2 * math.pi / n
        a1 = a0 + 2 * math.pi / n
        d = rounded_wedge(cx, cy, rmax * (0.62 + 0.38 * length), a0, a1, corner)
        out.append(f'<path d="{d}" fill="{color}" stroke="#ffffff" stroke-width="{border}" stroke-linejoin="round"/>')
    out.append(f'<path d="{HEART}" transform="translate({cx} {cy + 6}) scale({heart}) translate(-12 -12)" '
               f'fill="#e11d48" stroke="#ffffff" stroke-width="{18 / heart:.2f}" stroke-linejoin="round" paint-order="stroke"/>')
    return "\n  ".join(out)


BG = ('<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">'
      '<stop offset="0" stop-color="#4f46e5"/><stop offset="1" stop-color="#312e81"/></linearGradient></defs>')

icon = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  {BG}
  <rect width="512" height="512" rx="116" fill="url(#bg)"/>
  {mark(256, 256, 1.0)}
</svg>
'''
# Maskable: fondo a sangre y contenido dentro de la zona segura (80 %)
maskable = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  {BG}
  <rect width="512" height="512" fill="url(#bg)"/>
  {mark(256, 256, 0.78)}
</svg>
'''
favicon = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  {BG}
  <rect width="512" height="512" rx="116" fill="url(#bg)"/>
  {mark(256, 256, 1.04, center=88, heart=5.2)}
</svg>
'''
apple = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  {BG}
  <rect width="512" height="512" fill="url(#bg)"/>
  {mark(256, 256, 0.9)}
</svg>
'''
# Solo la flor (sin fondo), para el centro de la rueda
mark_only = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  {flower(256, 256, 244, border=14, corner=34, heart=7.6)}
</svg>
'''
open("public/logo-mark.svg", "w", encoding="utf-8").write(mark_only)
open("public/favicon.svg", "w", encoding="utf-8").write(favicon)
open("docs/brand/apple-touch-icon.svg", "w", encoding="utf-8").write(apple)
open("docs/brand/icon.svg", "w", encoding="utf-8").write(icon)
open("docs/brand/icon-maskable.svg", "w", encoding="utf-8").write(maskable)
print("ok")
