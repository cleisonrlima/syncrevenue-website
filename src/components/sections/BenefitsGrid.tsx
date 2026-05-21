import { useTranslation } from 'react-i18next'

/**
 * Benefits grid — Story 6.5.
 *
 * Source: Hero.html `.benefits` / `.ben` / `.ben-head` / `.ben-ico` / `.ben-metric`
 * (lines 222–271, 633–706).
 *
 * 6 cards arranged in a 3-column grid (collapsing 3 → 2 → 1 at 960 / 560px).
 * Lives inside the hero `.wrap` per prototype nesting — anchored as
 * `id="beneficios"` for the navbar deep-link from Story 6.2.
 *
 * Icons are inline stroke SVGs (lucide-react is NOT in package.json — adding
 * a dep for six icons is not worth the bundle weight). Metric chips have two
 * variants: `neutral` (transparent + line border) and `blue` (accent-dim fill
 * + accent-soft fg, no border).
 */

type BenefitKey = '0' | '1' | '2' | '3' | '4' | '5'

const BENEFITS: ReadonlyArray<{ key: BenefitKey; icon: (props: { className: string }) => JSX.Element }> = [
  {
    key: '0',
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    key: '1',
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 7h16M4 12h16M4 17h10" />
        <circle cx="19" cy="17" r="2" />
      </svg>
    ),
  },
  {
    key: '2',
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M9 13h6M9 17h6" />
      </svg>
    ),
  },
  {
    key: '3',
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 4 4 5-7" />
      </svg>
    ),
  },
  {
    key: '4',
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 11l3 3 8-8" />
        <path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h8" />
      </svg>
    ),
  },
  {
    key: '5',
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 21H4.6c-.3 0-.6-.3-.6-.6V3" />
        <rect x="8" y="11" width="3" height="7" />
        <rect x="13" y="7" width="3" height="11" />
        <rect x="18" y="14" width="3" height="4" />
      </svg>
    ),
  },
] as const

function MetricChip({ label, variant }: { label: string; variant: string }) {
  const isBlue = variant === 'blue'
  return (
    <span
      data-testid={`benefits-metric-${variant}`}
      className={
        isBlue
          ? 'rounded-md px-[9px] py-[5px] text-[11.5px] font-medium text-[var(--accent-soft)] bg-[var(--accent-dim)] border border-transparent'
          : 'rounded-md px-[9px] py-[5px] text-[11.5px] font-medium text-white/70 bg-transparent border border-[var(--line)]'
      }
    >
      {label}
    </span>
  )
}

export default function BenefitsGrid() {
  const { t } = useTranslation()

  return (
    <div
      id="beneficios"
      data-testid="benefits-grid"
      className="grid grid-cols-1 min-[560px]:grid-cols-2 min-[960px]:grid-cols-3 gap-4 scroll-mt-24"
    >
      {BENEFITS.map(({ key, icon: Icon }) => {
        const metric = t(`hero.benefits.${key}.metric`, { defaultValue: '' })
        const variant = t(`hero.benefits.${key}.metricVariant`, { defaultValue: 'neutral' })
        const title = t(`hero.benefits.${key}.title`, { defaultValue: '' })
        const body = t(`hero.benefits.${key}.body`, { defaultValue: '' })

        return (
          <article
            key={key}
            data-testid={`benefit-card-${key}`}
            className="rounded-[14px] border border-[var(--line)] bg-white/[0.03] px-[22px] pt-6 pb-[22px] motion-safe:transition-colors motion-safe:duration-150 hover:border-[var(--line-strong)] hover:bg-white/[0.045]"
          >
            <div className="flex items-start justify-between gap-3">
              <div
                aria-hidden="true"
                className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-[var(--accent-dim)] text-[var(--accent-soft)]"
              >
                <Icon className="h-[18px] w-[18px]" />
              </div>
              <MetricChip label={metric} variant={variant} />
            </div>
            <h3 className="mt-4 text-[15px] font-bold tracking-[-0.01em] leading-tight text-white">
              {title}
            </h3>
            <p className="mt-2 text-[13px] leading-[1.55] text-white/[0.72]">{body}</p>
          </article>
        )
      })}
    </div>
  )
}
