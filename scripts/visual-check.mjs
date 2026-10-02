// Comprobación visual y funcional con Playwright.
// Uso: arrancar `npm run dev -- --port 5199` y ejecutar `npm run visual-check`.
// Las capturas se guardan en screenshots/ (ignorado por git).
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const OUT = "screenshots";
const URL = process.env.VISUAL_CHECK_URL ?? "http://localhost:5199/";
mkdirSync(OUT, { recursive: true });

const names = ["Familia", "Amigos", "Dinero", "Amor", "Trabajo", "Salud", "Ocio", "Aprendizaje"];
const colors = names.map((_, i) => `hsl(${Math.round((i * 137.508) % 360)} 70% 50%)`);
const config = names.map((name, i) => ({ id: `s${i}`, name, color: colors[i] }));

function fmt(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const scores = {};
const today = new Date();
for (let back = 0; back < 40; back++) {
    if (back % 6 === 3) continue; // huecos para el heatmap
    const d = new Date(today); d.setDate(d.getDate() - back);
    const day = {};
    config.forEach((s, i) => { day[s.id] = 1 + ((back * 3 + i * 5) % 10); });
    scores[fmt(d)] = day;
}
scores["2026-01-01"] = {}; // día vacío heredado: debe descartarse

function seed({ dark = false, tutorialShown = true, sectors = config } = {}) {
    return (data) => {
        localStorage.clear();
        localStorage.setItem("mental-wheel-config-v1", JSON.stringify(data.sectors));
        localStorage.setItem("mental-wheel-scores-v1", JSON.stringify(data.scores));
        localStorage.setItem("mental-wheel-dark-mode", JSON.stringify(data.dark));
        localStorage.setItem("mental-wheel-language-v1", "es");
        if (data.tutorialShown) localStorage.setItem("mental-wheel-tutorial-shown", "true");
    };
}

async function newPage(browser, opts = {}, ctxOpts = {}) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...ctxOpts });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(URL);
    await page.evaluate(seed(opts), { dark: false, tutorialShown: true, sectors: config, scores, ...opts });
    await page.reload();
    await page.waitForSelector("svg");
    return { page, context, errors };
}

async function sectorPoint(page, index, count = 8, fraction = 0.45) {
    const box = await page.locator("svg.select-none").boundingBox();
    const size = Math.min(box.width, box.height);
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    const span = 360 / count;
    const ang = (-90 + span * index + span / 2) * Math.PI / 180;
    const r = size * (190 / 520) * fraction;
    return { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) };
}

const browser = await chromium.launch();
const report = [];

// 1. Claro: rueda + menú contextual
{
    const { page, context, errors } = await newPage(browser);
    await page.screenshot({ path: `${OUT}/01-light-main.png` });
    const p = await sectorPoint(page, 5);
    await page.mouse.click(p.x, p.y, { button: "right" });
    await page.waitForTimeout(200);
    const textarea = page.locator("textarea");
    await textarea.fill("Hoy he dormido bien");
    report.push(`contador comentario: ${await page.getByText(/\/100$/).textContent()}`);
    await page.screenshot({ path: `${OUT}/02-light-context-menu.png` });
    // slider con teclado
    const slider = page.locator('input[type="range"]').first();
    const before = await page.locator('input[type="number"]').first().inputValue();
    await slider.focus();
    await page.keyboard.press("ArrowLeft");
    const after = await page.locator('input[type="number"]').first().inputValue();
    report.push(`slider teclado: ${before} -> ${after}`);
    await page.keyboard.press("Escape");
    report.push(`errores claro: ${JSON.stringify(errors)}`);
    await context.close();
}

// 2. Oscuro: menú contextual + estadísticas
{
    const { page, context, errors } = await newPage(browser, { dark: true });
    const p = await sectorPoint(page, 2);
    await page.mouse.click(p.x, p.y, { button: "right" });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${OUT}/03-dark-context-menu.png` });
    await page.mouse.click(5, 790); // cerrar menú (overlay)
    await page.getByTitle("Estadísticas", { exact: true }).click();
    await page.waitForSelector("text=Racha actual");
    report.push(`subtítulo stats: ${await page.getByText(/días registrados/).textContent()}`);
    await page.screenshot({ path: `${OUT}/04-dark-stats-top.png` });
    await page.getByText("Mapa de Calor").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${OUT}/05-dark-heatmap.png` });
    report.push(`errores oscuro: ${JSON.stringify(errors)}`);
    await context.close();
}

// 3. Tutorial con 3 sectores + saltar
{
    const { page, context, errors } = await newPage(browser, { tutorialShown: false, sectors: config.slice(0, 3), scores: {} });
    await page.screenshot({ path: `${OUT}/06-tutorial-3-sectors.png` });
    const p = await sectorPoint(page, 2, 3);
    await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(200);
    report.push(`tutorial avanza con 3 sectores: ${await page.getByText("¡Bien hecho!").isVisible()}`);
    await page.getByRole("button", { name: "Saltar tutorial" }).click();
    report.push(`tutorial tras saltar visible: ${await page.getByText("¡Bien hecho!").isVisible()}`);
    report.push(`errores tutorial: ${JSON.stringify(errors)}`);
    await context.close();
}

// 4. Navegación de días en México
{
    const { page, context } = await newPage(browser, {}, { timezoneId: "America/Mexico_City", locale: "es-MX" });
    const label = page.getByRole("button", { name: "Seleccionar fecha" });
    const start = await label.textContent();
    await page.getByTitle("Día anterior").click();
    const prev = await label.textContent();
    await page.getByTitle("Día siguiente").click();
    await page.getByTitle("Día siguiente").click();
    const next = await label.textContent();
    report.push(`México: hoy ${start} | < ${prev} | > > ${next}`);
    await context.close();
}

// 5. Móvil
{
    const { page, context } = await newPage(browser, {}, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await page.screenshot({ path: `${OUT}/07-mobile.png` });
    await context.close();
}

await browser.close();
console.log(report.join("\n"));
