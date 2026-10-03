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
        // El selector de estilo de bienvenida se prueba aparte (bloque 13)
        if (data.stylePicker !== false) localStorage.setItem("mental-wheel-style-picker-done-v1", String(Date.now()));
    };
}

async function newPage(browser, opts = {}, ctxOpts = {}) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...ctxOpts });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(URL);
    await page.evaluate(seed(opts), { dark: false, tutorialShown: true, stylePicker: true, sectors: config, scores, ...opts });
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
    await page.waitForTimeout(2000); // animación de entrada de las gráficas
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
    await page.getByTitle("Día anterior (←)", { exact: true }).click();
    const prev = await label.textContent();
    await page.getByTitle("Día siguiente (→)", { exact: true }).click();
    await page.getByTitle("Día siguiente (→)", { exact: true }).click();
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
    // Pestañas: la inicial es Sectores; flechas cambian de pestaña
    await page.getByRole("tab", { name: "Sectores" }).focus();
    await page.keyboard.press("ArrowRight");
    report.push(`pestañas: ${await page.getByRole("tab").allInnerTexts().then((x) => x.join(" / "))} · tras → seleccionada: ${await page.getByRole("tab", { selected: true }).innerText()}`);
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

    // Clic en un anillo de «Familia»: puntúa sin aviso; repetirlo quita la nota con aviso y deshacer
    const before = await valueOf("Familia");
    const p = await sectorPoint(page, 0, 8, 0.45);
    await page.mouse.click(p.x, p.y);
    const afterClick = await valueOf("Familia");
    const toastsAfterScore = await page.getByRole("status").filter({ hasText: "Deshacer" }).count();
    await page.mouse.click(p.x, p.y);
    const cleared = await valueOf("Familia");
    const toastText = await page.getByRole("status").filter({ hasText: "Familia" }).textContent();
    await page.screenshot({ path: `${OUT}/11-toast-undo.png` });
    await page.getByRole("button", { name: "Deshacer" }).click();
    report.push(`clic rueda: ${before} → ${afterClick} (avisos al puntuar: ${toastsAfterScore}) → mismo anillo: ${cleared} (aviso «${toastText?.replace("Deshacer", "").replace("✕", "").trim()}») → deshacer: ${await valueOf("Familia")}`);

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

// 9. Copia de seguridad: exportar, modificar e importar
{
    const { page, context, errors } = await newPage(browser, {}, { acceptDownloads: true });
    await page.getByRole("button", { name: "Configuración" }).click();
    await page.waitForTimeout(400);
    await page.getByRole("tab", { name: "Datos" }).click();
    const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: "Exportar JSON" }).click(),
    ]);
    const backupPath = `${OUT}/backup-test.json`;
    await download.saveAs(backupPath);

    // Borrar «Ocio» y luego importar la copia: debe volver
    await page.getByRole("tab", { name: "Sectores" }).click();
    await page.getByRole("button", { name: "Eliminar: Ocio" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar" }).click();
    const afterDelete = await page.getByRole("button", { name: "Eliminar: Ocio" }).count();
    await page.getByRole("tab", { name: "Datos" }).click();
    await page.locator('input[type="file"]').setInputFiles(backupPath);
    await page.getByRole("alertdialog").getByRole("button", { name: "Importar JSON" }).click();
    await page.waitForTimeout(200);
    await page.getByRole("tab", { name: "Sectores" }).click();
    const restored = await page.getByRole("button", { name: "Eliminar: Ocio" }).count();
    report.push(`copia: descargada ${download.suggestedFilename()} · tras borrar Ocio: ${afterDelete} · tras importar: ${restored}`);

    // Un archivo inválido muestra un aviso de error
    await page.getByRole("tab", { name: "Datos" }).click();
    await page.locator('input[type="file"]').setInputFiles({ name: "malo.json", mimeType: "application/json", buffer: Buffer.from("{nope") });
    report.push(`archivo inválido → aviso: ${await page.getByRole("alert").textContent()}`);
    report.push(`errores copia: ${JSON.stringify(errors)}`);
    await context.close();
}

// 10. Gestos: toque, pulsación larga, zoom con rueda y arrastre
{
    const { page, context, errors } = await newPage(browser, {}, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const valueOf = (name) => page.getByRole("slider", { name }).getAttribute("aria-valuetext");
    const cdp = await context.newCDPSession(page);
    const touch = (type, x, y) => cdp.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: type === "touchEnd" ? [] : [{ x, y }],
    });

    const p = await sectorPoint(page, 0, 8, 0.75);
    const before = await valueOf("Familia");
    await page.touchscreen.tap(p.x, p.y);
    report.push(`toque: Familia ${before} → ${await valueOf("Familia")}`);

    const q = await sectorPoint(page, 4, 8, 0.5); // «Trabajo»
    const trabajoBefore = await valueOf("Trabajo");
    await touch("touchStart", q.x, q.y);
    await page.waitForTimeout(800);
    await touch("touchEnd", q.x, q.y);
    await page.waitForTimeout(150);
    const dialog = page.getByRole("dialog");
    report.push(`pulsación larga: menú de «${await dialog.getAttribute("aria-label")}» · puntuación sin cambios: ${trabajoBefore === await valueOf("Trabajo")}`);
    await page.keyboard.press("Escape");
    await context.close();

    // Escritorio: rueda del ratón y arrastre
    const desk = await newPage(browser);
    const svg = desk.page.locator("svg.select-none");
    const box = await svg.boundingBox();
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    // Arrastre con zoom 1: no mueve la rueda ni puntúa
    const familiaBefore = await desk.page.getByRole("slider", { name: "Familia" }).getAttribute("aria-valuetext");
    await desk.page.mouse.move(centerX + 40, centerY - 120);
    await desk.page.mouse.down();
    await desk.page.mouse.move(centerX + 140, centerY - 60, { steps: 5 });
    await desk.page.mouse.up();
    const transform1 = await desk.page.locator("svg.select-none > g").getAttribute("transform");
    report.push(`arrastre con zoom 1: sin desplazamiento = ${transform1?.startsWith("translate(260 260) scale(1)")} · sin puntuar = ${familiaBefore === await desk.page.getByRole("slider", { name: "Familia" }).getAttribute("aria-valuetext")}`);
    // Zoom con la rueda del ratón
    await desk.page.mouse.move(centerX, centerY);
    await desk.page.mouse.wheel(0, -300);
    await desk.page.waitForTimeout(100);
    const resetVisible = await desk.page.getByRole("button", { name: "Resetear zoom" }).isVisible();
    await desk.page.mouse.down();
    await desk.page.mouse.move(centerX + 80, centerY + 40, { steps: 5 });
    await desk.page.mouse.up();
    const transform2 = await desk.page.locator("svg.select-none > g").getAttribute("transform");
    report.push(`rueda del ratón → botón resetear zoom: ${resetVisible} · arrastre con zoom desplaza: ${transform2 !== transform1} (${transform2})`);
    await desk.page.getByRole("button", { name: "Resetear zoom" }).click();
    report.push(`errores gestos: ${JSON.stringify([...errors, ...desk.errors])}`);
    await desk.context.close();
}

// 11. Iconos: asignación por defecto y selector
{
    const { page, context, errors } = await newPage(browser);
    const storedIcon = (id) => page.evaluate((id) => JSON.parse(localStorage.getItem("mental-wheel-config-v1")).find((s) => s.id === id)?.icon, id);
    report.push(`icono por defecto de Familia: ${await storedIcon("s0")}`);

    const p = await sectorPoint(page, 0);
    await page.mouse.click(p.x, p.y, { button: "right" });
    await page.getByRole("button", { name: "Elegir icono: Familia" }).click();
    const picker = page.getByRole("dialog", { name: /Icono de/ });
    report.push(`selector abierto: ${await picker.isVisible()} · foco en búsqueda: ${await page.evaluate(() => document.activeElement?.getAttribute("type"))}`);
    await page.screenshot({ path: `${OUT}/15-icon-picker.png` });

    await page.keyboard.press("Escape");
    report.push(`Escape cierra solo el selector: selector=${await picker.count()} · menú sigue=${await page.getByRole("dialog", { name: "Familia" }).count()}`);

    await page.getByRole("button", { name: "Elegir icono: Familia" }).click();
    await page.getByRole("searchbox").fill("estrella");
    await picker.getByRole("button", { name: "favorito" }).click();
    report.push(`tras elegir «estrella»: ${await storedIcon("s0")}`);
    await page.getByRole("button", { name: "Elegir icono: Familia" }).click();
    await picker.getByRole("button", { name: "Sin icono" }).click();
    report.push(`tras «Sin icono»: «${await storedIcon("s0")}»`);
    report.push(`errores iconos: ${JSON.stringify(errors)}`);
    await context.close();
}

// 12. Estilos visuales: elegir, aplicar y persistir
{
    const { page, context, errors } = await newPage(browser);
    await page.getByRole("button", { name: "Configuración" }).click();
    await page.waitForTimeout(400);
    await page.getByRole("tab", { name: "Apariencia" }).click();
    const styleOf = () => page.evaluate(() => `${document.documentElement.dataset.style}/${document.documentElement.dataset.theme}`);
    report.push(`estilo inicial: ${await styleOf()}`);
    for (const name of ["Aurora", "Playa", "Rock", "Montaña"]) {
        await page.getByRole("button", { name, exact: true }).click();
        report.push(`«${name}» → ${await styleOf()} · pulsado: ${await page.getByRole("button", { name, exact: true }).getAttribute("aria-pressed")}`);
    }
    const bgOf = () => page.evaluate(() => document.documentElement.dataset.bgImage);
    const photoSwitch = page.getByRole("switch", { name: "Fondo con imagen" });
    report.push(`fondo con imagen por defecto: ${await bgOf()} (interruptor: ${await photoSwitch.getAttribute("aria-checked")})`);
    await photoSwitch.click();
    report.push(`tras desactivarlo: ${await bgOf()}`);
    await page.getByRole("button", { name: "Claro", exact: true }).click();
    report.push(`interruptor oculto en «Claro»: ${(await photoSwitch.count()) === 0}`);
    await page.getByRole("button", { name: "Montaña", exact: true }).click();
    await page.reload();
    await page.waitForSelector("svg");
    report.push(`tras recargar: ${await styleOf()} · imagen: ${await bgOf()}`);
    report.push(`errores estilos: ${JSON.stringify(errors)}`);
    await context.close();
}

// 13. Selector de estilo de bienvenida
{
    // Escritorio: vista previa en directo, «Ahora no» y no vuelve a salir
    const { page, context, errors } = await newPage(browser, { stylePicker: false });
    const picker = page.getByRole("dialog", { name: "Elige tu estilo" });
    await picker.waitFor({ timeout: 3000 });
    const live = () => page.evaluate(() => `${document.documentElement.dataset.style} (guardado: ${localStorage.getItem("mental-wheel-style-v1")})`);
    await picker.getByRole("radio", { name: /Aurora/ }).click();
    report.push(`bienvenida: tras pulsar Aurora → ${await live()}`);
    await page.screenshot({ path: `${OUT}/16-style-picker-desktop.png` });
    await picker.getByRole("button", { name: "Ahora no" }).click();
    report.push(`«Ahora no» → ${await live()} · selector cerrado: ${(await picker.count()) === 0}`);
    await page.reload();
    await page.waitForSelector("svg");
    await page.waitForTimeout(1000);
    report.push(`tras recargar, selector visible: ${await picker.count() > 0}`);
    report.push(`errores bienvenida: ${JSON.stringify(errors)}`);
    await context.close();

    // Móvil: carrusel deslizable y confirmar
    const mobile = await newPage(browser, { stylePicker: false }, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const mPicker = mobile.page.getByRole("dialog", { name: "Elige tu estilo" });
    await mPicker.waitFor({ timeout: 3000 });
    await mobile.page.waitForTimeout(500);
    await mobile.page.getByRole("radiogroup").evaluate((el) => { el.scrollLeft += el.clientWidth * 0.7 * 3; });
    await mobile.page.waitForTimeout(600);
    const chosen = await mPicker.getByRole("radio", { checked: true }).getAttribute("data-style");
    await mobile.page.screenshot({ path: `${OUT}/17-style-picker-mobile.png` });
    await mPicker.getByRole("button", { name: /^Usar / }).click();
    const saved = await mobile.page.evaluate(() => localStorage.getItem("mental-wheel-style-v1"));
    report.push(`móvil: tras deslizar → ${chosen} · confirmado y guardado: ${saved}`);
    report.push(`errores bienvenida móvil: ${JSON.stringify(mobile.errors)}`);
    await mobile.context.close();
}

// 14. SOS por país
{
    const { page, context, errors } = await newPage(browser, {}, { locale: "es-ES" });
    await page.getByRole("button", { name: "Ayuda SOS" }).click();
    const sos = page.getByRole("dialog", { name: "Números y servicios de urgencia" });
    const country = sos.locator("select:visible");
    const numbers = () => sos.getByRole("link").allInnerTexts();
    report.push(`SOS por defecto (es-ES): ${await country.inputValue()} → ${(await numbers()).join(", ")}`);
    await country.selectOption("CL");
    report.push(`SOS Chile: ${(await numbers()).join(", ")}`);
    await page.screenshot({ path: `${OUT}/18-sos-chile.png` });
    await country.selectOption("OTHER");
    report.push(`SOS otro país: ${(await numbers()).join(", ")} · texto: ${(await sos.getByText("número de emergencias de tu país").count()) > 0}`);
    await page.keyboard.press("Escape");
    await page.reload();
    await page.waitForSelector("svg");
    await page.getByRole("button", { name: "Ayuda SOS" }).click();
    report.push(`SOS recuerda el país elegido: ${await page.getByRole("dialog", { name: "Números y servicios de urgencia" }).locator("select:visible").inputValue()}`);
    report.push(`errores SOS: ${JSON.stringify(errors)}`);
    await context.close();

    // Por defecto España aunque el navegador sea de otro país; en móvil el selector va abajo
    const mx = await newPage(browser, {}, { locale: "es-MX", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const sosButton = mx.page.getByRole("button", { name: "Ayuda SOS" });
    if (await sosButton.isVisible()) {
        await sosButton.click();
    } else {
        await mx.page.getByRole("button", { name: "Configuración" }).first().click();
        await mx.page.waitForTimeout(400);
        await mx.page.getByRole("button", { name: "Abrir SOS" }).click();
    }
    const mobileSelect = mx.page.getByRole("dialog", { name: "Números y servicios de urgencia" }).locator("select:visible");
    const box = await mobileSelect.boundingBox();
    report.push(`SOS móvil (es-MX): ${await mobileSelect.inputValue()} · selector abajo: ${box !== null && box.y > 700}`);
    await mx.page.screenshot({ path: `${OUT}/19-sos-mobile.png` });
    await mx.context.close();
}

// 15. Archivar sectores
{
    const { page, context, errors } = await newPage(browser);
    const labels = () => page.locator("svg.select-none text").allTextContents();
    await page.getByRole("button", { name: "Configuración" }).first().click();
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Archivar: Dinero" }).click();
    const toast = await page.getByText("Sector «Dinero» archivado").count();
    const wheelHasDinero = (await labels()).some((l) => l.includes("Dinero"));
    const restoreVisible = await page.getByRole("button", { name: "Recuperar: Dinero" }).count();
    report.push(`archivar: aviso ${toast > 0} · fuera de la rueda: ${!wheelHasDinero} · en «Archivados»: ${restoreVisible > 0}`);
    // Mover «Amigos» abajo salta el archivado y queda tras «Amor»
    await page.getByRole("button", { name: "Bajar: Amigos" }).click();
    const order = await page.evaluate(() => JSON.parse(localStorage.getItem("mental-wheel-config-v1")).filter((s) => !s.archived).map((s) => s.name).join(", "));
    report.push(`orden tras bajar Amigos: ${order}`);
    await page.screenshot({ path: `${OUT}/20-archived-settings.png` });
    // Historial intacto y visible en estadísticas
    const kept = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem("mental-wheel-scores-v1"))).filter((d) => d.s2).length);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Estadísticas" }).first().click();
    const progress = page.locator("select").filter({ has: page.locator("optgroup") });
    await progress.waitFor({ timeout: 5000 });
    await progress.selectOption({ label: "Dinero" });
    report.push(`historial conservado: ${kept} días · en estadísticas (archivados): ${await progress.inputValue()}`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    // Recuperar
    await page.getByRole("button", { name: "Configuración" }).first().click();
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Recuperar: Dinero" }).click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    report.push(`recuperado en la rueda: ${(await labels()).some((l) => l.includes("Dinero"))}`);
    report.push(`errores archivar: ${JSON.stringify(errors)}`);
    await context.close();
}

// 16. Diario: listar, buscar, filtrar e ir a un día
{
    async function seedJournal(page) {
        await page.evaluate(() => {
            const day = (back) => {
                const d = new Date(); d.setDate(d.getDate() - back);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            };
            localStorage.setItem("mental-wheel-daily-summary-v1", JSON.stringify({
                [day(0)]: { good: "Paseo largo por el monte con el perro", bad: "Dormí poco", howFacedBad: "Siesta corta", mood: 4 },
                [day(1)]: { good: "", bad: "Discusión en el trabajo", howFacedBad: "Lo hablé con calma al día siguiente", mood: 2 },
                [day(40)]: { good: "Cena con amigos", bad: "", howFacedBad: "" },
            }));
            localStorage.setItem("mental-wheel-comments-v1", JSON.stringify({
                [day(1)]: { s4: "Reunión tensa", s0: "Llamé a mamá" },
                [day(5)]: { s6: "Canción nueva en la guitarra" },
            }));
        });
        await page.reload();
        await page.waitForSelector("svg");
    }
    const { page, context, errors } = await newPage(browser);
    await seedJournal(page);
    await page.getByRole("button", { name: "Diario" }).click();
    const journal = page.getByRole("dialog", { name: "Diario" });
    const days = () => journal.locator("article h3").allInnerTexts();
    report.push(`diario: ${(await days()).length} días · foco en buscar: ${await page.evaluate(() => document.activeElement?.getAttribute("type"))}`);
    await page.screenshot({ path: `${OUT}/23-journal.png` });
    await journal.getByRole("searchbox").fill("cancion");
    await page.waitForTimeout(200);
    report.push(`buscar «cancion»: ${(await days()).length} día(s) · resaltado: ${await journal.locator("mark").first().innerText()}`);
    await journal.getByRole("searchbox").fill("trabajo");
    await page.waitForTimeout(200);
    report.push(`buscar «trabajo» (texto o sector): ${(await days()).length} día(s)`);
    await journal.getByRole("searchbox").fill("");
    await journal.getByRole("button", { name: "Comentarios" }).click();
    report.push(`filtro comentarios: ${(await days()).length} días`);
    await journal.getByRole("button", { name: "Todo" }).click();
    await journal.getByRole("button", { name: "Editar resumen" }).nth(1).click();
    const summary = page.getByRole("dialog", { name: "Resumen de mi día" });
    report.push(`editar resumen de ayer: ${await summary.getByLabel("Lo malo", { exact: true }).inputValue()}`);
    report.push(`errores diario: ${JSON.stringify(errors)}`);
    await context.close();

    const mobile = await newPage(browser, {}, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await seedJournal(mobile.page);
    await mobile.page.getByRole("button", { name: "Diario" }).click();
    await mobile.page.waitForTimeout(300);
    await mobile.page.screenshot({ path: `${OUT}/24-journal-mobile.png` });
    await mobile.page.keyboard.press("Escape");
    await mobile.page.screenshot({ path: `${OUT}/25-nav-mobile.png` });
    await mobile.context.close();

    const empty = await newPage(browser);
    await empty.page.getByRole("button", { name: "Diario" }).click();
    report.push(`diario vacío: ${(await empty.page.getByText("Tu diario está vacío").count()) > 0}`);
    await empty.context.close();
}

// 5. Móvil
{
    const { page, context } = await newPage(browser, {}, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await page.screenshot({ path: `${OUT}/07-mobile.png` });
    await context.close();
}

await browser.close();
console.log(report.join("\n"));
