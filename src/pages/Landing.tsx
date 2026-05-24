import React, { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react'
import Slider from 'react-slick'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import {
  ArrowRight,
  Award,
  BarChart3,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Menu,
  X,
  PlayCircle,
  TrendingUp,
  LineChart,
  Wallet,
  Globe2,
  Mail,
} from 'lucide-react'

import { ImageWithFallback } from '@/components/figma/ImageWithFallback'
import { useDocumentMeta } from '@/components/SEO'
import LanguageSwitcher from '@/i18n/LanguageSwitcher'
import { useLocaleStore } from '@/store/useLocaleStore'

/**
 * Story 7.4 (AC 1, 2, 3, 6): Verbatim port of the Figma 'teste' Landing page
 * (Figma Make file `66Wb2MAv5PLOBSJLoFM3E3`, source path
 * `src/app/pages/Landing.tsx`). Mounted at `/v2` per Story 7.2.
 *
 * Figma source was fetched via the `ReadMcpResourceTool` against
 * `file://figma/make/source/66Wb2MAv5PLOBSJLoFM3E3/src/app/pages/Landing.tsx`
 * on 2026-05-22 (Story 7.4 dev pass). Caveats from Story 7.2's port apply —
 * `get_design_context` only returns resource link descriptors for Figma Make
 * files, the resource content is fetched separately via `ReadMcpResourceTool`.
 * If a future story needs to re-fetch and the MCP transport is disconnected,
 * fall back to authoring per the Story 7.4 AC1 shopping list.
 *
 * Documented swaps from the verbatim source:
 *   - `react-router` import → `react-router-dom` (matches the rest of the
 *     repo and the route registration in `src/App.tsx`)
 *   - `../components/figma/ImageWithFallback` → `@/components/figma/ImageWithFallback`
 *   - `logo1` / `logo2` imports from `../../imports/1351_rev_*.jpg` replaced
 *     by the canonical `/logos/syncsirius-logo.png` asset published under
 *     `public/logos/` by Story 7.2. Both `logo1` and `logo2` collapse to the
 *     same file — the Figma source used two distinct files only because the
 *     Make export emitted them as separate assets; the live repo carries one.
 *   - The Figma source's `useEffect(() => document.documentElement.classList.add('dark'), [])`
 *     is REMOVED per AC 3. Story 7.1 sets `<html class="dark">` statically
 *     in `index.html`, so the runtime re-add is a no-op on every Landing
 *     mount. All other `useEffect` hooks (scroll listener) stay.
 *   - The `useDocumentMeta` call from the Story 7.2 placeholder is preserved
 *     so `/v2` continues to publish the i18n-scoped meta tags. Keys use
 *     `defaultValue` fallbacks inside the SEO helper until Story 7.5 extracts
 *     real translations.
 *
 * Preserved verbatim (do NOT silently change — owned by other stories):
 *   - legacy Figma brand name occurrences — Story 7.6 owns the rewrite
 *     to "SyncRevenue"
 *   - All insurance / commission-audit copy (slide descriptions, benefits
 *     grid, security strip, CTA) — Story 7.6 owns the travel-commission
 *     rewrite
 *   - The inline `<style>` block targeting `.slick-dots li.slick-active div`
 *     (only way to override slick's active-dot styling without a global
 *     stylesheet — AC 2)
 *   - The 3 Unsplash hero images at 1080px (mobile LCP impact known; the
 *     Story 7.4 Dev Notes flag this for Story 7.7 / 7.8 follow-up if the
 *     Lighthouse perf gate drops below 80)
 *
 * SSR note: `react-slick` initialises against `window` on mount and does NOT
 * support SSR cleanly. `scripts/prerender.tsx` already does not enumerate
 * `/v2`, and Story 7.7 owns the explicit prerender exclusion list — Landing
 * therefore only renders client-side and the slider initialises safely.
 */

// Story 7.5: text content (badge / title / titleHighlight / description /
// floatingTitle / floatingValue) lives under `landing.heroSlides.{id}.*` in
// the i18n bundle. The visual/static config (image URL, primary color,
// floating icon + bg, slide id) stays inline — it's not user-facing copy.
type SlideId = 'revenue' | 'pay' | 'insights'

type SlideConfig = {
  id: SlideId
  image: string
  primaryColor: string
  floatingIcon: React.ReactNode
  floatingBg: string
}

const CAROUSEL_SLIDES: ReadonlyArray<SlideConfig> = [
  {
    id: 'revenue',
    image:
      'https://images.unsplash.com/photo-1666875753105-c63a6f3bdc86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwYW5hbHl0aWNzJTIwZGFzaGJvYXJkJTIwZGFzaGJvYXJkfGVufDF8fHx8MTc3OTQ3OTI1N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    primaryColor: 'from-indigo-400 via-purple-400 to-pink-400',
    floatingIcon: <TrendingUp className="w-5 h-5 text-green-400" />,
    floatingBg: 'bg-green-500/20',
  },
  {
    id: 'pay',
    image:
      'https://images.unsplash.com/photo-1509017174183-0b7e0278f1ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwcGF5bWVudCUyMHRyYW5zYWN0aW9ufGVufDF8fHx8MTc3OTQ3OTgxN3ww&ixlib=rb-4.1.0&q=80&w=1080',
    primaryColor: 'from-blue-400 via-cyan-400 to-teal-400',
    floatingIcon: <Wallet className="w-5 h-5 text-blue-400" />,
    floatingBg: 'bg-blue-500/20',
  },
  {
    id: 'insights',
    image:
      'https://images.unsplash.com/photo-1576185850227-1f72b7f8d483?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnbG9iYWwlMjBmaW5hbmNlJTIwYnVzaW5lc3MlMjBtYXAlMjBhYnN0cmFjdHxlbnwxfHx8fDE3Nzk0Nzk4MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    primaryColor: 'from-amber-400 via-orange-400 to-rose-400',
    floatingIcon: <Globe2 className="w-5 h-5 text-amber-400" />,
    floatingBg: 'bg-amber-500/20',
  },
]

// Per-slide English fallback strings used as `defaultValue` for `t()` calls.
// Keeping them co-located with the slide config means a single source of
// truth even when the i18n bundle is missing a key (dev safety net).
const SLIDE_FALLBACKS: Record<SlideId, {
  badge: string
  title: string
  titleHighlight: string
  description: string
  floatingTitle: string
  floatingValue: string
}> = {
  revenue: {
    badge: 'SyncRevenue is now available',
    title: 'Recover lost revenue.',
    titleHighlight: 'Before it disappears.',
    description:
      'The automated commission auditing platform that finds missing agency revenue before it hits your bottom line. Stop leaving money on the table.',
    floatingTitle: 'Recovered this month',
    floatingValue: '+$24,500.00',
  },
  pay: {
    badge: 'Introducing SyncRevenue Payouts',
    title: 'Automate payouts.',
    titleHighlight: 'Accurately.',
    description:
      'Route commissions to your agents reliably and accurately. Simplify your payout workflows and eliminate manual transaction errors.',
    floatingTitle: 'Payout Processed',
    floatingValue: '$12,450 to 8 Agents',
  },
  insights: {
    badge: 'SyncRevenue Insights',
    title: 'Predictive analytics.',
    titleHighlight: 'Visualized.',
    description:
      'Forecast cash flow and visualize agency performance across global territories. Turn raw commission data into strategic business intelligence.',
    floatingTitle: 'Global Forecast',
    floatingValue: '+18% YoY Growth',
  },
}

const LOGO_SRC = '/logos/syncsirius-logo.png'

export default function Landing() {
  const { t } = useTranslation()

  useDocumentMeta({
    titleKey: 'seo.landing.title',
    descriptionKey: 'seo.landing.description',
    ogTitleKey: 'seo.landing.ogTitle',
    ogDescriptionKey: 'seo.landing.ogDescription',
    path: '/v2',
  })

  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const menu = mobileMenuRef.current
    const focusable = menu?.querySelector<HTMLElement>('a[href], button:not([disabled])')
    focusable?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false)
        return
      }

      if (event.key !== 'Tab' || !menu) return

      const focusableElements = Array.from(
        menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
      ).filter((element) => element.offsetParent !== null)
      const first = focusableElements[0]
      const last = focusableElements[focusableElements.length - 1]

      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileMenuOpen])

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 6000,
    arrows: false,
    fade: true,
    customPaging: () => (
      <div className="w-12 h-1.5 mt-8 rounded-full bg-white/20 transition-all duration-300 hover:bg-white/40" />
    ),
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-50 font-sans selection:bg-indigo-500/30">
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b ${
          isScrolled
            ? 'bg-[#0A0A0A]/80 backdrop-blur-lg border-white/10 py-4'
            : 'bg-transparent border-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageWithFallback
              src={LOGO_SRC}
              alt={t('landing.nav.logoAlt', 'Sync Sirius logo')}
              className="h-8 w-auto rounded object-contain"
            />
            <span className="text-xl font-bold tracking-tight text-white">
              {t('landing.nav.brand', 'SyncRevenue')}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#platform" className="text-slate-300 hover:text-white transition-colors">
              {t('landing.nav.products', 'Products')}
            </a>
            <a href="#syncrevenue" className="text-slate-300 hover:text-white transition-colors">
              {t('landing.nav.integrations', 'Integrations')}
            </a>
            <a href="#benefits" className="text-slate-300 hover:text-white transition-colors">
              {t('landing.nav.benefits', 'Benefits')}
            </a>
            <a href="#security" className="text-slate-300 hover:text-white transition-colors">
              {t('landing.nav.security', 'Security')}
            </a>
            <a href="#customers" className="text-slate-300 hover:text-white transition-colors">
              {t('landing.nav.customers', 'Customers')}
            </a>
            <a href="#contato" className="text-slate-300 hover:text-white transition-colors">
              {t('landing.nav.contact', 'Contact')}
            </a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            <Link
              to="/dashboard"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4 py-2"
            >
              {t('landing.nav.login', 'Log in')}
            </Link>
            <Link
              to="/demo"
              className="text-sm font-medium bg-white text-black hover:bg-slate-200 transition-colors px-5 py-2.5 rounded-full inline-flex items-center gap-2"
            >
              {t('landing.nav.bookDemo', 'Schedule a Demo')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen
              ? t('landing.nav.closeMenu', 'Close menu')
              : t('landing.nav.openMenu', 'Open menu')}
            aria-expanded={mobileMenuOpen}
            aria-controls="landing-mobile-menu"
            className="md:hidden text-slate-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            id="landing-mobile-menu"
            ref={mobileMenuRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('landing.mobileMenu.ariaLabel', 'Landing navigation')}
            className="fixed inset-0 z-40 bg-[#0A0A0A] pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col gap-6 text-lg">
              <a
                href="#platform"
                onClick={() => setMobileMenuOpen(false)}
                className="border-b border-white/10 pb-4"
              >
                {t('landing.nav.products', 'Products')}
              </a>
              <a
                href="#syncrevenue"
                onClick={() => setMobileMenuOpen(false)}
                className="border-b border-white/10 pb-4"
              >
                {t('landing.nav.integrations', 'Integrations')}
              </a>
              <a
                href="#benefits"
                onClick={() => setMobileMenuOpen(false)}
                className="border-b border-white/10 pb-4"
              >
                {t('landing.nav.benefits', 'Benefits')}
              </a>
              <a
                href="#security"
                onClick={() => setMobileMenuOpen(false)}
                className="border-b border-white/10 pb-4"
              >
                {t('landing.nav.security', 'Security')}
              </a>
              <a
                href="#customers"
                onClick={() => setMobileMenuOpen(false)}
                className="border-b border-white/10 pb-4"
              >
                {t('landing.nav.customers', 'Customers')}
              </a>
              <a
                href="#contato"
                onClick={() => setMobileMenuOpen(false)}
                className="border-b border-white/10 pb-4"
              >
                {t('landing.nav.contact', 'Contact')}
              </a>
              <Link
                to="/demo"
                className="bg-white text-black py-4 rounded-xl mt-4 font-medium flex items-center justify-center gap-2"
              >
                {t('landing.nav.bookDemo', 'Schedule a Demo')} <ArrowRight className="w-5 h-5" />
              </Link>
              <div className="pt-2">
                <LanguageSwitcher />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section
        id="platform"
        className="relative min-h-[100vh] pt-32 pb-20 flex flex-col justify-center overflow-hidden"
      >
        <div className="absolute inset-0 z-0">
          <motion.img
            style={{ y }}
            src="https://images.unsplash.com/photo-1462556791646-c201b8241a94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhYnN0cmFjdCUyMGJ1c2luZXNzfGVufDF8fHx8MTc3OTQ3OTI1M3ww&ixlib=rb-4.1.0&q=80&w=1920"
            alt={t('landing.hero.bgImageAlt', 'Abstract Business')}
            className="w-full h-[150%] object-cover opacity-10 object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A]/80 to-[#0A0A0A]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          <style>{`
            .slick-dots li.slick-active div {
              background-color: white !important;
              width: 2rem !important;
            }
          `}</style>

          <Slider {...sliderSettings} className="hero-slider">
            {CAROUSEL_SLIDES.map((slide) => {
              const slideCopy = SLIDE_FALLBACKS[slide.id]
              const slideTitle = t(`landing.heroSlides.${slide.id}.title`, slideCopy.title)
              return (
                <div key={slide.id} className="outline-none focus:outline-none py-12">
                  <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="pr-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm mb-8 text-slate-300">
                        <span className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
                        {t(`landing.heroSlides.${slide.id}.badge`, slideCopy.badge)}
                      </div>

                      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
                        {slideTitle} <br />
                        <span
                          className={`text-transparent bg-clip-text bg-gradient-to-r ${slide.primaryColor}`}
                        >
                          {t(`landing.heroSlides.${slide.id}.titleHighlight`, slideCopy.titleHighlight)}
                        </span>
                      </h1>

                      <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-xl leading-relaxed min-h-[84px]">
                        {t(`landing.heroSlides.${slide.id}.description`, slideCopy.description)}
                      </p>

                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <Link
                          to="/dashboard"
                          className="w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-lg"
                        >
                          {slide.id === 'revenue'
                            ? t('landing.hero.explorePlatform', 'Explore Platform')
                            : t('landing.hero.exploreProduct', 'Explore Product')}
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                          to="/demo"
                          className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white font-semibold rounded-full border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-lg"
                        >
                          <PlayCircle className="w-5 h-5" />
                          {t('landing.hero.requestDemo', 'Schedule a Demo')}
                        </Link>
                      </div>

                      <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-3 gap-6" data-testid="landing-kpi-row">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i}>
                            <div className="text-2xl md:text-3xl font-extrabold text-white tabular-nums tracking-tight">
                              {t(`hero.kpis.${i}.value`, '')}
                            </div>
                            <div className="mt-1 text-xs text-slate-500 font-medium leading-snug whitespace-pre-line">
                              {t(`hero.kpis.${i}.label`, '')}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{t('hero.trustBar.items.0', 'Encrypted Transmission')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{t('hero.trustBar.items.1', 'Certification Roadmap')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{t('hero.trustBar.items.2', 'Contract Insurance')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe2 className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{t('hero.trustBar.items.3', 'Referenced US Agencies')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative hidden lg:block">
                      <div
                        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] mix-blend-screen opacity-20 bg-gradient-to-r ${slide.primaryColor}`}
                      />

                      <div className="relative rounded-2xl border border-white/10 bg-[#12121A]/80 backdrop-blur-xl p-2 shadow-2xl z-10">
                        <img
                          src={slide.image}
                          alt={slideTitle}
                          className="rounded-xl border border-white/5 opacity-80 h-[450px] w-full object-cover grayscale-[0.2]"
                        />

                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                          className="absolute -left-12 top-24 bg-[#1A1A24] border border-white/10 rounded-xl p-4 shadow-xl flex items-center gap-4"
                        >
                          <div
                            className={`w-10 h-10 rounded-full ${slide.floatingBg} flex items-center justify-center`}
                          >
                            {slide.floatingIcon}
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">
                              {t(`landing.heroSlides.${slide.id}.floatingTitle`, slideCopy.floatingTitle)}
                            </p>
                            <p className="text-lg font-bold text-white">
                              {t(`landing.heroSlides.${slide.id}.floatingValue`, slideCopy.floatingValue)}
                            </p>
                          </div>
                        </motion.div>

                        <motion.div
                          animate={{ y: [0, 10, 0] }}
                          transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1 }}
                          className="absolute -right-8 bottom-12 bg-[#1A1A24] border border-white/10 rounded-xl p-4 shadow-xl"
                        >
                          <div className="flex items-center justify-between mb-2 gap-4">
                            <p className="text-xs text-slate-400">
                              {t('landing.hero.systemStatus', 'System Status')}
                            </p>
                            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                          </div>
                          <p className="text-sm font-medium text-white flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-indigo-400" />
                            {t('landing.hero.liveSyncActive', 'Live Sync Active')}
                          </p>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </Slider>
        </div>
      </section>

      <section id="customers" className="py-12 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm font-medium text-slate-500 tracking-widest uppercase mb-8">
            {t('landing.trust.heading', 'TRUSTED BY FORWARD-THINKING AGENCIES')}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="text-xl font-black tracking-tighter">OAK &amp; STONE</div>
            <div className="text-xl font-bold flex items-center gap-2">
              <Zap className="w-5 h-5" /> NEXUS
            </div>
            <div className="text-xl font-serif italic font-bold">Vanguard</div>
            <div className="text-xl font-bold tracking-widest">E L E V A T E</div>
            <div className="text-xl font-bold flex items-center gap-1">
              <LineChart className="w-6 h-6" /> Metrics
            </div>
          </div>
        </div>
      </section>

      {/* ── SyncRevenue / Integrations ── */}
      <section id="syncrevenue" className="py-24 border-t border-white/5 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
            {t('syncrevenue.eyebrow', 'Our Flagship Product')}
          </p>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            {t('syncrevenue.headline', 'Automated Commission Reconciliation')}
          </h2>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto mb-12">
            {t('syncrevenue.subtext', 'SyncRevenue connects to your GDS feeds and automatically identifies commission discrepancies, disputed debit memos, and BSP/ARC reconciliation failures — recovering revenue your team would otherwise miss.')}
          </p>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-5">
            {t('syncrevenue.gds.title', 'GDS Integrations')}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl mx-auto mb-8">
            {(['amadeus', 'sabre', 'galileo', 'worldspan'] as const).map((gds) => (
              <div
                key={gds}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center hover:border-white/20 hover:bg-white/[0.05] transition-colors"
              >
                <span className="text-sm font-semibold text-white capitalize">
                  {t(`syncrevenue.gds.${gds}`, gds.charAt(0).toUpperCase() + gds.slice(1))}
                </span>
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-500">
            {t('syncrevenue.accuracy', '99.99% commission assertivity across all integrated GDS platforms.')}
          </p>
        </div>

        {/* 6-card feature grid */}
        <div className="max-w-7xl mx-auto px-6 mt-20">
          <div className="grid md:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => {
              const metricVariant = t(`hero.benefits.${i}.metricVariant`, 'neutral')
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-white/20 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      {[<CheckCircle2 key="0" className="w-5 h-5" />, <Globe2 key="1" className="w-5 h-5" />, <Award key="2" className="w-5 h-5" />, <TrendingUp key="3" className="w-5 h-5" />, <ShieldCheck key="4" className="w-5 h-5" />, <BarChart3 key="5" className="w-5 h-5" />][i]}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${metricVariant === 'blue' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-white/10 text-slate-300 border border-white/10'}`}>
                      {t(`hero.benefits.${i}.metric`, '')}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">
                    {t(`hero.benefits.${i}.title`, '')}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {t(`hero.benefits.${i}.body`, '')}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="benefits" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              {t('landing.benefits.heading', 'Automate the invisible.')}
            </h2>
            <p className="text-lg text-slate-400">
              {t(
                'landing.benefits.subheading',
                'Manual commission tracking is prone to human error. Our intelligent platform cross-references your GDS statements with your internal data in seconds.',
              )}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BarChart3 />}
              title={t('landing.benefits.card1.title', 'Real-time Reconciliation')}
              description={t(
                'landing.benefits.card1.description',
                'Automatically match expected commissions against actual GDS payouts as soon as statements arrive.',
              )}
            />
            <FeatureCard
              icon={<ShieldCheck />}
              title={t('landing.benefits.card2.title', 'Discrepancy Detection')}
              description={t(
                'landing.benefits.card2.description',
                'Flag missing payments, incorrect rates, and debit memo (ADM) errors before the books close.',
              )}
            />
            <FeatureCard
              icon={<Zap />}
              title={t('landing.benefits.card3.title', 'Automated Resolution')}
              description={t(
                'landing.benefits.card3.description',
                'Generate one-click dispute reports formatted exactly how airlines and GDS providers need them to resolve issues fast.',
              )}
            />
          </div>
        </div>
      </section>

      {/* ── Complete Revenue Intelligence Suite ── */}
      <section id="services" className="py-24 border-t border-white/5 bg-white/[0.02] scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
              {t('services.eyebrow', 'Our Services')}
            </p>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              {t('services.headline', 'Complete Revenue Intelligence Suite')}
            </h2>
            <p className="text-lg text-slate-400">
              {t('services.subtext', 'Whether you need automated reconciliation, data analytics, or custom development, we have the expertise to solve your specific challenge.')}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {([
              { key: 'syncrevenue', icon: <BarChart3 className="w-5 h-5" />, titleDef: 'SyncRevenue', descDef: 'Automated GDS commission reconciliation and recovery for travel agencies.' },
              { key: 'analytics', icon: <LineChart className="w-5 h-5" />, titleDef: 'BI & Data Analytics', descDef: 'Turn your booking and commission data into actionable intelligence.' },
              { key: 'obts', icon: <PlayCircle className="w-5 h-5" />, titleDef: 'Online Booking Tools', descDef: 'Implementation, optimization, and support for OBT platforms.' },
              { key: 'custom', icon: <Zap className="w-5 h-5" />, titleDef: 'Custom Development', descDef: 'Bespoke solutions for complex airline distribution and revenue challenges.' },
            ] as const).map((svc) => (
              <div
                key={svc.key}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 pt-6 pb-5 hover:border-white/20 hover:bg-white/[0.05] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
                  {svc.icon}
                </div>
                <h3 className="text-sm font-bold text-white mb-2">
                  {t(`services.${svc.key}.title`, svc.titleDef)}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {t(`services.${svc.key}.description`, svc.descDef)}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-center text-sm text-slate-500">
            {t('services.contact', 'Not sure which service fits? Contact us.')}
          </p>
        </div>
      </section>

      {/* ── Free Commission Leakage Audit ── */}
      <section id="commission-audit" className="py-24 border-t border-white/5 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
              {t('sections.commissionAudit.eyebrow', 'Free Commission Leakage Audit')}
            </p>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              {t('sections.commissionAudit.heading', 'Free Commission Leakage Audit')}
            </h2>
            <p className="text-lg text-slate-400">
              {t('sections.commissionAudit.subheading', 'Send us 30 days of BSP data and we will return a written report on how much commission your agency is leaving on the table.')}
            </p>
          </div>
          <ul className="grid md:grid-cols-3 gap-4 mb-10">
            {(['bullet1', 'bullet2', 'bullet3'] as const).map((key) => (
              <li
                key={key}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 text-sm leading-relaxed text-slate-400 hover:border-white/20 hover:bg-white/[0.05] transition-colors"
              >
                {t(`sections.commissionAudit.${key}`, '')}
              </li>
            ))}
          </ul>
          <div className="flex justify-center">
            <Link
              to="/demo"
              className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-500 transition-colors inline-flex items-center gap-2 text-base"
            >
              {t('sections.commissionAudit.ctaLabel', 'Request my free audit')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section id="comparison" className="py-24 border-t border-white/5 bg-white/[0.02] scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
              {t('comparison.eyebrow', 'Why SyncRevenue')}
            </p>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              {t('comparison.headline', 'Stop Losing Revenue to Manual Processes')}
            </h2>
            <p className="text-lg text-slate-400">
              {t('comparison.subtext', 'See how automated commission management compares to the status quo.')}
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
            <table className="min-w-[720px] w-full border-collapse text-left">
              <thead className="bg-white/[0.04]">
                <tr>
                  <th className="w-[22%] px-5 py-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    {t('comparison.featureHeader', 'Feature')}
                  </th>
                  <th className="w-[26%] px-5 py-4 text-xs font-semibold uppercase tracking-widest text-indigo-400">
                    {t('comparison.syncrevenueHeader', 'SyncRevenue')}
                  </th>
                  <th className="w-[26%] px-5 py-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    {t('comparison.legacyHeader', 'Manual / Legacy Tools')}
                  </th>
                  <th className="w-[26%] px-5 py-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    {t('comparison.genericHeader', 'Generic Tools')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {([
                  { key: 'reconciliation', labelDef: 'BSP/ARC Reconciliation', srDef: 'Automatically detects settlement discrepancies before revenue leaks continue.', legDef: 'Spreadsheet matching after closing leaves issues for monthly cleanup.', genDef: 'Does not model airline settlement workflows without heavy configuration.' },
                  { key: 'debitMemo', labelDef: 'Debit Memo Dispute Management', srDef: 'Links each dispute to commission context, booking history, and recovery status.', legDef: 'Teams track reason codes and supporting notes manually.', genDef: 'Requires custom task processes to keep disputes and commissions connected.' },
                  { key: 'gdsIntegration', labelDef: 'Multi-GDS Integration', srDef: 'Covers Amadeus, Sabre, Galileo, and Worldspan commission workflows.', legDef: 'Depends on copied exports or isolated single-GDS views.', genDef: 'Requires CSV imports and manual mapping before analysis can start.' },
                  { key: 'reporting', labelDef: 'Real-Time Commission Reporting', srDef: 'Shows recovery status and commission exceptions as work progresses.', legDef: 'Monthly reporting delays visibility into missed or disputed revenue.', genDef: 'Dashboards depend on manual refreshes and spreadsheet upkeep.' },
                  { key: 'audit', labelDef: 'Automated Audit Trail', srDef: 'Creates system records for reconciliation actions, disputes, and outcomes.', legDef: 'Evidence is scattered across emails, files, and individual spreadsheets.', genDef: 'Stores attachments or notes without travel-specific traceability.' },
                ] as const).map((row) => (
                  <tr key={row.key} className="align-top">
                    <th scope="row" className="px-5 py-5 text-sm font-semibold text-white leading-snug">
                      {t(`comparison.features.${row.key}.label`, row.labelDef)}
                    </th>
                    <td className="px-5 py-5 text-sm text-slate-300 leading-relaxed">
                      {t(`comparison.features.${row.key}.syncrevenue`, row.srDef)}
                    </td>
                    <td className="px-5 py-5 text-sm text-slate-500 leading-relaxed">
                      {t(`comparison.features.${row.key}.legacy`, row.legDef)}
                    </td>
                    <td className="px-5 py-5 text-sm text-slate-500 leading-relaxed">
                      {t(`comparison.features.${row.key}.generic`, row.genDef)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="security" className="py-24 border-t border-white/5 bg-[#0A0A0A] scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              {t('landing.security.heading', 'Bank-grade security.')}
            </h2>
            <p className="text-lg text-slate-400">
              {t(
                'landing.security.subheading',
                'Your financial data is protected by AES-256 encryption, regular third-party audits, and strict role-based access controls. We treat your revenue data with the highest level of security.',
              )}
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 text-center opacity-70">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <ShieldCheck className="w-8 h-8 mx-auto text-indigo-400 mb-4" />
              <div className="font-bold text-white mb-1">
                {t('landing.security.soc2.title', 'SOC 2 Type II')}
              </div>
              <div className="text-sm text-slate-500">
                {t('landing.security.soc2.sub', 'Certified Compliant')}
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <ShieldCheck className="w-8 h-8 mx-auto text-indigo-400 mb-4" />
              <div className="font-bold text-white mb-1">
                {t('landing.security.e2e.title', 'End-to-End Encryption')}
              </div>
              <div className="text-sm text-slate-500">
                {t('landing.security.e2e.sub', 'AES-256 & TLS 1.3')}
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <ShieldCheck className="w-8 h-8 mx-auto text-indigo-400 mb-4" />
              <div className="font-bold text-white mb-1">
                {t('landing.security.rbac.title', 'Role-Based Access')}
              </div>
              <div className="text-sm text-slate-500">
                {t('landing.security.rbac.sub', 'Granular permissions')}
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <ShieldCheck className="w-8 h-8 mx-auto text-indigo-400 mb-4" />
              <div className="font-bold text-white mb-1">
                {t('landing.security.uptime.title', '99.99% Uptime')}
              </div>
              <div className="text-sm text-slate-500">
                {t('landing.security.uptime.sub', 'Enterprise reliability')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section id="equipe" className="py-24 border-t border-white/5 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
              <span aria-hidden="true" className="inline-block h-px w-6 bg-white/30" />
              {t('team.eyebrow', 'Our Team')}
            </p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              {t('team.headline', 'Specialists in')}{' '}
              <span className="text-indigo-400">{t('team.headlineAccent', 'airline distribution')}</span>
            </h2>
            <p className="text-lg text-slate-400">
              {t('team.subtext', 'Our team brings decades of GDS, BSP, and travel agency operations experience.')}
            </p>
          </div>
          <LandingTeamGrid />
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contato" className="py-24 border-t border-white/5 bg-white/[0.02] scroll-mt-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
            {t('contact.eyebrow', 'Contact')}
          </p>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            {t('contact.heading.text', 'Talk to')}{' '}
            <span className="text-indigo-400">{t('contact.heading.accent', 'Sync Sirius')}</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
            {t('contact.subhead', 'For commercial questions, support, partnerships, or press — your message reaches the right team.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <a
              href={`mailto:${t('contact.channels.0.value', 'contact@syncsirius.com')}`}
              className="flex items-center gap-2.5 px-6 py-3 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-colors text-slate-300 text-sm"
            >
              <Mail className="w-4 h-4 shrink-0" />
              {t('contact.channels.0.value', 'contact@syncsirius.com')}
            </a>
            <Link
              to="/demo"
              className="px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-slate-200 transition-colors text-sm inline-flex items-center gap-2"
            >
              {t('landing.nav.bookDemo', 'Schedule a Demo')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-sm text-slate-500">
            {t('contact.infoCard.subtitle', 'Under 4 hours on business days.')}
          </p>
        </div>
      </section>

      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-purple-900/20" />
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-8">
            {t('landing.cta.heading', 'Ready to transform your revenue?')}
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            {t(
              'landing.cta.subheading',
              'Join the agencies optimizing their finances with the Sync Sirius product suite.',
            )}
          </p>
          <Link
            to="/demo"
            className="px-10 py-5 bg-white text-black text-xl font-bold rounded-full hover:bg-slate-200 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.3)] inline-block"
          >
            {t('landing.cta.button', 'Schedule a Demo')}
          </Link>
        </div>
      </section>

      <footer className="py-12 border-t border-white/10 text-sm text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-white">
            <ImageWithFallback
              src={LOGO_SRC}
              alt={t('landing.footer.logoAlt', 'Sync Sirius logo')}
              className="h-6 w-auto rounded object-contain grayscale opacity-80"
            />
            <span className="font-bold text-lg tracking-tight">
              {t('landing.footer.brand', 'SyncRevenue')}
            </span>
          </div>

          <div className="flex items-center gap-8">
            <a href="/privacy" className="hover:text-white transition-colors">
              {t('landing.footer.privacy', 'Privacy Policy')}
            </a>
            <a href="/privacy#terms" className="hover:text-white transition-colors">
              {t('landing.footer.terms', 'Terms of Service')}
            </a>
            <a href="/#contato" className="hover:text-white transition-colors">
              {t('landing.footer.contact', 'Contact Support')}
            </a>
          </div>

          <p>
            {t('landing.footer.copyright', '© {{year}} Sync Sirius. All rights reserved.', {
              year: new Date().getFullYear(),
            })}
          </p>
        </div>
      </footer>
    </div>
  )
}

function LandingTeamGrid() {
  const { t } = useTranslation()
  const locale = useLocaleStore((state) => state.locale)
  const [members, setMembers] = React.useState<Array<{
    id: number
    name: string
    role: string
    bio: string
    experience: string
    photo: string
    linkedinUrl: string
  }>>([])

  React.useEffect(() => {
    import('@/lib/api').then(({ getPublicTeam }) => {
      void getPublicTeam()
        .then((rows) => {
          setMembers(
            rows
              .map((row) => {
                let role = row.role_en
                let bio = row.bio_en
                let experience = row.experience_en
                if (locale === 'pt-BR') { role = row.role_pt; bio = row.bio_pt; experience = row.experience_pt }
                else if (locale === 'es') { role = row.role_es; bio = row.bio_es; experience = row.experience_es }
                return { id: row.id, name: row.name, role, bio, experience, photo: row.photo_url ?? '', linkedinUrl: row.linkedin ?? '' }
              })
              .filter((m) => m.name.length > 0 && m.role.length > 0 && m.bio.length > 0),
          )
        })
        .catch(() => {})
    })
  }, [locale])

  if (members.length === 0) return null

  return (
    <div className="grid grid-cols-1 min-[760px]:grid-cols-2 gap-6 max-w-[1080px] mx-auto">
      {members.map((member) => (
        <article
          key={member.id}
          data-testid={`landing-team-card-${member.id}`}
          className="grid grid-cols-1 min-[560px]:grid-cols-[200px_1fr] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05] transition-colors"
        >
          <div className="relative aspect-square min-h-[200px] overflow-hidden bg-[#0A0B2E]">
            {member.photo.trim().length > 0 ? (
              <img
                src={member.photo}
                alt={`${member.name}, ${member.role}`}
                width="200"
                height="200"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-full w-full items-center justify-center bg-indigo-600 text-5xl font-bold text-white"
              >
                {member.name.split(/\s+/).slice(0, 2).map((p) => p.charAt(0)).join('')}
              </div>
            )}
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-[rgba(8,8,28,0.75)] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.04em] text-white before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#5BC98C] before:content-['']">
              {t('team.statusLabel', 'available')}
            </span>
          </div>
          <div className="flex flex-col px-6 pt-6 pb-5">
            <h3 className="mb-2 text-xl font-bold tracking-tight text-white">{member.name}</h3>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{member.role}</p>
            <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-400">{member.bio}</p>
            <div className="mt-auto flex items-center gap-2.5 border-t border-white/10 pt-3.5">
              {member.linkedinUrl.trim().length > 0 && (
                <a
                  href={member.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('team.linkedinAriaLabel', { name: member.name, defaultValue: 'View {{name}} on LinkedIn' })}
                  className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:border-[#0A66C2] hover:bg-[#0A66C2] hover:text-white transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 11.01-4.13 2.07 2.07 0 010 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45C23.21 24 24 23.23 24 22.28V1.72C24 .77 23.21 0 22.22 0z" />
                  </svg>
                </a>
              )}
              <span className="ml-auto text-xs text-slate-500">{member.experience}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-8 hover:bg-white/[0.05] transition-colors group cursor-pointer">
      <div className="w-14 h-14 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform group-hover:bg-indigo-500 group-hover:text-white">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </div>
  )
}
