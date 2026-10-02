# Roadmap — Día a día (rueda mental)

Roadmap por hitos surgido de la revisión completa del proyecto (octubre 2026).
Cada hito se desarrolla en su propia rama y se fusiona a `main` (producción) solo cuando está revisado.

Leyenda: `[ ]` pendiente · `[x]` hecho

---

## Hito 1 — Correcciones y limpieza

Arreglos de bugs reales y deuda técnica rápida. Alto impacto, bajo riesgo.

### Bugs
- [ ] **Fechas y zona horaria**: `new Date("YYYY-MM-DD")` se interpreta en UTC. Al oeste de Greenwich (Latinoamérica, Brasil) el botón `<` salta 2 días, `>` no avanza, el día de la semana de las estadísticas se desplaza, las etiquetas muestran un día menos y la racha queda en 0. Crear `parseDateInput` en `shared/utils/date.ts` y usarlo en todas partes.
- [ ] **Días vacíos cuentan como datos**: visitar una fecha crea `{}` en `scoresByDate`; eso suma en «días registrados», en la racha y mete medias 0 en las gráficas.
- [ ] **Slider del menú contextual**: usa `defaultValue` + `onMouseUp`, no guarda con teclado ni se sincroniza con el campo numérico.
- [ ] **Contador de caracteres del comentario** no se actualiza al escribir.
- [ ] **Menú contextual siempre oscuro** (`bg-neutral-800/90` fijo) aunque el tema sea claro.
- [ ] **Tutorial bloqueable**: depende de `sectors[3]`; con menos de 4 sectores no avanza y no se puede saltar.
- [ ] **Borrar sector desde Configuración** sin confirmación (borra su historial).
- [ ] **Importar JSON** sobrescribe todo sin confirmar y sin validar la estructura.
- [ ] **Heatmap** usa solo fechas registradas en vez de días de calendario; los huecos desaparecen.
- [ ] **Tildes y caracteres especiales** ausentes en las traducciones (es, pt, de) y en los sectores por defecto.

### Limpieza
- [ ] Eliminar código muerto: input de color oculto en `App.tsx`, `App.css`, `react.svg`, `vite.svg`, CSS de plantilla de Vite en `index.css`.
- [ ] `onKeyPress` (obsoleto) → `onKeyDown`; `genId` con `crypto.randomUUID()`.
- [ ] `index.html`: `lang="es"`, `type="image/png"` en el favicon.
- [ ] Unificar la validación de `statsVisibility` (duplicada en `App.tsx` y en storage).

### Calidad
- [ ] Añadir Vitest y tests de `scoreScale`, `date`, `sectorUtils` y `buildStatsData`.
- [ ] CI: ejecutar lint y tests en las PR.
- [ ] README con descripción, scripts y estructura.

---

## Hito 2 — Accesibilidad básica

- [ ] Cajón de configuración cerrado con `inert` (ahora es navegable con Tab estando oculto).
- [ ] Modales con `role="dialog"`, `aria-modal`, `aria-labelledby`, trampa de foco, devolución del foco y cierre con Esc.
- [ ] Nombre accesible en botones de solo icono (cerrar, tema…); interruptores con `role="switch"` + `aria-checked`; emojis con `aria-hidden`.
- [ ] `<label htmlFor>` en los textarea del resumen y en los nombres de sector.
- [ ] Rueda operable con teclado y lector de pantalla (cada sector como `role="slider"`, flechas para puntuar).
- [ ] Tamaños mínimos: textos ≥ 12 px, objetivos táctiles ≥ 24 px.
- [ ] Respetar `prefers-reduced-motion` (aviso de fecha futura con `animate-pulse`).
- [ ] Revisar contrastes en ambos temas.

---

## Hito 3 — Usabilidad

- [ ] Diálogos y avisos propios (temáticos y traducidos) en lugar de `confirm()` / `alert()`.
- [ ] «Deshacer» tras puntuar, borrar sector o resetear el día.
- [ ] Poder dejar un sector a 0 desde la rueda.
- [ ] Mostrar la puntuación de cada sector en la rueda (no solo al pasar el ratón).
- [ ] Botón «Igual que ayer».
- [ ] Atajos de teclado: `←` / `→` cambiar de día, `T` hoy, `Esc` cerrar.
- [ ] Desactivar el arrastre (pan) con zoom 1 para no confundir con «clic para puntuar».
- [ ] Detectar el idioma del navegador en la primera visita.
- [ ] Tema inicial según `prefers-color-scheme`.

---

## Hito 4 — Refactor y sistema visual

- [ ] Dividir `App.tsx`: `useMentalWheelData` (estado, persistencia, import/export), `useWheelGeometry`, tema.
- [ ] Tema con variante `dark:` de Tailwind / variables CSS en vez del objeto `theme` por props.
- [ ] Reducir props de `SettingsDrawer` (contexto o reducer).
- [ ] Interacciones de la rueda con Pointer Events y estado de pan en refs.
- [ ] Paleta de gráficas coherente con la app y con los colores de los sectores.
- [ ] Tutorial con color menos alarmante y flecha hacia el elemento señalado.
- [ ] Ajustar contraste del modo claro.
- [ ] «Rueda fantasma»: contorno de ayer o de la media semanal sobre la rueda actual.
- [ ] Optimizar el favicon (70 KB).

---

## Hito 5 — Nuevas funciones

- [ ] PWA instalable y offline (`vite-plugin-pwa`).
- [ ] Protección de datos: `navigator.storage.persist()` y recordatorio periódico de copia de seguridad.
- [ ] Teléfonos SOS según idioma/país (verificar cada número antes de publicar).
- [ ] Archivar sectores en lugar de borrarlos, conservando su historial.
- [ ] Vista de diario: listar y buscar resúmenes y comentarios pasados.
- [ ] Exportar CSV / informe imprimible.
- [ ] Estado de ánimo o emociones generales del día.
