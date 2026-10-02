# Roadmap — Día a día (rueda mental)

Roadmap por hitos surgido de la revisión completa del proyecto (octubre 2026).
Cada hito se desarrolla en su propia rama y se fusiona a `main` (producción) solo cuando está revisado.

Leyenda: `[ ]` pendiente · `[x]` hecho

---

## Hito 1 — Correcciones y limpieza ✅

Arreglos de bugs reales y deuda técnica rápida. Alto impacto, bajo riesgo.

### Bugs
- [x] **Fechas y zona horaria**: `new Date("YYYY-MM-DD")` se interpreta en UTC. Al oeste de Greenwich (Latinoamérica, Brasil) el botón `<` salta 2 días, `>` no avanza, el día de la semana de las estadísticas se desplaza, las etiquetas muestran un día menos y la racha queda en 0. Crear `parseDateInput` en `shared/utils/date.ts` y usarlo en todas partes.
- [x] **Días vacíos cuentan como datos**: visitar una fecha crea `{}` en `scoresByDate`; eso suma en «días registrados», en la racha y mete medias 0 en las gráficas.
- [x] **Slider del menú contextual**: usa `defaultValue` + `onMouseUp`, no guarda con teclado ni se sincroniza con el campo numérico.
- [x] **Contador de caracteres del comentario** no se actualiza al escribir.
- [x] **Menú contextual siempre oscuro** (`bg-neutral-800/90` fijo) aunque el tema sea claro.
- [x] **Tutorial bloqueable**: depende de `sectors[3]`; con menos de 4 sectores no avanza y no se puede saltar.
- [x] **Borrar sector desde Configuración** sin confirmación (borra su historial).
- [x] **Importar JSON** sobrescribe todo sin confirmar y sin validar la estructura.
- [x] **Heatmap** usa solo fechas registradas en vez de días de calendario; los huecos desaparecen.
- [x] **Tildes y caracteres especiales** ausentes en las traducciones (es, pt, de) y en los sectores por defecto.

### Limpieza
- [x] Eliminar código muerto: input de color oculto en `App.tsx`, `App.css`, `react.svg`, `vite.svg`, CSS de plantilla de Vite en `index.css`.
- [x] `onKeyPress` (obsoleto) → `onKeyDown`; `genId` con `crypto.randomUUID()`.
- [x] `index.html`: `lang="es"`, `type="image/png"` en el favicon.
- [x] Unificar la validación de `statsVisibility` (duplicada en `App.tsx` y en storage).

### Calidad
- [x] Añadir Vitest y tests de fechas (varias zonas horarias), `sectorUtils`, `buildStatsData`, copias de seguridad, traducciones y `scoreScale`.
- [x] CI: ejecutar lint y tests en las PR.
- [x] README con descripción, scripts y estructura.
- [x] Script `npm run visual-check` (Playwright) con capturas y comprobaciones en navegador real.

---

## Hito 2 — Accesibilidad básica ✅

- [x] Cajón de configuración cerrado con `inert` (ahora es navegable con Tab y visible para lectores de pantalla estando oculto; además su sombra asoma por el borde derecho).
- [x] Modales con `role="dialog"`, `aria-modal`, `aria-labelledby`, trampa de foco, devolución del foco y cierre con Esc.
- [x] Nombre accesible en botones de solo icono (cerrar, tema…); interruptores con `role="switch"` + `aria-checked`; emojis con `aria-hidden`.
- [x] `<label htmlFor>` en los textarea del resumen y en los nombres de sector.
- [x] Rueda operable con teclado y lector de pantalla (cada sector como `role="slider"`, flechas para puntuar).
- [x] Tamaños mínimos: textos ≥ 12 px, objetivos táctiles ≥ 24 px.
- [x] Respetar `prefers-reduced-motion` (aviso de fecha futura con `animate-pulse`).
- [x] Revisar contrastes en ambos temas (texto secundario en modo oscuro, tutorial, números de los anillos).
- [x] Calendario: nombre completo de cada día, `aria-current` en hoy, `aria-pressed` en el seleccionado.
- [x] Burbujas del tutorial anunciadas con `role="status"`.

---

## Hito 3 — Usabilidad ✅

- [x] Diálogos y avisos propios (temáticos y traducidos) en lugar de `confirm()` / `alert()`.
- [x] «Deshacer» tras puntuar con clic, borrar sector, resetear el día, importar o copiar un día.
- [x] Poder dejar un sector a 0 desde la rueda (clic de nuevo en la misma puntuación).
- [x] Mostrar la puntuación de cada sector en la rueda (junto a su nombre).
- [x] Botón «Igual que el…» (copia el último día con puntuaciones cuando el día actual está vacío).
- [x] Atajos de teclado: `←` / `→` cambiar de día, `T` hoy, `Esc` cerrar.
- [x] Desactivar el arrastre (pan) con zoom 1 para no confundir con «clic para puntuar».
- [x] Detectar el idioma del navegador en la primera visita.
- [x] Tema inicial según `prefers-color-scheme`.
- [ ] Decidir si la «Media del día» del panel debe ignorar los sectores sin puntuar (como ya hacen las estadísticas).

---

## Hito 4 — Refactor y sistema visual ✅

- [x] Dividir `App.tsx` (821 → ~440 líneas): `useMentalWheelData`, `usePreferences`, `useGlobalShortcuts` (en `src/app/`) y geometría pura en `wheelGeometry.ts`.
- [x] Tema con variante `dark:` de Tailwind / variables CSS en vez del objeto `theme` por props (la variante ya existe vía `data-theme`; la usan los avisos y la confirmación).
- [x] Reducir props de `SettingsDrawer`: ahora es un contenedor y App compone las secciones.
- [x] Interacciones de la rueda con Pointer Events y estado de pan en refs.
- [x] Paleta de gráficas validada para daltonismo en ambos temas; leyendas en color de texto; sin animaciones con movimiento reducido.
- [x] Heatmap: distinguir «sin datos» de «media muy baja» (hoy comparten color).
- [x] Tutorial con color menos alarmante (índigo, hecho en el hito 2).
- [x] Tutorial: en lugar de flecha, se resalta el elemento señalado (sector en la rueda, botón del resumen).
- [x] Ajustar contraste de los fondos (claro más luminoso, oscuro más contrastado).
- [x] «Rueda fantasma»: contorno discontinuo del último día registrado (desactivable en Configuración).
- [x] Optimizar el favicon (70 KB → 3 KB) y añadir icono para iOS, descripción y color de tema.
- [x] Banderas del selector de idioma sustituidas por el código de idioma (las banderas son de países, no de idiomas).
- [x] Zoom con la rueda del ratón sin error de listener pasivo; importar JSON accesible con teclado.

---

## Hito 5 — Nuevas funciones

- [ ] PWA instalable y offline (`vite-plugin-pwa`).
- [ ] Protección de datos: `navigator.storage.persist()` y recordatorio periódico de copia de seguridad.
- [ ] Teléfonos SOS según idioma/país (verificar cada número antes de publicar).
- [ ] Archivar sectores en lugar de borrarlos, conservando su historial.
- [ ] Vista de diario: listar y buscar resúmenes y comentarios pasados.
- [ ] Exportar CSV / informe imprimible.
- [ ] Estado de ánimo o emociones generales del día.
