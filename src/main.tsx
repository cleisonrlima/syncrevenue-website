import './i18n'
import i18next from 'i18next'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { useLocaleStore, type Locale } from '@/store/useLocaleStore'

const detectedLang = i18next.language
if ((['en', 'pt-BR', 'es'] as string[]).includes(detectedLang)) {
  useLocaleStore.setState({ locale: detectedLang as Locale })
}

const initialDocumentLanguage = i18next.resolvedLanguage ?? 'en'
document.documentElement.lang = initialDocumentLanguage
i18next.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
})

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element (#root) not found in DOM')

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
