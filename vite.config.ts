import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { existsSync } from 'node:fs'
import type { Plugin } from 'vite'

/**
 * Convierte `import { House, Users } from "lucide-react"` en importaciones directas de cada icono.
 * Importar el paquete entero obliga a Vite a transformar sus ~6000 módulos (builds de minutos);
 * así solo se procesan los iconos usados. Si un icono no tiene archivo, se deja la importación original.
 */
function lucideDirectImports(): Plugin {
  const iconsDir = 'node_modules/lucide-react/dist/esm/icons/'
  const toFile = (name: string) =>
    name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([a-zA-Z])(\d)/g, '$1-$2').toLowerCase()
  return {
    name: 'lucide-direct-imports',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('node_modules') || !/\.[jt]sx?$/.test(id) || !code.includes('lucide-react')) return null
      const result = code.replace(/import\s*\{([^}]+)\}\s*from\s*["']lucide-react["'];?/g, (statement, specifiers: string) => {
        const direct: string[] = []
        const kept: string[] = []
        for (const raw of specifiers.split(',').map((s) => s.trim()).filter(Boolean)) {
          if (raw.startsWith('type ')) continue
          const [imported, local = imported] = raw.split(/\s+as\s+/)
          const file = toFile(imported)
          if (existsSync(`${iconsDir}${file}.mjs`)) direct.push(`import ${local} from "lucide-react/dist/esm/icons/${file}.mjs";`)
          else kept.push(raw)
        }
        if (kept.length) direct.push(`import { ${kept.join(', ')} } from "lucide-react";`)
        return direct.join('\n') || statement
      })
      return result === code ? null : { code: result, map: null }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    lucideDirectImports(),
    react(),
    tailwind(),
    VitePWA({
      // La app avisa de la nueva versión y el usuario decide cuándo actualizar
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Día a día',
        short_name: 'Día a día',
        description: 'Rueda diaria de bienestar: puntúa las áreas de tu vida, añade notas y consulta tu evolución. Tus datos se quedan en tu dispositivo.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#e5e5e5',
        theme_color: '#4f46e5',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Todo lo necesario para funcionar sin conexión (incluidas tipografías y fondos)
        globPatterns: ['**/*.{js,css,html,png,webp,svg,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
