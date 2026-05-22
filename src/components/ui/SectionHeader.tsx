import { cn } from '@/lib/utils'

/**
 * Section header — light / dark / sober variants.
 *
 * - `light` and `dark` keep the legacy brand-* tokens for any consumer that
 *   still renders against the older palette (e.g. admin pages).
 * - `sober` matches the Hero.html design system: leading hairline + muted-white
 *   eyebrow, accent-soft `<accent>` span split in the heading, white/65 sub,
 *   centered. Used by every public landing-page section (Hero, BenefitsGrid,
 *   ClientReferences, Team, Demo, Contact + the 5 extra product sections).
 *
 * The optional `headingAccent` prop renders inline after `heading` with the
 * accent-soft color so callers can express the design's two-tone heading
 * without owning the span themselves.
 */

type SectionHeaderProps = {
  eyebrow: string
  heading: string
  headingAccent?: string
  subtext?: string
  variant?: 'light' | 'dark' | 'sober'
  className?: string
  headingId?: string
  as?: 'h2' | 'h3'
}

export default function SectionHeader({
  eyebrow,
  heading,
  headingAccent,
  subtext,
  variant = 'light',
  className,
  headingId,
  as: HeadingTag = 'h2',
}: SectionHeaderProps) {
  if (variant === 'sober') {
    return (
      <header className={cn('sec-head mx-auto mb-14 max-w-[760px] text-center', className)}>
        <div className="sec-eyebrow inline-flex items-center justify-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/50">
          <span aria-hidden="true" className="inline-block h-px w-6 bg-white/30" />
          {eyebrow}
        </div>
        <HeadingTag
          id={headingId}
          className="sec-h mt-[18px] text-[clamp(1.9rem,3.4vw,2.8rem)] font-bold leading-tight tracking-[-0.025em] text-white"
        >
          {heading}
          {headingAccent ? (
            <>
              {' '}
              <span className="accent text-[var(--accent-brand-soft)]">{headingAccent}</span>
            </>
          ) : null}
        </HeadingTag>
        {subtext && (
          <p className="sec-sub mt-5 mx-auto max-w-[62ch] text-[15px] leading-[1.65] text-white/[0.65]">
            {subtext}
          </p>
        )}
      </header>
    )
  }

  const isLight = variant === 'light'

  return (
    <div className={cn('text-center', className)}>
      <p
        className={cn(
          'text-sm font-semibold uppercase tracking-widest mb-2',
          isLight ? 'text-brand-electric-blue' : 'text-brand-highlight',
        )}
      >
        {eyebrow}
      </p>
      <HeadingTag
        id={headingId}
        className={cn(
          'text-3xl lg:text-4xl font-bold mb-4',
          isLight ? 'text-brand-navy' : 'text-white',
        )}
      >
        {heading}
      </HeadingTag>
      {subtext && (
        <div className="mx-auto max-w-2xl">
          <p className={cn('text-lg', isLight ? 'text-brand-slate' : 'text-white/80')}>
            {subtext}
          </p>
        </div>
      )}
    </div>
  )
}
