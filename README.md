# Día a día — rueda mental

Web de autoayuda y regulación emocional. Cada día puntúas del 1 al 10 distintas áreas de tu vida (familia, salud, trabajo…) sobre una rueda, añades notas y un resumen del día, y consultas tu evolución en estadísticas.

- **Privada**: todos los datos se guardan solo en el navegador (`localStorage`); no hay servidor ni analítica.
- **Copias de seguridad**: exportar/importar JSON desde Configuración → Datos.
- **Idiomas**: español, inglés, portugués y alemán.
- **SOS**: acceso rápido a teléfonos de emergencia y apoyo emocional.

## Desarrollo

Requiere Node 20.19 o superior.

```bash
npm install
npm run dev       # servidor de desarrollo
npm test          # tests (Vitest)
npm run lint      # ESLint
npm run build     # comprobación de tipos + build de producción en dist/
npm run preview   # sirve el build localmente
```

## Estructura

```
src/
  App.tsx                 Componente raíz: estado, persistencia y composición
  features/
    wheel/                Rueda SVG e interacciones (clic, zoom, pan, pulsación larga)
    sectors/              Menú contextual y utilidades de sectores
    stats/                Modal de estadísticas (carga diferida) y cálculo de datos
    summary/              Resumen diario
    settings/             Cajón de configuración y sus secciones
    support/              Modal SOS
    tutorial/             Tutorial interactivo
  shared/
    i18n/                 Traducciones y contexto de idioma
    services/storage/     Lectura/escritura en localStorage
    services/io/          Validación de copias de seguridad
    utils/                Fechas, escala de puntuación, colores
```

Las fechas se guardan como `YYYY-MM-DD` en hora local; usa `parseDateInput` / `addDaysToDateInput` de `shared/utils/date.ts` en lugar de `new Date("YYYY-MM-DD")`, que interpreta la fecha en UTC.

## Despliegue

Firebase Hosting mediante GitHub Actions:

- **Push a `main`** → lint, tests, build y despliegue a producción.
- **Pull request** → lint, tests, build y despliegue a un canal de previsualización (no toca producción).

## Roadmap

Ver [docs/roadmaps/roadmap.md](docs/roadmaps/roadmap.md).
