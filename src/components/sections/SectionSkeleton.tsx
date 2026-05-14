import { cn } from '@/lib/utils'

type SectionSkeletonProps = {
  label?: string
  className?: string
}

export default function SectionSkeleton({ label = 'Loading', className }: SectionSkeletonProps) {
  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      className={cn('w-full motion-safe:animate-pulse rounded-md bg-muted', className)}
    />
  )
}
