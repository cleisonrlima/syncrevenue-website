import i18next from 'i18next'
import { cn } from '@/lib/utils'
import { useLocaleStore, type Locale } from '@/store/useLocaleStore'

const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'pt-BR', label: 'PT-BR' },
  { code: 'es', label: 'ES' },
]

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { locale } = useLocaleStore()

  const handleChange = (newLocale: Locale) => {
    i18next.changeLanguage(newLocale)
    useLocaleStore.setState({ locale: newLocale })
    try {
      localStorage.setItem('i18nextLng', newLocale)
    } catch {
      // private browsing or quota exceeded — locale change still applies in-session
    }
  }

  return (
    <div role="group" aria-label="Select language" className={cn('flex items-center gap-1', className)}>
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          aria-current={locale === code ? 'true' : undefined}
          onClick={() => handleChange(code)}
          className={cn(
            'inline-flex items-center justify-center px-2 py-1 text-sm font-medium rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1',
            // 44px tap target on mobile (where the language switcher lives inside the
            // hamburger overlay); revert to compact sizing at lg+ where it sits in
            // the desktop navbar alongside the demo CTA.
            'min-h-[44px] min-w-[44px] lg:min-h-0 lg:min-w-0',
            locale === code
              ? 'text-brand-electric-blue font-semibold'
              : 'text-brand-muted hover:text-white'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
