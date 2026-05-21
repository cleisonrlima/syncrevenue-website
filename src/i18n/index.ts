import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en/translation.json'
import ptBR from './locales/pt-BR/translation.json'
import es from './locales/es/translation.json'

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      'pt-BR': { translation: ptBR },
      es: { translation: es },
    },
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: ['en', 'pt-BR', 'es'],
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupQuerystring: 'lng',
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })

export default i18next
