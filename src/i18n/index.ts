import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en/translation.json'
import ptBR from './locales/pt-BR/translation.json'
import es from './locales/es/translation.json'

const SUPPORTED_LANGUAGES = ['en', 'pt-BR', 'es'] as const
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

function isSupportedLanguage(value: string | null): value is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(value as SupportedLanguage)
}

function getInitialLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'en'

  const queryLanguage = new URLSearchParams(window.location.search).get('lng')
  if (isSupportedLanguage(queryLanguage)) {
    return queryLanguage
  }

  try {
    const storedLanguage = window.localStorage.getItem('i18nextLng')
    if (isSupportedLanguage(storedLanguage)) {
      return storedLanguage
    }
  } catch {
    // Fall through to the deterministic default.
  }

  return 'en'
}

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      'pt-BR': { translation: ptBR },
      es: { translation: es },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    supportedLngs: [...SUPPORTED_LANGUAGES],
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
