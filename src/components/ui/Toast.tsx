import { useEffect } from 'react'
import { cn } from '@/lib/utils'

type ToastProps = {
  message: string
  variant?: 'destructive'
  onDismiss: () => void
}

export default function Toast({ message, variant = 'destructive', onDismiss }: ToastProps) {
  useEffect(() => {
    const timeout = window.setTimeout(onDismiss, 5000)
    return () => window.clearTimeout(timeout)
  }, [onDismiss])

  return (
    <div
      role="alert"
      className={cn(
        'fixed bottom-4 right-4 z-50 max-w-sm rounded-lg px-4 py-3 text-sm font-medium shadow-lg',
        variant === 'destructive' && 'bg-destructive text-destructive-foreground'
      )}
    >
      {message}
    </div>
  )
}
