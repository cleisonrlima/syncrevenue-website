import { cn } from '@/lib/utils'

// Subtext width is capped in its own wrapper so long descriptions stay readable
// without constraining the eyebrow or heading.

type SectionHeaderProps = {
  eyebrow: string
  heading: string
  subtext?: string
  variant?: 'light' | 'dark'
  className?: string
  headingId?: string
  as?: 'h2' | 'h3'
}

export default function SectionHeader({
  eyebrow,
  heading,
  subtext,
  variant = 'light',
  className,
  headingId,
  as: HeadingTag = 'h2',
}: SectionHeaderProps) {
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
