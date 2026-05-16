import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/i18n/LanguageSwitcher'
import GradientButton from '@/components/ui/GradientButton'

export default function Navbar() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const prev = document.body.style.overflow
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia('(min-width: 1024px)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsOpen(false)
    }
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (isOpen) {
      firstLinkRef.current?.focus()
    } else {
      hamburgerRef.current?.focus()
    }
  }, [isOpen])

  const handleDemoCta = () => {
    const el = document.getElementById('demo-scheduler')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.location.hash = 'demo-scheduler'
    }
  }

  const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const overlay = e.currentTarget
    const focusable = overlay.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-brand-navy" aria-label="Main navigation">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/" className="text-white font-bold text-lg">Sync Sirius</a>

        <div className="hidden lg:flex items-center gap-8">
          <a href="/#hero" className="text-brand-muted hover:text-white transition-colors text-sm">{t('nav.home')}</a>
          <a href="/#contact" className="text-brand-muted hover:text-white transition-colors text-sm">{t('nav.contact')}</a>
        </div>

        <div className="hidden lg:flex items-center gap-4">
          <LanguageSwitcher />
          <GradientButton size="sm" onClick={handleDemoCta}>{t('nav.demo')}</GradientButton>
        </div>

        <button
          ref={hamburgerRef}
          type="button"
          className="lg:hidden w-11 h-11 flex items-center justify-center text-white"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-brand-navy motion-safe:animate-fade-in motion-reduce:animate-none"
          role="navigation"
          aria-label="Mobile navigation"
          data-testid="mobile-overlay-backdrop"
          onClick={() => setIsOpen(false)}
          onKeyDown={handleOverlayKeyDown}
        >
          <div
            className="flex flex-col pt-20 px-6 gap-6"
            data-testid="mobile-overlay-content"
            onClick={(e) => e.stopPropagation()}
          >
            <a ref={firstLinkRef} href="/#hero" className="text-white text-xl py-3 min-h-[44px] flex items-center" onClick={() => setIsOpen(false)}>{t('nav.home')}</a>
            <a href="/#contact" className="text-white text-xl py-3 min-h-[44px] flex items-center" onClick={() => setIsOpen(false)}>{t('nav.contact')}</a>
            <a href="/#demo-scheduler" className="text-white text-xl py-3 min-h-[44px] flex items-center" onClick={() => setIsOpen(false)}>{t('nav.demo')}</a>
            <div className="mt-4"><LanguageSwitcher /></div>
          </div>
        </div>
      )}
    </nav>
  )
}
