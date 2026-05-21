import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Trust strip — Story 6.5 refactor (icons aligned to Hero.html L706–724).
 *
 * Source: Hero.html `.trust` (lines 256–271, 707–725). Single wrap-allowed
 * flex row separated by 3×3 round dots; each item carries a distinct icon
 * (shield / award / check / globe) matching the design's stroke-based set.
 *
 * Preserves the existing `hero.trustBar.items.0..3` i18n keys per Story 6.5
 * AC7 (do NOT rename).
 */

type IconProps = { className: string }

const SHARED_SVG_PROPS = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
  'aria-hidden': true,
}

const ICONS: ReadonlyArray<(props: IconProps) => ReactElement> = [
  // 0 — shield (encrypted transmission)
  ({ className }) => (
    <svg className={className} {...SHARED_SVG_PROPS}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  // 1 — award / medal (certification roadmap)
  ({ className }) => (
    <svg className={className} {...SHARED_SVG_PROPS}>
      <circle cx="12" cy="8" r="5" />
      <path d="M9 13l-2 8 5-3 5 3-2-8" />
    </svg>
  ),
  // 2 — check (contractual insurance)
  ({ className }) => (
    <svg className={className} {...SHARED_SVG_PROPS}>
      <path d="M20 7l-9 9-5-5" />
    </svg>
  ),
  // 3 — globe (US agencies referenced)
  ({ className }) => (
    <svg className={className} {...SHARED_SVG_PROPS}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
    </svg>
  ),
] as const

const ITEM_COUNT = ICONS.length

export default function TrustBar() {
  const { t } = useTranslation()

  return (
    <div
      data-testid="trust-bar"
      className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3"
      suppressHydrationWarning
    >
      {ICONS.map((Icon, i) => (
        <div key={i} className="contents">
          <div
            data-testid={`trust-item-${i}`}
            className="inline-flex items-center gap-2 text-[11.5px] text-white/50"
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{t(`hero.trustBar.items.${i}`, { defaultValue: '' })}</span>
          </div>
          {i < ITEM_COUNT - 1 ? (
            <span
              aria-hidden="true"
              data-testid={`trust-sep-${i}`}
              className="inline-block h-[3px] w-[3px] rounded-full bg-white/25"
            />
          ) : null}
        </div>
      ))}
    </div>
  )
}
