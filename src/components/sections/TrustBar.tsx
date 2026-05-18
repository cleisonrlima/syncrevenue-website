import { useTranslation } from 'react-i18next'

/**
 * Trust strip — Story 6.5 refactor.
 *
 * Source: Hero.html `.trust` (lines 256–271, 707–725). Replaces the
 * Story 1.5 three-variant responsive split (horizontal-scroll / 2×2 / row)
 * with a single wrap-allowed flex row separated by 3×3 round dots.
 *
 * Preserves the existing `hero.trustBar.items.0..3` i18n keys per Story 6.5
 * AC7 (do NOT rename).
 */

const ITEM_COUNT = 4

export default function TrustBar() {
  const { t } = useTranslation()

  return (
    <div
      data-testid="trust-bar"
      className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3"
      suppressHydrationWarning
    >
      {Array.from({ length: ITEM_COUNT }).map((_, i) => (
        <div key={i} className="contents">
          <div
            data-testid={`trust-item-${i}`}
            className="inline-flex items-center gap-2 text-[11.5px] text-white/50"
          >
            <svg
              className="h-3.5 w-3.5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              role="img"
              aria-label="verified"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
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
