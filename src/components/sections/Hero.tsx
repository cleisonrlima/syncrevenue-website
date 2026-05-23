import { useTranslation, Trans } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import StatRow from './StatRow'
import TrustBar from './TrustBar'
import HeroProductPanel from './HeroProductPanel'
import BenefitsGrid from './BenefitsGrid'

/**
 * Hero — Epic 6 sober-palette rebuild (Story 6.3); refined in Story 6.13 for LCP.
 *
 * Story 6.13 — replaced CSS background-image with a `<picture>` LCP candidate so
 * the airplane asset can be preloaded, sized per breakpoint, and served as
 * webp (with jpg fallback). Three asset variants live under `public/hero/`:
 *   - airplane.webp (1920×1075 — desktop, ~11KB)
 *   - airplane-mobile.webp (960×537 — mobile, ~4KB)
 *   - airplane.jpg (1920×1075 — webp-unsupported fallback, ~27KB)
 * The `<link rel="preload">` in `index.html` mirrors the same imagesrcset so
 * the browser can start the LCP fetch before React boots.
 *
 * Layout source: Hero.html `.hero` / `.bg` / `.wrap` / `.top` / `h1` / `.sub` /
 * `.cta-row` / `.kpi-row` (lines 52–138, 522–582).
 */

const SUBHEAD_COMPONENTS = [
  <strong key="brand" className="text-white font-semibold" />,
  <strong key="emphasis" className="text-white font-semibold" />,
]

export default function Hero() {
  const { t } = useTranslation()

  const handleDemoCta = () => {
    try {
      const target = document.getElementById('agendar-demo')
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' })
      } else if (typeof window !== 'undefined' && window.top !== window) {
        window.parent.location.href = '/#agendar-demo'
      } else {
        window.location.href = '/#agendar-demo'
      }
    } catch (e) {
      console.warn('Failed to scroll to demo section', e)
    }
  }

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative min-h-screen overflow-hidden text-white bg-[var(--ink)]"
      suppressHydrationWarning
    >
      {/* Airplane LCP image — Story 6.13. <picture> with webp + mobile-sized
          variant; <img> participates in LCP candidacy and is preloaded by
          index.html. decoding="async" keeps decode off the critical path. */}
      <picture aria-hidden="true" className="hero-bg-media">
        <source
          type="image/webp"
          media="(max-width: 768px)"
          srcSet="/hero/airplane-mobile.webp"
        />
        <source type="image/webp" srcSet="/hero/airplane.webp" />
        <img
          src="/hero/airplane.jpg"
          alt=""
          decoding="async"
          className="absolute inset-0 z-0 h-full w-full object-cover"
          style={{ filter: 'saturate(0.85)' }}
          data-testid="hero-bg"
        />
      </picture>
      {/* Dual-gradient overlay scrim — Hero.html .bg::after */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0"
        style={{
          background: [
            'linear-gradient(95deg, rgba(10,11,46,0.94) 0%, rgba(10,11,46,0.82) 40%, rgba(10,11,46,0.60) 80%, rgba(10,11,46,0.78) 100%)',
            'linear-gradient(180deg, rgba(10,11,46,0.50) 0%, transparent 35%, transparent 55%, rgba(8,8,28,0.92) 100%)',
          ].join(', '),
        }}
      />

      {/* Content wrap — Hero.html .wrap */}
      <div className="relative z-10 mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-14 pt-[140px] pb-20 min-h-screen flex flex-col justify-center">
        {/* Top split — left copy, right product panel (right column lands in Story 6.4) */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-9 lg:gap-[60px] items-center">
          <div>
            <h1
              id="hero-heading"
              className="font-extrabold tracking-[-0.025em] text-white max-w-[16ch] mb-6 text-[clamp(2.4rem,4.8vw,4.2rem)] leading-[1.02]"
            >
              {t('hero.headline.line1', { defaultValue: '' })}
              <br />
              <span className="text-[var(--accent-brand-soft)]" data-testid="hero-headline-accent">
                {t('hero.headline.line2', { defaultValue: '' })}
              </span>
            </h1>

            <p className="mb-8 max-w-[54ch] text-white/[0.78] font-normal leading-[1.55] text-[clamp(15.5px,1.15vw,18px)]">
              <Trans i18nKey="hero.subheadline" components={SUBHEAD_COMPONENTS} />
            </p>

            <div className="mb-9 flex flex-wrap items-center gap-[14px]">
              <Button
                type="button"
                variant="solid-accent"
                size="lg"
                onClick={handleDemoCta}
                className="min-h-[44px] inline-flex items-center gap-2"
                data-testid="hero-primary-cta"
              >
                {t('hero.cta.primary', { defaultValue: '' })}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Button>
              <a
                href="#beneficios"
                data-testid="hero-secondary-link"
                className="group inline-flex items-center gap-2 py-[14px] px-[6px] text-[14px] font-medium text-white/[0.85] border-b border-transparent hover:border-white/40 motion-safe:transition-colors motion-safe:duration-200"
              >
                {t('hero.cta.secondary', { defaultValue: '' })}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-[3px]"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            <StatRow />
          </div>

          {/* Right column — product panel (Story 6.4) */}
          <div data-testid="hero-right-column">
            <HeroProductPanel />
          </div>
        </div>

        <div className="mt-[60px]">
          {/* Story 6.13 (AC 5) — bridge `<h1>` (line 88 above) → BenefitsGrid card
              `<h3>` so the Lighthouse `heading-order` audit passes. Visually
              hidden — the benefits block is purely decorative cards under the
              hero so a visible heading would clash with the design intent. */}
          <h2 className="sr-only">
            {t('hero.benefitsHeading', { defaultValue: 'Why agencies pick SyncRevenue' })}
          </h2>
          <BenefitsGrid />
        </div>

        <div className="mt-10">
          <TrustBar />
        </div>
      </div>
    </section>
  )
}
