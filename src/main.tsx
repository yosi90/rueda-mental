import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/themes.css'
// Tipografías de títulos de los estilos, alojadas en la web (solo se descargan si el estilo las usa)
import '@fontsource/cormorant-garamond/latin-600.css'
import '@fontsource/fredoka/latin-600.css'
import '@fontsource/oswald/latin-600.css'
import '@fontsource/bitter/latin-600.css'
import App from './App.tsx'
import { I18nProvider } from './shared/i18n/I18nContext.tsx'
import { FeedbackProvider } from './shared/feedback/FeedbackProvider.tsx'
import { loadAppStyle } from './shared/services/storage/mentalWheelStorage.ts'
import { applyAppStyle } from './shared/theme/styles.ts'

// Antes del primer render, para que el modo oscuro no parpadee en claro al cargar
applyAppStyle(loadAppStyle())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <FeedbackProvider>
        <App />
      </FeedbackProvider>
    </I18nProvider>
  </StrictMode>,
)
