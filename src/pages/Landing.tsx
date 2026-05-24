import React, { useState, useEffect, useRef, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  Wallet,
  Globe2,
  DollarSign,
  BarChart2,
  Monitor,
  Code2,
  Check,
  Minus,
  Sparkles,
  MapPin,
  Clock,
  Mail,
  Phone,
} from 'lucide-react'

import { ImageWithFallback } from '@/components/figma/ImageWithFallback'
import { useDocumentMeta } from '@/components/SEO'
import LanguageSwitcher from '@/i18n/LanguageSwitcher'
import { useLocaleStore } from '@/store/useLocaleStore'

const LOGO_SRC = '/logos/syncsirius-logo.png'

const CAROUSEL_SLIDES = [
  {
    id: 'revenue',
    badge: 'SyncRevenue 2.0 is now live',
    title: 'Recover lost revenue.',
    titleHighlight: 'Instantly.',
    description: 'The automated commission auditing platform that finds missing agency revenue before it hits your bottom line. Stop leaving money on the table.',
    image: 'https://images.unsplash.com/photo-1666875753105-c63a6f3bdc86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwYW5hbHl0aWNzJTIwZGFzaGJvYXJkJTIwZGFzaGJvYXJkfGVufDF8fHx8MTc3OTQ3OTI1N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    primaryColor: 'from-indigo-400 via-purple-400 to-pink-400',
    floatingIcon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
    floatingTitle: 'Recovered this month',
    floatingValue: '+$24,500.00',
    floatingBg: 'bg-emerald-500/20',
  },
  {
    id: 'pay',
    badge: 'Introducing SyncPay',
    title: 'Automate payouts.',
    titleHighlight: 'Flawlessly.',
    description: 'Route commissions to your agents instantly and accurately. Simplify your payout workflows and eliminate manual transaction errors.',
    image: 'https://images.unsplash.com/photo-1509017174183-0b7e0278f1ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwcGF5bWVudCUyMHRyYW5zYWN0aW9ufGVufDF8fHx8MTc3OTQ3OTgxN3ww&ixlib=rb-4.1.0&q=80&w=1080',
    primaryColor: 'from-blue-400 via-cyan-400 to-teal-400',
    floatingIcon: <Wallet className="w-5 h-5 text-blue-400" />,
    floatingTitle: 'Payout Processed',
    floatingValue: '$12,450 to 8 Agents',
    floatingBg: 'bg-blue-500/20',
  },
  {
    id: 'insights',
    badge: 'SyncInsights Enterprise',
    title: 'Predictive analytics.',
    titleHighlight: 'Visualized.',
    description: 'Forecast cash flow and visualize agency performance across global territories. Turn raw commission data into strategic business intelligence.',
    image: 'https://images.unsplash.com/photo-1576185850227-1f72b7f8d483?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnbG9iYWwlMjBmaW5hbmNlJTIwYnVzaW5lc3MlMjBtYXAlMjBhYnN0cmFjdHxlbnwxfHx8fDE3Nzk0Nzk4MzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    primaryColor: 'from-amber-400 via-orange-400 to-rose-400',
    floatingIcon: <Globe2 className="w-5 h-5 text-amber-400" />,
    floatingTitle: 'Global Forecast',
    floatingValue: '+18% YoY Growth',
    floatingBg: 'bg-amber-500/20',
  },
] as const

const NAV_LINKS = [
  { label: 'Product', href: '#platform' },
  { label: 'Services', href: '#services' },
  { label: 'Comparison', href: '#comparison' },
  { label: 'Security', href: '#security' },
  { label: 'Clients', href: '#clients' },
  { label: 'Team', href: '#equipe' },
  { label: 'Contact', href: '#contato' },
]

const STATS = [
  { value: '$2M+', label: 'Revenue recovered' },
  { value: '99.99%', label: 'Commission assertivity' },
  { value: '4', label: 'GDS platforms' },
  { value: '<48h', label: 'Proposal turnaround' },
]

const TRUST_LOGOS = [
  { name: 'Pacific Horizon', abbr: 'PH', color: 'text-blue-400' },
  { name: 'Atlas Corporate', abbr: 'AC', color: 'text-purple-400' },
  { name: 'Summit Leisure', abbr: 'SL', color: 'text-cyan-400' },
  { name: 'Meridian BT', abbr: 'MB', color: 'text-indigo-400' },
  { name: 'TerraVox', abbr: 'TV', color: 'text-violet-400' },
]

const GDS_LIST = [
  { name: 'Amadeus', description: 'Global leader in travel technology' },
  { name: 'Sabre', description: 'End-to-end travel marketplace' },
  { name: 'Galileo', description: 'Travelport GDS platform' },
  { name: 'Worldspan', description: 'Travelport legacy distribution' },
]

const SERVICES_LIST = [
  { key: 'syncrevenue', icon: DollarSign, title: 'SyncRevenue', description: 'Automated GDS commission reconciliation and recovery for travel agencies.', accent: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { key: 'analytics', icon: BarChart2, title: 'BI & Data Analytics', description: 'Turn your booking and commission data into actionable business intelligence.', accent: 'text-purple-400', bg: 'bg-purple-500/10' },
  { key: 'obts', icon: Monitor, title: 'Online Booking Tools', description: 'Implementation, optimization, and support for OBT platforms.', accent: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { key: 'custom', icon: Code2, title: 'Custom Development', description: 'Bespoke solutions for complex airline distribution and revenue challenges.', accent: 'text-emerald-400', bg: 'bg-emerald-500/10' },
] as const

const COMPARISON_FEATURES = [
  'BSP/ARC Reconciliation',
  'Debit Memo Dispute Management',
  'Multi-GDS Integration',
  'Real-Time Commission Reporting',
  'Automated Audit Trail',
]

const COMPARISON_COLUMNS = [
  {
    id: 'legacy',
    label: 'Manual / Legacy',
    highlight: false,
    items: [
      'Spreadsheet matching after close — issues pile up monthly.',
      'Teams track reason codes and notes manually.',
      'Single-GDS views or copied exports only.',
      'Monthly reports delay visibility into missed revenue.',
      'Evidence scattered across emails and spreadsheets.',
    ],
  },
  {
    id: 'syncrevenue',
    label: 'SyncRevenue',
    highlight: true,
    items: [
      'Detects settlement discrepancies before revenue leaks.',
      'Links every dispute to booking history and recovery status.',
      'Covers Amadeus, Sabre, Galileo, and Worldspan natively.',
      'Shows recovery status and exceptions as work progresses.',
      'System records for every reconciliation action and outcome.',
    ],
  },
  {
    id: 'generic',
    label: 'Generic Tools',
    highlight: false,
    items: [
      'No airline settlement workflow model without heavy config.',
      'Custom task processes needed to link disputes and commissions.',
      'CSV imports and manual mapping before analysis.',
      'Dashboards require manual refreshes and spreadsheet upkeep.',
      'Notes and attachments without travel-specific traceability.',
    ],
  },
]

const AUDIT_ROLES = ['Agency Owner', 'Finance Manager', 'Operations Director', 'Revenue Manager', 'Other']
const AUDIT_GDS_OPTIONS = ['Amadeus', 'Sabre', 'Travelport (Galileo/Worldspan)', 'Multiple GDS', 'Other']
const AUDIT_BULLETS = [
  'We analyse 30 days of your BSP/ARC data at no cost',
  'Receive a written report on commission discrepancies found',
  'No obligation — keep the report regardless of next steps',
]

const CLIENT_REFERENCES = [
  { agency: 'Pacific Horizon Travel', location: 'Los Angeles, CA', pill: 'Commission Recovery', body: 'SyncRevenue identified over $38,000 in uncollected commissions in the first 60 days. The audit report alone was worth every minute of setup.', muted: false },
  { agency: 'Atlas Corporate Solutions', location: 'New York, NY', pill: 'BSP Reconciliation', body: 'The debit memo dispute workflow finally gives us a clear paper trail for every carrier dispute. Our finance team saves 3 days a month on reconciliation.', muted: false },
  { agency: 'Summit Leisure Group', location: 'Miami, FL', pill: 'Multi-GDS Client', body: 'We run both Amadeus and Sabre. SyncRevenue normalizes both feeds into a single view — something we could never do with spreadsheets.', muted: false },
  { agency: 'Meridian Business Travel', location: 'Chicago, IL', pill: 'Early Access', body: 'We provided a reference as early design partners. The team is highly responsive and the product roadmap is exactly what the industry needs.', muted: true },
  { agency: 'TerraVox Travel Management', location: 'Dallas, TX', pill: 'Reference Available', body: "Happy to speak with prospective clients. Our controller describes it as 'the reconciliation tool we should have had 10 years ago.'", muted: true },
  { agency: 'Veritas Global Travel', location: 'San Francisco, CA', pill: 'Commission Audit', body: 'The free audit showed us exactly where our Amadeus BSP commissions were falling through the cracks. Recovered $22K in the first quarter.', muted: false },
]

const DEMO_STEPS = [
  { num: 1, title: 'Book a 30-minute call', body: 'A quick discovery call with Maria or Lucas to understand your GDS setup and commission pain points.' },
  { num: 2, title: 'Live demo on your contracts', body: "We run SyncRevenue against a sample of your real BSP data so you can see exactly what you're missing." },
  { num: 3, title: 'Clear proposal in 48 hours', body: 'Receive a specific recovery estimate and implementation plan. No commitment required.' },
]

const CONTACT_CHANNELS = [
  { kind: 'email', label: 'Email', value: 'hello@syncsirius.com', Icon: Mail, href: 'mailto:hello@syncsirius.com' as string | null },
  { kind: 'phone', label: 'Phone', value: '+1 (800) 796-2738', Icon: Phone, href: 'tel:+18007962738' as string | null },
  { kind: 'address', label: 'Address', value: 'Miami, FL — USA', Icon: MapPin, href: null as string | null },
]

const ctaPrimary =
  'inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm shadow-[0_0_28px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_rgba(99,102,241,0.6)] hover:from-indigo-400 hover:to-purple-500 transition-all duration-200'

const ctaSecondary =
  'inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-white/10 bg-white/[0.04] text-white font-semibold text-sm hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200'

function monogram(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

export default function Landing() {
  const { t } = useTranslation()

  useDocumentMeta({
    titleKey: 'seo.landing.title',
    descriptionKey: 'seo.landing.description',
    ogTitleKey: 'seo.landing.ogTitle',
    ogDescriptionKey: 'seo.landing.ogDescription',
    path: '/',
  })

  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  const [auditForm, setAuditForm] = useState({ name: '', email: '', company: '', role: '', gds: '', notes: '' })
  const [auditErrors, setAuditErrors] = useState<Partial<typeof auditForm>>({})
  const [auditStatus, setAuditStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [contactStatus, setContactStatus] = useState<'idle' | 'submitting' | 'success'>('idle')

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
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
      if (event.key === 'Escape') { setMobileMenuOpen(false); return }
      if (event.key !== 'Tab' || !menu) return
      const focusableElements = Array.from(
        menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
      ).filter(el => el.offsetParent !== null)
      const first = focusableElements[0]
      const last = focusableElements[focusableElements.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', handleKeyDown) }
  }, [mobileMenuOpen])

  function validateAudit() {
    const next: Partial<typeof auditForm> = {}
    if (!auditForm.name.trim()) next.name = 'Required'
    if (!auditForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(auditForm.email)) next.email = 'Valid email required'
    if (!auditForm.company.trim()) next.company = 'Required'
    if (!auditForm.role) next.role = 'Please select a role'
    if (!auditForm.gds) next.gds = 'Please select your GDS'
    return next
  }

  async function handleAuditSubmit(e: FormEvent) {
    e.preventDefault()
    const errs = validateAudit()
    if (Object.keys(errs).length) { setAuditErrors(errs); return }
    setAuditStatus('submitting')
    await new Promise(r => setTimeout(r, 1200))
    setAuditStatus('success')
  }

  async function handleContactSubmit(e: FormEvent) {
    e.preventDefault()
    if (!contactForm.name || !contactForm.email || !contactForm.message) return
    setContactStatus('submitting')
    await new Promise(r => setTimeout(r, 1000))
    setContactStatus('success')
  }

  const auditInputClass = (k: keyof typeof auditForm) =>
    `mt-1.5 w-full rounded-xl border ${auditErrors[k] ? 'border-red-500/60' : 'border-white/10'} bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:bg-white/[0.06] transition-colors`

  const contactInputClass =
    'mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:bg-white/[0.06] transition-colors'

  return (
    <div className="min-h-screen bg-[#020204] text-slate-50 font-sans selection:bg-indigo-500/30">

      {/* Nav */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b ${
          isScrolled
            ? 'bg-[#020204]/85 backdrop-blur-xl border-white/8 py-3'
            : 'bg-transparent border-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageWithFallback
              src={LOGO_SRC}
              alt={t('landing.nav.logoAlt', 'Sync Sirius logo')}
              className="h-8 w-auto object-contain"
            />
          </div>

          <div className="hidden lg:flex items-center gap-7 text-sm font-medium">
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href} className="text-slate-400 hover:text-white transition-colors duration-150">
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <LanguageSwitcher />
            <Link to="/dashboard" className="text-sm font-medium text-slate-400 hover:text-white transition-colors px-4 py-2">
              {t('landing.nav.login', 'Log in')}
            </Link>
            <Link to="/demo" className={ctaPrimary}>
              {t('landing.nav.bookDemo', 'Book a Demo')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen
              ? t('landing.nav.closeMenu', 'Close menu')
              : t('landing.nav.openMenu', 'Open menu')}
            aria-expanded={mobileMenuOpen}
            aria-controls="landing-mobile-menu"
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
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
            className="fixed inset-0 z-40 bg-[#020204] pt-20 px-6 overflow-y-auto lg:hidden"
          >
            <div className="flex flex-col gap-5">
              {NAV_LINKS.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="border-b border-white/5 pb-4 text-slate-300 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/demo"
                className={`${ctaPrimary} justify-center mt-2 text-base py-4`}
                onClick={() => setMobileMenuOpen(false)}
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

      {/* ── Hero carousel ────────────────────────────────────────── */}
      <section id="platform" className="relative min-h-[100vh] pt-32 pb-20 flex flex-col justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-[700px] h-[700px] rounded-full bg-indigo-900/15 blur-[140px]" />
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-900/15 blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          <style>{`
            .slick-dots li.slick-active div { background-color: white !important; width: 2rem !important; }
            .slick-dots li { margin: 0 4px; }
          `}</style>

          <Slider
            dots
            infinite
            speed={800}
            slidesToShow={1}
            slidesToScroll={1}
            autoplay
            autoplaySpeed={6000}
            arrows={false}
            fade
            customPaging={() => (
              <div className="w-12 h-1.5 mt-8 rounded-full bg-white/20 transition-all duration-300 hover:bg-white/40" />
            )}
          >
            {CAROUSEL_SLIDES.map(slide => (
              <div key={slide.id} className="outline-none focus:outline-none py-12">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                  {/* Left — copy */}
                  <div className="pr-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-sm mb-8 text-indigo-300">
                      <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                      {slide.badge}
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6">
                      {slide.title}<br />
                      <span className={`text-transparent bg-clip-text bg-gradient-to-r ${slide.primaryColor}`}>
                        {slide.titleHighlight}
                      </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-xl leading-relaxed min-h-[84px]">
                      {slide.description}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <Link to="/dashboard" className={`${ctaPrimary} text-lg px-8 py-4 w-full sm:w-auto`}>
                        {slide.id === 'revenue' ? t('landing.hero.explorePlatform', 'Explore Platform') : 'Explore Product'}
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                      <Link to="/demo" className={`${ctaSecondary} text-lg px-8 py-4 w-full sm:w-auto`}>
                        <PlayCircle className="w-5 h-5" />
                        {t('landing.hero.requestDemo', 'Request Demo')}
                      </Link>
                    </div>

                    <div className="mt-12 flex items-center gap-8 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                        <span>Seamless integration</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                        <span>{t('landing.hero.trust3', 'Cancel anytime')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right — image + floating cards */}
                  <div className="relative hidden lg:block">
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] mix-blend-screen opacity-20 bg-gradient-to-r ${slide.primaryColor}`} />

                    <div className="relative rounded-2xl border border-white/10 bg-[#0D0F1E]/80 backdrop-blur-xl p-2 shadow-2xl z-10">
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="rounded-xl border border-white/5 opacity-80 h-[450px] w-full object-cover grayscale-[0.2]"
                      />

                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                        className="absolute -left-12 top-24 bg-[#1A1C2E] border border-white/10 rounded-xl p-4 shadow-xl flex items-center gap-4"
                      >
                        <div className={`w-10 h-10 rounded-full ${slide.floatingBg} flex items-center justify-center`}>
                          {slide.floatingIcon}
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">{slide.floatingTitle}</p>
                          <p className="text-lg font-bold text-white">{slide.floatingValue}</p>
                        </div>
                      </motion.div>

                      <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1 }}
                        className="absolute -right-8 bottom-12 bg-[#1A1C2E] border border-white/10 rounded-xl p-4 shadow-xl"
                      >
                        <div className="flex items-center justify-between mb-2 gap-4">
                          <p className="text-xs text-slate-400">System Status</p>
                          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                        </div>
                        <p className="text-sm font-medium text-white flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-indigo-400" />
                          Live Sync Active
                        </p>
                      </motion.div>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </Slider>
        </div>
      </section>

      {/* ── Stat strip ───────────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-[#07091A]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x divide-white/5">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="text-center px-6"
              >
                <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                  {stat.value}
                </p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust bar ────────────────────────────────────────────── */}
      <section id="customers" className="py-14 border-b border-white/5 bg-[#020204]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-medium text-slate-600 tracking-widest uppercase mb-10">
            {t('landing.trust.heading', 'Trusted by forward-thinking travel agencies')}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {TRUST_LOGOS.map(logo => (
              <div key={logo.name} className="flex items-center gap-2.5 opacity-40 hover:opacity-70 transition-opacity duration-200 grayscale hover:grayscale-0">
                <div className={`w-8 h-8 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center text-[11px] font-bold ${logo.color}`}>
                  {logo.abbr}
                </div>
                <span className="text-sm font-semibold text-slate-300 tracking-tight">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ─────────────────────────────────────────────── */}
      <section id="benefits" className="py-28 bg-[#07091A]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-4">
              <span className="inline-block h-px w-6 bg-indigo-400/50" />
              {t('landing.benefits.eyebrow', 'Why it matters')}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">{t('landing.benefits.heading', 'Automate the invisible.')}</h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              {t('landing.benefits.subheading', 'Manual commission tracking is prone to human error. Our intelligent platform cross-references carrier statements with your internal data in seconds.')}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<BarChart3 />}
              title={t('landing.benefits.card1.title', 'Real-time Reconciliation')}
              description={t('landing.benefits.card1.description', 'Automatically match expected commissions against actual carrier payouts as soon as statements arrive.')}
              accent="from-indigo-500/10 to-indigo-500/5 text-indigo-400"
            />
            <FeatureCard
              icon={<ShieldCheck />}
              title={t('landing.benefits.card2.title', 'Discrepancy Detection')}
              description={t('landing.benefits.card2.description', 'Instantly flag missing payments, incorrect rates, and clawback errors before the books close.')}
              accent="from-purple-500/10 to-purple-500/5 text-purple-400"
            />
            <FeatureCard
              icon={<Zap />}
              title={t('landing.benefits.card3.title', 'Automated Resolution')}
              description={t('landing.benefits.card3.description', 'Generate one-click dispute reports formatted exactly how carriers need them to resolve issues fast.')}
              accent="from-cyan-500/10 to-cyan-500/5 text-cyan-400"
            />
          </div>
        </div>
      </section>

      {/* ── GDS / SyncRevenue ────────────────────────────────────── */}
      <section id="syncrevenue" className="py-24 bg-[#07091A] border-t border-white/5 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-4">
              <span className="inline-block h-px w-6 bg-indigo-400/50" />
              {t('syncrevenue.eyebrow', 'Our Flagship Product')}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              {t('syncrevenue.headline', 'Automated Commission Reconciliation')}
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              {t('syncrevenue.subtext', 'SyncRevenue connects to your GDS feeds and automatically identifies commission discrepancies, disputed debit memos, and BSP/ARC reconciliation failures — recovering revenue your team would otherwise miss.')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500 mb-6">
              {t('syncrevenue.gds.title', 'GDS Integrations')}
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {GDS_LIST.map((gds, i) => (
                <motion.div
                  key={gds.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5 text-center hover:border-indigo-500/40 hover:bg-white/[0.05] transition-all duration-200"
                >
                  <span className="text-base font-bold tracking-tight text-white">{gds.name}</span>
                  <p className="mt-1 text-xs text-slate-500 leading-snug">{gds.description}</p>
                </motion.div>
              ))}
            </div>

            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] p-8 text-center">
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-2">
                99.99%
              </div>
              <p className="text-slate-300 font-medium">
                {t('syncrevenue.accuracy', 'Commission assertivity across all integrated GDS platforms.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────────── */}
      <section id="services" className="py-24 bg-[#020204] border-t border-white/5 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-4">
              <span className="inline-block h-px w-6 bg-indigo-400/50" />
              {t('services.eyebrow', 'Our Services')}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              {t('services.headline', 'Complete Revenue Intelligence Suite')}
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              {t('services.subtext', 'Whether you need automated reconciliation, data analytics, or custom development, we have the expertise to solve your specific challenge.')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES_LIST.map((svc, i) => (
              <motion.article
                key={svc.key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/[0.03] border border-white/5 rounded-2xl p-7 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-200 group"
              >
                <div className={`w-12 h-12 ${svc.bg} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <svc.icon className={`w-5 h-5 ${svc.accent}`} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{t(`services.${svc.key}.title`, svc.title)}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{t(`services.${svc.key}.description`, svc.description)}</p>
              </motion.article>
            ))}
          </div>

          <p className="mt-12 text-center text-sm text-slate-500">
            {t('services.contact', 'Not sure which service fits?')}{' '}
            <a href="#contato" className="text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-2">
              {t('services.contactLink', 'Contact us.')}
            </a>
          </p>
        </div>
      </section>

      {/* ── Comparison ───────────────────────────────────────────── */}
      <section id="comparison" className="py-24 bg-[#020204] border-t border-white/5 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-4">
              <span className="inline-block h-px w-6 bg-indigo-400/50" />
              {t('comparison.eyebrow', 'Why SyncRevenue')}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              {t('comparison.headline', 'Stop Losing Revenue to Manual Processes')}
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              {t('comparison.subtext', 'See how automated commission management compares to the status quo.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {COMPARISON_COLUMNS.map((col, ci) => (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: ci * 0.1 }}
                className={`relative rounded-2xl border p-7 flex flex-col ${
                  col.highlight
                    ? 'border-indigo-500/50 bg-indigo-950/40 shadow-[0_0_48px_rgba(99,102,241,0.15)]'
                    : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                {col.highlight && (
                  <>
                    <div className="pointer-events-none absolute -top-px left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full border border-indigo-400/40 bg-indigo-500/20 px-3 py-1 text-[11px] font-semibold text-indigo-300">
                      <Sparkles className="w-3 h-3" />
                      Recommended
                    </span>
                  </>
                )}

                <h3 className={`text-base font-bold mb-6 ${col.highlight ? 'text-white' : 'text-slate-400'}`}>
                  {col.label}
                </h3>

                <ul className="flex flex-col gap-4">
                  {COMPARISON_FEATURES.map((feat, fi) => (
                    <li key={feat}>
                      <div className="flex gap-2.5 items-start">
                        {col.highlight ? (
                          <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        ) : (
                          <Minus className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className={`text-[11px] font-semibold uppercase tracking-wide mb-1 ${col.highlight ? 'text-indigo-300' : 'text-slate-600'}`}>
                            {feat}
                          </p>
                          <p className={`text-sm leading-relaxed ${col.highlight ? 'text-slate-300' : 'text-slate-600'}`}>
                            {col.items[fi]}
                          </p>
                        </div>
                      </div>
                      {fi < COMPARISON_FEATURES.length - 1 && (
                        <div className={`mt-4 h-px ${col.highlight ? 'bg-indigo-500/15' : 'bg-white/[0.04]'}`} />
                      )}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Commission Audit ─────────────────────────────────────── */}
      <section id="commission-audit" className="py-24 bg-[#020204] border-t border-white/5 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-4">
              <span className="inline-block h-px w-6 bg-indigo-400/50" />
              {t('sections.commissionAudit.eyebrow', 'Free Commission Audit')}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              {t('sections.commissionAudit.heading', 'Free Commission Leakage Audit')}
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              {t('sections.commissionAudit.subheading', 'Send us 30 days of BSP data and we will return a written report on how much commission your agency is leaving on the table.')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-12 max-w-4xl mx-auto">
            {AUDIT_BULLETS.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-5"
              >
                <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-300 leading-relaxed">{b}</p>
              </motion.div>
            ))}
          </div>

          <div className="max-w-2xl mx-auto">
            {auditStatus === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-indigo-500/30 bg-indigo-500/[0.06] p-10 text-center"
              >
                <CheckCircle2 className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Request received!</h3>
                <p className="text-slate-400">Our team will reach out shortly with your free audit report.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleAuditSubmit} noValidate className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
                <h3 className="text-lg font-bold text-white mb-6">Commission Audit Request</h3>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-400">Full Name <span className="text-indigo-400">*</span></label>
                    <input
                      value={auditForm.name}
                      onChange={e => setAuditForm(f => ({ ...f, name: e.target.value }))}
                      onBlur={() => { const errs = validateAudit(); setAuditErrors(prev => ({ ...prev, name: errs.name })) }}
                      className={auditInputClass('name')}
                      placeholder="Your name"
                      autoComplete="name"
                    />
                    {auditErrors.name && <p className="mt-1 text-xs text-red-400">{auditErrors.name}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400">Work Email <span className="text-indigo-400">*</span></label>
                    <input
                      value={auditForm.email}
                      onChange={e => setAuditForm(f => ({ ...f, email: e.target.value }))}
                      onBlur={() => { const errs = validateAudit(); setAuditErrors(prev => ({ ...prev, email: errs.email })) }}
                      type="email"
                      className={auditInputClass('email')}
                      placeholder="you@agency.com"
                      autoComplete="email"
                    />
                    {auditErrors.email && <p className="mt-1 text-xs text-red-400">{auditErrors.email}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400">Company <span className="text-indigo-400">*</span></label>
                    <input
                      value={auditForm.company}
                      onChange={e => setAuditForm(f => ({ ...f, company: e.target.value }))}
                      onBlur={() => { const errs = validateAudit(); setAuditErrors(prev => ({ ...prev, company: errs.company })) }}
                      className={auditInputClass('company')}
                      placeholder="Travel Agency Name"
                      autoComplete="organization"
                    />
                    {auditErrors.company && <p className="mt-1 text-xs text-red-400">{auditErrors.company}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400">Your Role <span className="text-indigo-400">*</span></label>
                    <select
                      value={auditForm.role}
                      onChange={e => setAuditForm(f => ({ ...f, role: e.target.value }))}
                      className={auditInputClass('role')}
                    >
                      <option value="">Select your role</option>
                      {AUDIT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {auditErrors.role && <p className="mt-1 text-xs text-red-400">{auditErrors.role}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-slate-400">Primary GDS <span className="text-indigo-400">*</span></label>
                    <select
                      value={auditForm.gds}
                      onChange={e => setAuditForm(f => ({ ...f, gds: e.target.value }))}
                      className={auditInputClass('gds')}
                    >
                      <option value="">Select your GDS</option>
                      {AUDIT_GDS_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    {auditErrors.gds && <p className="mt-1 text-xs text-red-400">{auditErrors.gds}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-slate-400">Notes (optional)</label>
                    <textarea
                      value={auditForm.notes}
                      onChange={e => setAuditForm(f => ({ ...f, notes: e.target.value }))}
                      rows={4}
                      className={`${auditInputClass('notes')} resize-y`}
                      placeholder="Share anything relevant about your BSP setup."
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={auditStatus === 'submitting'}
                  className="mt-6 inline-flex items-center gap-2 px-7 py-3.5 bg-white text-black font-semibold rounded-full hover:bg-slate-200 transition-colors disabled:opacity-60"
                >
                  {auditStatus === 'submitting' ? (
                    <><span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />Sending...</>
                  ) : (
                    <>Request my free audit <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Security ─────────────────────────────────────────────── */}
      <section id="security" className="py-24 border-t border-white/5 bg-[#07091A]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-4">
              <span className="inline-block h-px w-6 bg-indigo-400/50" />
              {t('landing.security.eyebrow', 'Security & Trust')}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">{t('landing.security.heading', 'Your data is protected.')}</h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              {t('landing.security.subheading', 'Clear commitments for website inquiries and SyncRevenue product data handling. GDS credentials never touch the website.')}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { title: t('landing.security.e2e.title', 'Encrypted Transmission'), sub: t('landing.security.e2e.sub', 'TLS in transit · AES-256 at rest'), icon: <ShieldCheck className="w-6 h-6" /> },
              { title: t('landing.security.soc2.title', 'SOC 2 Roadmap'), sub: t('landing.security.soc2.sub', 'Certification milestones in progress'), icon: <CheckCircle2 className="w-6 h-6" /> },
              { title: t('landing.security.rbac.title', 'Role-Based Access'), sub: t('landing.security.rbac.sub', 'Granular permission controls'), icon: <Zap className="w-6 h-6" /> },
              { title: t('landing.security.uptime.title', 'Data Separation'), sub: t('landing.security.uptime.sub', 'Website & product data stay isolated'), icon: <BarChart3 className="w-6 h-6" /> },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <div className="font-bold text-white mb-1 text-sm">{item.title}</div>
                <div className="text-xs text-slate-500 leading-snug">{item.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Client References ────────────────────────────────────── */}
      <section id="clients" className="py-24 bg-[#07091A] border-t border-white/5 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-4">
              <span className="inline-block h-px w-6 bg-indigo-400/50" />
              {t('clients.eyebrow', 'Client References')}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              {t('clients.heading.text', 'Trusted by real')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                {t('clients.heading.accent', 'agencies')}
              </span>
            </h2>
            <p className="text-lg text-slate-400">{t('clients.subtext', 'Named references are shared directly with approval.')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CLIENT_REFERENCES.map((ref, i) => (
              <motion.article
                key={`${ref.agency}-${i}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.1 }}
                className="relative flex flex-col rounded-2xl border border-white/5 bg-white/[0.03] px-7 pt-8 pb-6 hover:border-white/10 hover:bg-white/[0.05] transition-all duration-200"
              >
                <span aria-hidden className="pointer-events-none absolute right-6 top-5 font-serif text-6xl leading-none text-white/[0.06]">"</span>
                <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-widest text-slate-400">
                  {ref.pill}
                </span>
                <p className={`mt-5 text-sm leading-relaxed flex-1 ${ref.muted ? 'italic text-slate-500' : 'text-slate-300'}`}>
                  {ref.body}
                </p>
                <div className="mt-5 flex items-center gap-3 pt-5 border-t border-white/5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white text-xs font-bold">
                    {monogram(ref.agency)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">{ref.agency}</p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {ref.location}
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          <div className="mt-14 flex justify-center">
            <a
              href="#contato"
              className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-transparent px-6 py-3 text-sm font-semibold text-white hover:bg-white/[0.04] transition-colors"
            >
              {t('clients.cta', 'Request References')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Team ─────────────────────────────────────────────────── */}
      <section id="equipe" className="py-24 bg-[#020204] border-t border-white/5 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-4">
              <span className="inline-block h-px w-6 bg-indigo-400/50" />
              {t('team.eyebrow', 'Our Team')}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              {t('team.headline', 'Specialists in')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                {t('team.headlineAccent', 'airline distribution')}
              </span>
            </h2>
            <p className="text-lg text-slate-400">
              {t('team.subtext', "A team that has lived inside the GDS and BSP workflows you're trying to fix.")}
            </p>
          </div>
          <LandingTeamGrid />
        </div>
      </section>

      {/* ── Demo ─────────────────────────────────────────────────── */}
      <section id="demo" className="py-24 bg-[#07091A] border-t border-white/5 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-4">
              <span className="inline-block h-px w-6 bg-indigo-400/50" />
              {t('demo.eyebrow', 'Schedule a demo')}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              {t('demo.heading.text', 'See SyncRevenue running')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                {t('demo.heading.accent', 'in your workflow')}
              </span>
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              {t('demo.subtext', 'A short conversation with the team, a personalized demo on your real contracts, and a clear proposal in 48 hours. No commitment.')}
            </p>
          </div>

          <div className="grid md:grid-cols-[1fr_1.4fr] gap-10 max-w-5xl mx-auto items-start">
            <div>
              <h3 className="text-base font-semibold text-slate-200 mb-6">{t('demo.whatToExpect', 'What to expect')}</h3>
              <ol className="flex flex-col gap-5">
                {DEMO_STEPS.map((step, i) => (
                  <motion.li
                    key={step.num}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 font-bold text-sm">
                      {step.num}
                    </span>
                    <div>
                      <strong className="block text-sm font-semibold text-white mb-1">{step.title}</strong>
                      <span className="text-sm text-slate-400 leading-relaxed">{step.body}</span>
                    </div>
                  </motion.li>
                ))}
              </ol>

              <div className="mt-8 flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t('demo.replyTime', 'Reply within 1 business day')}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t('demo.replyDetail', 'Maria or Lucas reaches out personally.')}</p>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center"
            >
              <h3 className="text-xl font-bold text-white mb-4">{t('demo.cardTitle', 'Book your personalized demo')}</h3>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                {t('demo.cardBody', "Fill out a short form and we'll schedule a session tailored to your GDS setup and commission recovery goals.")}
              </p>
              <Link to="/demo" className={`${ctaPrimary} w-full text-base px-8 py-4`}>
                {t('demo.cta', 'Request a Demo')}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="mt-5 text-xs text-slate-600">
                {t('demo.disclaimer', 'No credit card. No obligation. Cancel anytime.')}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────────────── */}
      <section id="contato" className="py-24 bg-[#020204] border-t border-white/5 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-4">
              <span className="inline-block h-px w-6 bg-indigo-400/50" />
              {t('contact.eyebrow', 'Contact')}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              {t('contact.heading.text', 'Talk to')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                {t('contact.heading.accent', 'Sync Sirius')}
              </span>
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              {t('contact.subhead', 'For commercial questions, support, partnerships, or press — your message reaches the right team.')}
            </p>
          </div>

          <div className="grid md:grid-cols-[1fr_1.4fr] gap-10 max-w-5xl mx-auto items-start">
            <div>
              <div className="flex flex-col gap-3">
                {CONTACT_CHANNELS.map(ch => {
                  const inner = (
                    <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-4 hover:border-white/10 hover:bg-white/[0.05] transition-colors">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                        <ch.Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">{ch.label}</p>
                        <p className="text-sm font-semibold text-white mt-0.5">{ch.value}</p>
                      </div>
                    </div>
                  )
                  return ch.href ? (
                    <a key={ch.kind} href={ch.href}>{inner}</a>
                  ) : (
                    <div key={ch.kind}>{inner}</div>
                  )
                })}
              </div>

              <div className="mt-5 flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t('contact.infoCard.title', 'Average response time')}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t('contact.infoCard.subtitle', 'Under 4 hours on business days.')}</p>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {contactStatus === 'success' ? (
                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/[0.06] p-10 text-center">
                  <CheckCircle2 className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Message sent!</h3>
                  <p className="text-slate-400">We'll get back to you within a few hours on business days.</p>
                </div>
              ) : (
                <form
                  onSubmit={handleContactSubmit}
                  noValidate
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 flex flex-col gap-5"
                >
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-semibold text-slate-400">{t('contact.form.name', 'Name')}</label>
                      <input
                        name="name"
                        value={contactForm.name}
                        onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                        required
                        className={contactInputClass}
                        placeholder="Your name"
                        autoComplete="name"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400">{t('contact.form.email', 'Email')}</label>
                      <input
                        name="email"
                        type="email"
                        value={contactForm.email}
                        onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                        required
                        className={contactInputClass}
                        placeholder="you@agency.com"
                        autoComplete="email"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400">{t('contact.form.subject', 'Subject')}</label>
                    <input
                      name="subject"
                      value={contactForm.subject}
                      onChange={e => setContactForm(f => ({ ...f, subject: e.target.value }))}
                      className={contactInputClass}
                      placeholder="What's this about?"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400">{t('contact.form.message', 'Message')}</label>
                    <textarea
                      name="message"
                      value={contactForm.message}
                      onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))}
                      required
                      rows={5}
                      className={`${contactInputClass} resize-y`}
                      placeholder="Tell us how we can help…"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={contactStatus === 'submitting'}
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-black font-semibold rounded-full hover:bg-slate-200 transition-colors self-start disabled:opacity-60"
                  >
                    {contactStatus === 'submitting' ? (
                      <span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                    ) : (
                      <>{t('contact.form.submit', 'Send message')} <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section className="relative py-32 overflow-hidden bg-[#020204]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-gradient-to-r from-indigo-900/30 to-purple-900/30 blur-[80px] rounded-full" />
        </div>
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {t('landing.cta.heading', 'Ready to transform')} <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              {t('landing.cta.headingAccent', 'your revenue?')}
            </span>
          </h2>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('landing.cta.subheading', 'Join the agencies optimizing their finances with Sync Sirius.')}
          </p>
          <Link to="/demo" className={`${ctaPrimary} text-lg px-10 py-5`}>
            {t('landing.cta.button', 'Schedule a Demo Today')} <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="py-12 border-t border-white/5 bg-[#020204]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <ImageWithFallback
            src={LOGO_SRC}
            alt={t('landing.footer.logoAlt', 'Sync Sirius logo')}
            className="h-6 w-auto object-contain opacity-60 grayscale"
          />
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
            <a href="/privacy" className="hover:text-white transition-colors">{t('landing.footer.privacy', 'Privacy Policy')}</a>
            <a href="/privacy#terms" className="hover:text-white transition-colors">{t('landing.footer.terms', 'Terms of Service')}</a>
            <a href="#contato" className="hover:text-white transition-colors">{t('landing.footer.contact', 'Contact Support')}</a>
          </div>
          <p className="text-sm text-slate-600">
            {t('landing.footer.copyright', '© {{year}} Sync Sirius. All rights reserved.', { year: new Date().getFullYear() })}
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
  accent,
}: {
  icon: React.ReactNode
  title: string
  description: string
  accent: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-200 group"
    >
      <div className={`w-14 h-14 bg-gradient-to-br ${accent} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-sm">{description}</p>
    </motion.div>
  )
}
