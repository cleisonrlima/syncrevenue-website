import { useEffect, useRef, useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'

/**
 * Hero right column — Story 6.4 product panel.
 *
 * Source: Hero.html `.panel` / `.panel-head` / `.panel-mark` / `.ints` / `.int` /
 * `.ints-more` / `.ticker` (lines 141–220, 584–630).
 *
 * Partner wordmarks render from local static assets under `public/integrations/`.
 * The image constraints match the verifier notes for the wide Sabre logo:
 * max-height 22px, max-width 100%, object-fit contain.
 */

const INTEGRATIONS = [
  {
    key: 'amadeus',
    name: 'Amadeus',
    src: '/integrations/amadeus.png',
    width: 208,
    height: 32,
    sub: null,
  },
  {
    key: 'sabre',
    name: 'Sabre',
    src: '/integrations/sabre.svg',
    width: 2000,
    height: 576,
    sub: null,
  },
  {
    key: 'travelport',
    name: 'Travelport',
    src: '/integrations/travelport.svg',
    width: 195,
    height: 24,
    sub: 'Galileo · Worldspan',
  },
] as const

// Ticker cycle interval (ms). Matches Hero.html demo cadence.
const TICKER_INTERVAL_MS = 8000
const TICKER_FADE_MS = 200

type TickerEntry = { pnr: string; value: string }

const DEFAULT_TICKER_ENTRIES = [
  { pnr: 'PNR-44128', value: '+ $8,420' },
  { pnr: 'PNR-92710', value: '+ $3,985' },
  { pnr: 'PNR-58044', value: '+ $12,310' },
  { pnr: 'PNR-67219', value: '+ $5,670' },
  { pnr: 'PNR-39816', value: '+ $2,140' },
  { pnr: 'PNR-71452', value: '+ $9,870' },
] as const

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)

    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

export default function HeroProductPanel() {
  const { t } = useTranslation()
  const reduceMotion = usePrefersReducedMotion()

  const entries = (t('hero.panel.ticker.entries', {
    returnObjects: true,
    defaultValue: DEFAULT_TICKER_ENTRIES,
  }) ?? []) as unknown
  const tickerEntries: TickerEntry[] = Array.isArray(entries)
    ? (entries as TickerEntry[]).filter(e => typeof e?.pnr === 'string' && typeof e?.value === 'string')
    : []

  const [index, setIndex] = useState(0)
  const [fade, setFade] = useState<'in' | 'out'>('in')
  const fadeTimeoutRef = useRef<number | null>(null)

  // Cycle the ticker every TICKER_INTERVAL_MS unless reduced-motion is set or
  // the entries array has fewer than 2 rows (nothing to cycle through).
  useEffect(() => {
    if (reduceMotion) return
    if (tickerEntries.length < 2) return

    const id = window.setInterval(() => {
      setFade('out')
      if (fadeTimeoutRef.current !== null) {
        window.clearTimeout(fadeTimeoutRef.current)
      }
      fadeTimeoutRef.current = window.setTimeout(() => {
        setIndex(prev => (prev + 1) % tickerEntries.length)
        setFade('in')
        fadeTimeoutRef.current = null
      }, TICKER_FADE_MS)
    }, TICKER_INTERVAL_MS)

    return () => {
      window.clearInterval(id)
      if (fadeTimeoutRef.current !== null) {
        window.clearTimeout(fadeTimeoutRef.current)
        fadeTimeoutRef.current = null
      }
    }
  }, [reduceMotion, tickerEntries.length])

  const safeIndex = tickerEntries.length === 0 ? 0 : index % tickerEntries.length
  const currentEntry: TickerEntry = tickerEntries[safeIndex] ?? { pnr: '', value: '' }

  return (
    <aside
      id="integracoes"
      data-testid="hero-product-panel"
      className="rounded-[14px] border border-[var(--line-strong)] bg-white/[0.03] px-7 pt-7 pb-[26px]"
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[var(--accent-brand)] text-white"
          aria-hidden="true"
          data-testid="hero-panel-mark"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </svg>
        </div>
        <div className="flex flex-col">
          <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-white/50">
            {t('hero.panel.tag', { defaultValue: '' })}
          </div>
          <div className="text-[22px] font-bold text-white leading-tight">
            {t('hero.panel.name', { defaultValue: '' })}
          </div>
        </div>
      </div>

      <p className="mt-5 text-[14px] leading-[1.55] text-white/[0.78]">
        <Trans
          i18nKey="hero.panel.line"
          components={[<strong key="emphasis" className="text-white font-semibold" />]}
        />
      </p>

      <div className="mt-6">
        <div className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-white/50">
          {t('hero.panel.intsLabel', { defaultValue: '' })}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2" data-testid="hero-ints-row">
          {INTEGRATIONS.map(({ key, name, src, width, height, sub }) => (
            <div
              key={key}
              data-testid={`hero-int-${key}`}
              className="relative flex min-h-[60px] flex-col items-center justify-center rounded-[10px] bg-white px-[10px] pt-[14px] pb-3"
            >
              <span
                aria-hidden="true"
                className="absolute right-2 top-2 inline-block h-1.5 w-1.5 rounded-full bg-[#5BC98C]"
                data-testid={`hero-int-${key}-live`}
              />
              <img
                src={src}
                alt={name}
                width={width}
                height={height}
                loading="eager"
                className="max-h-[22px] max-w-full object-contain"
              />
              {sub ? (
                <span className="mt-1 text-[9.5px] text-[#5B6478]">{sub}</span>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium text-white/55">
          <span>{t('hero.panel.intsMore.prefix', { defaultValue: '' })}</span>
          <span className="rounded-[5px] border border-[var(--line)] bg-white/[0.04] px-2 py-[3px] text-[10.5px] font-semibold tracking-[0.02em] text-white/75 whitespace-nowrap">
            {t('hero.panel.intsMore.ndc', { defaultValue: '' })}
          </span>
          <span className="rounded-[5px] border border-[var(--line)] bg-white/[0.04] px-2 py-[3px] text-[10.5px] font-semibold tracking-[0.02em] text-white/75 whitespace-nowrap">
            {t('hero.panel.intsMore.ibe', { defaultValue: '' })}
          </span>
        </div>
      </div>

      <div
        data-testid="hero-ticker"
        className="mt-6 flex items-center gap-3 rounded-[10px] border border-[var(--line)] bg-white/[0.03] px-[14px] py-[13px] text-[12.5px] text-white/90"
        aria-live="polite"
      >
        <span
          aria-hidden="true"
          className="inline-block h-[7px] w-[7px] shrink-0 rounded-full bg-[#5BC98C]"
        />
        <span
          className="flex-1 min-w-0 truncate"
          style={{
            opacity: fade === 'in' ? 1 : 0,
            transition: reduceMotion ? 'none' : `opacity ${TICKER_FADE_MS}ms ease-out`,
          }}
          data-testid="hero-ticker-label"
        >
          <Trans
            i18nKey="hero.panel.ticker.label"
            values={{ pnr: currentEntry.pnr }}
            components={[<b key="pnr" className="font-semibold text-white" />]}
          />
        </span>
        <span
          className="shrink-0 text-[12.5px] font-semibold tabular-nums text-[#5BC98C]"
          data-testid="hero-ticker-value"
          style={{
            opacity: fade === 'in' ? 1 : 0,
            transition: reduceMotion ? 'none' : `opacity ${TICKER_FADE_MS}ms ease-out`,
          }}
        >
          {currentEntry.value}
        </span>
      </div>
    </aside>
  )
}
