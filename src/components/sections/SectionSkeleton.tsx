import { cn } from '@/lib/utils'

type SectionSkeletonProps = {
  label?: string
  className?: string
}

// Skeleton chooses `bg-brand-slate/60` for visible contrast against white surfaces
// (shadcn `bg-muted` resolves to near-white and offered no perceptible affordance).
// `motion-safe:animate-pulse` continues to provide the animated cue; under
// `prefers-reduced-motion` the visually-hidden label + aria-live="polite" + the
// brand-slate fill act as the static affordance.
export default function SectionSkeleton({ label = 'Loading', className }: SectionSkeletonProps) {
  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      aria-live="polite"
      className={cn('w-full motion-safe:animate-pulse rounded-md bg-brand-slate/60', className)}
    >
      <span className="sr-only">{label}…</span>
    </div>
  )
}
