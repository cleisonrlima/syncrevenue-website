import { cn } from '@/lib/utils'

type SectionHeaderProps = {
  eyebrow: string
  heading: string
  subtext?: string
  variant?: 'light' | 'dark'
  className?: string
}

export default function SectionHeader({
  eyebrow,
  heading,
  subtext,
  variant = 'light',
  className,
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
      <h2
        className={cn(
          'text-3xl lg:text-4xl font-bold mb-4',
          isLight ? 'text-brand-navy' : 'text-white',
        )}
      >
        {heading}
      </h2>
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
