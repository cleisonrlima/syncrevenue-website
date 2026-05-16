import { cn } from '@/lib/utils'

// `max-w-2xl` on the subtext `<p>` is intentional: parent is `text-center` with no
// width cap; the constraint caps the paragraph's own max-width at 42rem and `mx-auto`
// centers it within the unconstrained parent. Do not move it to the outer wrapper —
// that would also constrain the heading.

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
        <p
          className={cn(
            'text-lg max-w-2xl mx-auto',
            isLight ? 'text-brand-slate' : 'text-white/80',
          )}
        >
          {subtext}
        </p>
      )}
    </div>
  )
}
