import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './shared/i18n/I18nContext.tsx'
import { FeedbackProvider } from './shared/feedback/FeedbackProvider.tsx'
import { loadDarkMode } from './shared/services/storage/mentalWheelStorage.ts'

// Antes del primer render, para que el modo oscuro no parpadee en claro al cargar
document.documentElement.dataset.theme = loadDarkMode() ? 'dark' : 'light'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <FeedbackProvider>
        <App />
      </FeedbackProvider>
    </I18nProvider>
  </StrictMode>,
)
