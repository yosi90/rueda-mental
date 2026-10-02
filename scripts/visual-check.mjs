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
    await page.getByRole("button", { name: "Estadísticas" }).click();
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

// 6. Accesibilidad con teclado
{
    const { page, context, errors } = await newPage(browser);
    const focusedDescription = () => page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return "none";
        const role = el.getAttribute("role") ?? el.tagName.toLowerCase();
        return `${role}:${el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 30)}`;
    });

    // El cajón cerrado no debe estar en el árbol accesible
    report.push(`botones «Estadísticas» accesibles (esperado 1): ${await page.getByRole("button", { name: "Estadísticas" }).count()}`);

    // Tabular hasta el primer sector de la rueda
    let reachedSlider = false;
    for (let i = 0; i < 20 && !reachedSlider; i++) {
        await page.keyboard.press("Tab");
        reachedSlider = (await focusedDescription()).startsWith("slider:");
    }
    report.push(`Tab llega a la rueda: ${reachedSlider} (${await focusedDescription()})`);
    const slider = page.locator(":focus");
    const before = await slider.getAttribute("aria-valuetext");
    await page.keyboard.press("ArrowUp");
    const afterUp = await slider.getAttribute("aria-valuetext");
    await page.keyboard.press("7");
    const afterDigit = await slider.getAttribute("aria-valuetext");
    report.push(`teclado en sector: ${before} → ↑ ${afterUp} → 7: ${afterDigit}`);
    await page.screenshot({ path: `${OUT}/08-keyboard-focus.png` });

    // Intro abre el menú; Escape lo cierra y devuelve el foco al sector
    await page.keyboard.press("Enter");
    const dialogOpen = await page.getByRole("dialog").count();
    report.push(`Intro abre menú (diálogos: ${dialogOpen}), foco en: ${await focusedDescription()}`);
    await page.keyboard.press("Escape");
    report.push(`Escape cierra menú (diálogos: ${await page.getByRole("dialog").count()}), foco vuelve a: ${await focusedDescription()}`);

    // Resumen: trampa de foco y Escape
    await page.getByRole("button", { name: "Resumen del día" }).click();
    const inside = [];
    for (let i = 0; i < 8; i++) {
        await page.keyboard.press("Tab");
        inside.push(await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]'))));
    }
    report.push(`foco atrapado en resumen tras 8 Tab: ${inside.every(Boolean)}`);
    await page.keyboard.press("Escape");
    report.push(`Escape cierra resumen: ${(await page.getByRole("dialog").count()) === 0}, foco vuelve a: ${await focusedDescription()}`);

    // Configuración: interruptores con role=switch
    await page.getByRole("button", { name: "Configuración" }).click();
    await page.waitForTimeout(400);
    const switches = await page.getByRole("switch").evaluateAll((els) => els.map((el) => `${el.getAttribute("aria-label")}=${el.getAttribute("aria-checked")}`));
    report.push(`interruptores: ${switches.join(", ")}`);
    await page.screenshot({ path: `${OUT}/09-settings-open.png` });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/10-settings-closed.png` });
    report.push(`errores teclado: ${JSON.stringify(errors)}`);
    await context.close();
}

// 7. Usabilidad: deshacer, quitar puntuación, confirmaciones propias, copiar día y atajos
{
    const { page, context, errors } = await newPage(browser);
    const valueOf = (name) => page.getByRole("slider", { name }).getAttribute("aria-valuetext");
    const box = await page.locator("svg.select-none").boundingBox();

    // Clic en un anillo concreto de «Familia» (sector 0) y deshacer
    const before = await valueOf("Familia");
    const p = await sectorPoint(page, 0, 8, 0.45);
    await page.mouse.click(p.x, p.y);
    const afterClick = await valueOf("Familia");
    const toastText = await page.getByRole("status").filter({ hasText: "Familia" }).textContent();
    await page.screenshot({ path: `${OUT}/11-toast-undo.png` });
    await page.getByRole("button", { name: "Deshacer" }).click();
    report.push(`clic rueda: ${before} → ${afterClick} (aviso «${toastText?.replace("Deshacer", "").replace("✕", "").trim()}») → deshacer: ${await valueOf("Familia")}`);

    // Mismo anillo dos veces = quitar puntuación
    await page.mouse.click(p.x, p.y);
    await page.mouse.click(p.x, p.y);
    report.push(`mismo anillo dos veces: ${await valueOf("Familia")}`);

    // Borrar sector desde Configuración: diálogo propio, cancelar, borrar y deshacer
    await page.getByRole("button", { name: "Configuración" }).click();
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Eliminar: Salud" }).click();
    const alert = page.getByRole("alertdialog");
    report.push(`diálogo de confirmación: ${await alert.isVisible()} · foco en: ${await page.evaluate(() => document.activeElement?.textContent)}`);
    await page.screenshot({ path: `${OUT}/12-confirm-dialog.png` });
    await page.keyboard.press("Escape");
    report.push(`Escape cancela: sector sigue = ${await page.getByRole("button", { name: "Eliminar: Salud" }).count() === 1}`);
    await page.getByRole("button", { name: "Eliminar: Salud" }).click();
    await alert.getByRole("button", { name: "Eliminar" }).click();
    const deleted = await page.getByRole("button", { name: "Eliminar: Salud" }).count() === 0;
    await page.getByRole("button", { name: "Deshacer" }).click();
    report.push(`borrar sector: ${deleted} → deshacer lo recupera: ${await page.getByRole("button", { name: "Eliminar: Salud" }).count() === 1}`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);

    // Atajos de teclado: ← cambia de día; en un día vacío aparece «Igual que…»
    await page.evaluate(() => document.activeElement?.blur?.());
    const dateLabel = page.getByRole("button", { name: /^Seleccionar fecha/ });
    const today = await dateLabel.textContent();
    // El seed deja huecos cada 6 días empezando en «hace 3 días»
    for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowLeft");
    const gapDay = await dateLabel.textContent();
    const copyButton = page.getByRole("button", { name: /^Igual que el/ });
    report.push(`← ×3: ${today} → ${gapDay} · botón copiar visible: ${await copyButton.isVisible()} (${await copyButton.textContent()})`);
    await page.screenshot({ path: `${OUT}/13-copy-previous.png` });
    await copyButton.click();
    report.push(`tras copiar, Familia = ${await valueOf("Familia")} · botón oculto: ${!(await copyButton.isVisible())}`);
    await page.keyboard.press("t");
    report.push(`T vuelve a hoy: ${(await dateLabel.textContent()) === today}`);

    // El cursor con zoom 1 es de puntero (sin arrastre)
    report.push(`cursor con zoom 1: ${await page.locator("svg.select-none").evaluate((el) => getComputedStyle(el).cursor)}`);
    report.push(`errores usabilidad: ${JSON.stringify(errors)}`);
    void box;
    await context.close();
}

// 8. Primera visita: idioma y tema del sistema
{
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "de-DE", colorScheme: "dark" });
    const page = await context.newPage();
    await page.goto(URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector("svg");
    const theme = await page.evaluate(() => document.documentElement.dataset.theme);
    report.push(`primera visita de-DE + oscuro: «${await page.getByRole("button", { name: "Heute" }).textContent()}» · tema ${theme} · sectores: ${await page.getByRole("slider").first().getAttribute("aria-label")}`);
    await page.screenshot({ path: `${OUT}/14-first-visit-de-dark.png` });
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
