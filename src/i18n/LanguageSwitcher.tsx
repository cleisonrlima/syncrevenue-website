import { useEffect, useRef, useState } from 'react'
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
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const activeLocale = LOCALES.find(item => item.code === locale) ?? LOCALES[0]

  const handleChange = (newLocale: Locale) => {
    i18next.changeLanguage(newLocale)
    useLocaleStore.setState({ locale: newLocale })
    setIsOpen(false)
    try {
      localStorage.setItem('i18nextLng', newLocale)
    } catch {
      // private browsing or quota exceeded — locale change still applies in-session
    }
  }

  useEffect(() => {
    if (!isOpen) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label="Select language"
      className={cn('relative inline-flex items-center', className)}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen(open => !open)}
        className={cn(
          'inline-flex min-h-[44px] min-w-[58px] items-center justify-center gap-2 rounded px-2 py-1 text-sm font-semibold text-white transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 lg:min-h-0',
          'after:block after:h-[7px] after:w-[7px] after:rotate-45 after:border-b-[1.5px] after:border-r-[1.5px] after:border-current after:content-[""]',
        )}
      >
        {activeLocale.label}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Available languages"
          className="absolute right-0 top-[calc(100%+8px)] z-[60] min-w-[96px] rounded-[8px] border border-[var(--line)] bg-[rgba(8,8,32,0.98)] p-1 shadow-lg backdrop-blur-md"
        >
          {LOCALES.map(({ code, label }) => (
            <button
              key={code}
              type="button"
              role="menuitemradio"
              aria-checked={locale === code}
              onClick={() => handleChange(code)}
              className={cn(
                'flex min-h-[40px] w-full items-center rounded px-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                locale === code
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
