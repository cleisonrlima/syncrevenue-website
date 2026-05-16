import * as React from 'react'
import { cn } from '@/lib/utils'

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, role, 'aria-busy': ariaBusy, ...props }, ref) => (
    <div
      ref={ref}
      role={role ?? 'status'}
      aria-busy={ariaBusy ?? true}
      className={cn('motion-safe:animate-pulse rounded-md bg-brand-slate/60', className)}
      {...props}
    />
  )
)

Skeleton.displayName = 'Skeleton'

export { Skeleton }
