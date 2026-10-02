// Contraste real de las etiquetas de la rueda sobre los fondos con imagen de cada estilo.
// Oculta las etiquetas, captura el fondo que hay detrás y compara con el color del texto (percentil 5).
// Uso: arrancar `npm run dev -- --port 5199` y ejecutar `npm run contrast-check`. Objetivo: >= 4.5:1.
import { chromium } from "playwright";
import { PNG } from "pngjs";
const URL = process.env.VISUAL_CHECK_URL ?? "http://localhost:5199/";
const browser = await chromium.launch();
let failures = 0;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
for (const [w, h, label] of [[1440, 900, "escritorio"], [390, 844, "móvil"]]) {
  for (const style of ["aurora", "beach", "rock", "mountain"]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    await page.goto(URL);
    await page.evaluate((style) => { localStorage.clear(); localStorage.setItem("mental-wheel-style-v1", style); localStorage.setItem("mental-wheel-tutorial-shown", "true"); localStorage.setItem("mental-wheel-language-v1", "es"); }, style);
    await page.reload(); await page.waitForSelector("[data-sector-label]"); await page.waitForTimeout(400);
    const textColor = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--wheel-text").trim());
    const boxes = await page.$$eval("[data-sector-label]", (els) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }));
    await page.addStyleTag({ content: "[data-sector-label]{visibility:hidden}" });
    const png = PNG.sync.read(await page.screenshot());
    const results = boxes.map((b) => {
      const vals = [];
      for (let y = Math.max(0, Math.floor(b.y)); y < Math.min(png.height, b.y + b.h); y++)
        for (let x = Math.max(0, Math.floor(b.x)); x < Math.min(png.width, b.x + b.w); x++) {
          const i = (y * png.width + x) * 4; vals.push(ratio(hex(textColor), [png.data[i], png.data[i + 1], png.data[i + 2]]));
        }
      vals.sort((a, b) => a - b);
      return vals[Math.floor(vals.length * 0.05)];
    });
    const worst = Math.min(...results);
    if (worst < 4.5) failures++;
    console.log(`${label} ${style}: texto ${textColor} · peor etiqueta ${worst.toFixed(1)}:1 · media ${(results.reduce((a, b) => a + b, 0) / results.length).toFixed(1)}:1${worst < 4.5 ? "  <-- FALLA" : ""}`);
    await page.screenshot({ path: `screenshots/bg-${style}-${w}.png` });
    await ctx.close();
  }
}
await browser.close();
process.exitCode = failures > 0 ? 1 : 0;
