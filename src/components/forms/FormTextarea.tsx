import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type FormTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean
}

/**
 * Story 6.9 — Textarea matching design-handoff `.field textarea` styling.
 * min-height 96px, resize vertical, same hover/focus state as inputs.
 */
const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(function FormTextarea(
  { className, invalid, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid ? 'true' : undefined}
      className={cn(
        'w-full rounded-[9px] border bg-white/[0.04] px-[13px] py-[11px]',
        'text-[14px] leading-[1.4] text-white',
        'placeholder:text-white/[0.32]',
        'min-h-[96px] resize-y',
        'transition-colors duration-150',
        'hover:border-white/[0.22]',
        'focus:outline-none focus:bg-white/[0.06]',
        invalid
          ? 'border-[var(--form-error,#FF6B6B)]'
          : 'border-[var(--line-strong)]',
        'focus:border-[var(--accent-brand)] focus:[box-shadow:0_0_0_3px_rgba(61,111,224,0.12)]',
        className,
      )}
      {...rest}
    />
  )
})

export default FormTextarea
