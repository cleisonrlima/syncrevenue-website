import { create } from 'zustand'

export type Locale = 'en' | 'pt-BR' | 'es'

interface LocaleStore {
  locale: Locale
  changeLocale: (locale: Locale) => void
}

export const useLocaleStore = create<LocaleStore>((set) => ({
  locale: 'en',
  changeLocale: (locale) => set({ locale }),
}))
