import * as React from 'react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'default' | 'solid-accent'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default:
    'rounded-lg px-4 py-3 text-base font-semibold shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-60',
  // Sober accent button (Epic 6 — Hero.html .btn / .btn-lg). No gradient, no glow, no extra shadow.
  'solid-accent': cn(
    'inline-flex items-center justify-center font-semibold text-white',
    'bg-[var(--accent)] hover:bg-[var(--accent-soft)]',
    'motion-safe:transition-[background-color,transform] motion-safe:duration-150 motion-safe:ease-out',
    'motion-safe:hover:-translate-y-px',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-[var(--accent)]',
  ),
}

const SOLID_ACCENT_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-[13px] rounded-lg',
  md: 'px-5 py-[11px] text-sm rounded-[10px]',
  lg: 'px-[26px] py-[15px] text-[15px] rounded-[14px]',
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const sizeClasses = variant === 'solid-accent' ? SOLID_ACCENT_SIZE_CLASSES[size] : ''
    return (
      <button
        ref={ref}
        className={cn(VARIANT_CLASSES[variant], sizeClasses, className)}
        {...props}
      />
    )
  },
)

Button.displayName = 'Button'

export { Button }
