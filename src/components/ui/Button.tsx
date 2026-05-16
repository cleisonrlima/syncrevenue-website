import * as React from 'react'
import { cn } from '@/lib/utils'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'rounded-lg px-4 py-3 text-base font-semibold shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-60',
      className
    )}
    {...props}
  />
))

Button.displayName = 'Button'

export { Button }
