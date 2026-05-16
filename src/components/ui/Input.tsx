import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'w-full rounded-lg border border-brand-slate/25 bg-white px-4 py-3 text-base text-brand-navy shadow-sm min-h-11 placeholder:text-brand-slate/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-electric-blue',
      className
    )}
    {...props}
  />
))

Input.displayName = 'Input'

export { Input }
