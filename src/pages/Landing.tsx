import React, { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react'
import Slider from 'react-slick'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import {
  ArrowRight,
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
} from 'lucide-react'

import { ImageWithFallback } from '@/components/figma/ImageWithFallback'
import { useDocumentMeta } from '@/components/SEO'
import LanguageSwitcher from '@/i18n/LanguageSwitcher'

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
 *   - "SyncSyrius" brand name (5 occurrences) — Story 7.6 owns the rewrite
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
    badge: 'SyncRevenue 2.0 is now live',
    title: 'Recover lost revenue.',
    titleHighlight: 'Instantly.',
    description:
      'The automated commission auditing platform that finds missing agency revenue before it hits your bottom line. Stop leaving money on the table.',
    floatingTitle: 'Recovered this month',
    floatingValue: '+$24,500.00',
  },
  pay: {
    badge: 'Introducing SyncPay',
    title: 'Automate payouts.',
    titleHighlight: 'Flawlessly.',
    description:
      'Route commissions to your agents instantly and accurately. Simplify your payout workflows and eliminate manual transaction errors.',
    floatingTitle: 'Payout Processed',
    floatingValue: '$12,450 to 8 Agents',
  },
  insights: {
    badge: 'SyncInsights Enterprise',
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
              alt={t('landing.nav.logoAlt', 'SyncSyrius Logo')}
              className="h-8 w-auto rounded object-contain"
            />
            <span className="text-xl font-bold tracking-tight text-white">
              {t('landing.nav.brand', 'SyncSyrius')}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#platform" className="text-slate-300 hover:text-white transition-colors">
              {t('landing.nav.products', 'Products')}
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
              {t('landing.nav.bookDemo', 'Book a Demo')}
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
              <Link
                to="/demo"
                className="bg-white text-black py-4 rounded-xl mt-4 font-medium flex items-center justify-center gap-2"
              >
                {t('landing.nav.bookDemo', 'Book a Demo')} <ArrowRight className="w-5 h-5" />
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
                          {t('landing.hero.requestDemo', 'Request Demo')}
                        </Link>
                      </div>

                      <div className="mt-12 flex items-center gap-8 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-slate-400" />
                          <span>{t('landing.hero.trustBadge1', 'Seamless integration')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-slate-400" />
                          <span>{t('landing.hero.trustBadge2', 'Cancel anytime')}</span>
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

      <section id="benefits" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              {t('landing.benefits.heading', 'Automate the invisible.')}
            </h2>
            <p className="text-lg text-slate-400">
              {t(
                'landing.benefits.subheading',
                'Manual commission tracking is prone to human error. Our intelligent platform cross-references your carrier statements with your internal data in seconds.',
              )}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BarChart3 />}
              title={t('landing.benefits.card1.title', 'Real-time Reconciliation')}
              description={t(
                'landing.benefits.card1.description',
                'Automatically match expected commissions against actual carrier payouts as soon as statements arrive.',
              )}
            />
            <FeatureCard
              icon={<ShieldCheck />}
              title={t('landing.benefits.card2.title', 'Discrepancy Detection')}
              description={t(
                'landing.benefits.card2.description',
                'Instantly flag missing payments, incorrect rates, and clawback errors before the books close.',
              )}
            />
            <FeatureCard
              icon={<Zap />}
              title={t('landing.benefits.card3.title', 'Automated Resolution')}
              description={t(
                'landing.benefits.card3.description',
                'Generate one-click dispute reports formatted exactly how carriers need them to resolve issues fast.',
              )}
            />
          </div>
        </div>
      </section>

      <section id="security" className="py-24 border-t border-white/5 bg-[#0A0A0A]">
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

      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-purple-900/20" />
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-8">
            {t('landing.cta.heading', 'Ready to transform your revenue?')}
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            {t(
              'landing.cta.subheading',
              'Join the agencies optimizing their finances with the SyncSyrius product suite.',
            )}
          </p>
          <Link
            to="/demo"
            className="px-10 py-5 bg-white text-black text-xl font-bold rounded-full hover:bg-slate-200 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.3)] inline-block"
          >
            {t('landing.cta.button', 'Schedule a Demo Today')}
          </Link>
        </div>
      </section>

      <footer className="py-12 border-t border-white/10 text-sm text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-white">
            <ImageWithFallback
              src={LOGO_SRC}
              alt={t('landing.footer.logoAlt', 'SyncSyrius Logo Alt')}
              className="h-6 w-auto rounded object-contain grayscale opacity-80"
            />
            <span className="font-bold text-lg tracking-tight">
              {t('landing.footer.brand', 'SyncSyrius')}
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
            {t('landing.footer.copyright', '© {{year}} SyncSyrius. All rights reserved.', {
              year: new Date().getFullYear(),
            })}
          </p>
        </div>
      </footer>
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
