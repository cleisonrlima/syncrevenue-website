import { cn } from '@/lib/utils'

type GradientButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: 'lg' | 'md' | 'sm'
}

const sizeClasses: Record<NonNullable<GradientButtonProps['size']>, string> = {
  lg: 'px-8 py-4 text-lg',
  md: 'px-6 py-3 text-base',
  sm: 'px-4 py-2 text-sm',
}

export default function GradientButton({
  size = 'md',
  className,
  children,
  ...props
}: GradientButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'bg-gradient-brand text-white font-semibold rounded-lg transition-all',
        'hover:brightness-110',
        'motion-safe:active:scale-[0.98]',
        'disabled:bg-none disabled:bg-brand-slate disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </button>
  )
}
