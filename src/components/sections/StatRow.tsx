import { useTranslation } from 'react-i18next'

/**
 * Hero KPI strip — Epic 6 sober-palette rebuild.
 *
 * Source: Hero.html `.kpi-row` (lines 130–138). Replaces the prior gradient-text
 * stat treatment from Story 1.5. Three columns, top hairline divider, flat white
 * value, dim 11.5px label, tabular-nums to keep digit widths stable on locale
 * change.
 *
 * Reads new `hero.kpis.{0,1,2}.{value,label}` keys (Story 6.3 Task 0). The
 * legacy `hero.stats.*` keys are intentionally left in the JSON unused — they
 * are scheduled for removal in story 6.8's locale parity sweep so this story
 * can land without touching every translation file beyond the new keys.
 */
export default function StatRow() {
  const { t } = useTranslation()

  return (
    <div
      className="mt-8 flex flex-wrap gap-x-9 gap-y-6 border-t border-[var(--line)] pt-6 max-w-[600px]"
      data-testid="hero-kpi-row"
    >
      {Array.from({ length: 3 }).map((_, i) => {
        const value = t(`hero.kpis.${i}.value`, { defaultValue: '' })
        const labelRaw = t(`hero.kpis.${i}.label`, { defaultValue: '' })
        return (
          <div key={i} className="flex flex-col min-w-[120px]">
            <div className="text-white font-bold leading-none tracking-[-0.02em] tabular-nums text-[clamp(24px,2.4vw,32px)]">
              {value}
            </div>
            <div className="mt-2 text-[11.5px] font-medium leading-snug text-white/50 whitespace-pre-line">
              {labelRaw}
            </div>
          </div>
        )
      })}
    </div>
  )
}
