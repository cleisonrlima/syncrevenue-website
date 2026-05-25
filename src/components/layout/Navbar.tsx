import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import LanguageSwitcher from '@/i18n/LanguageSwitcher'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

/**
 * Section IDs the desktop nav anchors point to.
 * Spec source: Story 6.2 AC4 (Hero.html .nav-links).
 *
 * `produto`, `beneficios`, `integracoes`, `seguranca`, `clientes`, `contato`
 * are introduced incrementally by stories 6.3–6.8. Until those land, the
 * `<a href="#…">` anchors will no-op gracefully (browser does nothing if the
 * target is absent). Story 6.2 deliberately ships the new IDs ahead of their
 * target sections to keep the navbar markup stable.
 *
 * Story 6.10: the legacy `#demo-scheduler` fallback was removed once the
 * DemoScheduler section was renamed to `#agendar-demo` (canonical target).
 */
const NAV_LINKS = [
  { key: 'produto', href: '#produto' },
  { key: 'beneficios', href: '#beneficios' },
  { key: 'integracoes', href: '#integracoes' },
  { key: 'seguranca', href: '#seguranca' },
  { key: 'clientes', href: '#clientes' },
  { key: 'contato', href: '#contato' },
] as const

/**
 * Pixel threshold past which the navbar swaps from transparent overlay to the
 * sticky blurred fill. ~75% of a typical hero viewport — chosen to match the
 * existing scroll feel from Story 1.4. Keep generous enough that the swap
 * happens off-screen for fast scrollers (no flicker).
 */
const STICKY_THRESHOLD_PX = 480

export default function Navbar() {
  const { t } = useTranslation()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)

  // Treat the public landing page as the only route that gets the transparent
  // overlay at the top. Sub-routes (e.g. `/privacy`, `/admin/*`) always get the
  // filled navbar — there is no hero to overlay.
  const isHomeRoute = location.pathname === '/'

  // Sticky transition — toggle `isScrolled` past STICKY_THRESHOLD_PX. The same
  // listener pattern was established in Story 1.4 (kept passive + throttled
  // via rAF for perf).
  useEffect(() => {
    if (typeof window === 'undefined') return
    let rafId = 0
    const update = () => {
      setIsScrolled(window.scrollY > STICKY_THRESHOLD_PX)
      rafId = 0
    }
    const onScroll = () => {
      if (rafId) return
      rafId = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafId) window.cancelAnimationFrame(rafId)
    }
  }, [location.pathname])

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
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia('(min-width: 900px)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsOpen(false)
    }
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  const wasOpenRef = useRef(false)
  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true
      firstLinkRef.current?.focus()
    } else if (wasOpenRef.current) {
      hamburgerRef.current?.focus()
      wasOpenRef.current = false
    }
  }, [isOpen])

  // Demo CTA convergence (Story 2.4). Targets `#agendar-demo` directly —
  // the legacy `#demo-scheduler` id was retired in Story 6.10.
  const handleDemoCta = () => {
    if (!isHomeRoute) {
      window.location.href = '/#agendar-demo'
      return
    }

    const target = document.getElementById('agendar-demo')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.location.hash = 'agendar-demo'
    }
  }

  const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const overlay = e.currentTarget
    const focusable = overlay.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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

  // The transparent-overlay state is only used at the top of the landing page.
  // Anywhere else (sub-routes or scrolled past the hero) we render the filled
  // sticky navbar.
  const showOverlay = isHomeRoute && !isScrolled
  const sectionHref = (href: string) => (isHomeRoute ? href : `/${href}`)

  return (
    <nav
      className={cn(
        'fixed top-0 inset-x-0 z-50',
        isOpen ? 'bottom-0' : '',
        // motion-safe gating so reduced-motion users don't see the fade
        'motion-safe:transition-colors motion-safe:duration-200',
        showOverlay
          ? 'bg-transparent border-b border-transparent backdrop-blur-0'
          : 'bg-[rgba(8,8,32,0.85)] border-b border-[var(--line)] backdrop-blur-md'
      )}
      aria-label="Main navigation"
      data-overlay={showOverlay ? 'true' : 'false'}
      data-testid="navbar-root"
    >
      <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-14 h-[76px] flex items-center justify-between">
        <a href="#" className="flex items-center gap-3" aria-label="Sync Sirius — home">
          <img
            src="/syncsirius-logo-trans.png"
            alt="Sync Sirius"
            width={32}
            height={32}
            loading="eager"
            decoding="async"
            className="h-8 w-auto block"
          />
        </a>

        <div className="hidden min-[900px]:flex items-center gap-[34px]">
          {NAV_LINKS.map(({ key, href }) => (
            <a
              key={key}
              href={sectionHref(href)}
              className="text-[14px] font-medium text-white/[0.78] hover:text-white motion-safe:transition-colors motion-safe:duration-150"
            >
              {t(`nav.links.${key}`)}
            </a>
          ))}
        </div>

        <div className="hidden min-[900px]:flex items-center gap-3">
          <LanguageSwitcher />
          <Button type="button" variant="solid-accent" size="md" onClick={handleDemoCta}>
            {t('nav.cta', { defaultValue: 'Schedule a Demo' })}
          </Button>
        </div>

        <button
          ref={hamburgerRef}
          type="button"
          className="min-[900px]:hidden w-11 h-11 flex items-center justify-center text-white"
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
          className="min-[900px]:hidden fixed inset-0 z-40 bg-[rgba(8,8,32,0.96)] motion-safe:animate-fade-in motion-reduce:animate-none"
          role="dialog"
          aria-modal="true"
          aria-label="Landing navigation"
          data-testid="mobile-overlay-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false)
          }}
          onKeyDown={handleOverlayKeyDown}
        >
          <nav
            className="flex flex-col pt-20 px-6 gap-5 max-w-sm w-full mx-auto"
            role="navigation"
            aria-label="Mobile navigation"
            data-testid="mobile-overlay-content"
          >
            {NAV_LINKS.map(({ key, href }, idx) => (
              <a
                key={key}
                ref={idx === 0 ? firstLinkRef : undefined}
                href={sectionHref(href)}
                className="text-white text-xl py-3 min-h-[44px] flex items-center"
                onClick={() => setIsOpen(false)}
              >
                {t(`nav.links.${key}`)}
              </a>
            ))}
            <a
              href="/#agendar-demo"
              className="text-white text-xl py-3 min-h-[44px] flex items-center"
              onClick={() => setIsOpen(false)}
            >
              {t('nav.cta', { defaultValue: 'Schedule a Demo' })}
            </a>
            <div className="mt-4"><LanguageSwitcher menuPlacement="top" /></div>
          </nav>
        </div>
      )}
    </nav>
  )
}
