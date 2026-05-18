import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type FormFieldProps = {
  label: string
  htmlFor: string
  required?: boolean
  optional?: boolean
  optionalLabel?: string
  error?: string
  describedById?: string
  className?: string
  children: ReactNode
}

/**
 * Story 6.9 — Shared form primitive matching design-handoff `.field` block.
 * Background-aware: assumes a dark `--form-card-bg` surface from Story 6.1 tokens.
 */
export default function FormField({
  label,
  htmlFor,
  required,
  optional,
  optionalLabel = '(opcional)',
  error,
  describedById,
  className,
  children,
}: FormFieldProps) {
  const errorId = error ? `${htmlFor}-error` : undefined
  const describedBy = [describedById, errorId].filter(Boolean).join(' ') || undefined
  return (
    <div
      className={cn('field flex flex-col', className)}
      data-form-field
      data-error={error ? 'true' : undefined}
      data-described-by={describedBy}
    >
      <label
        htmlFor={htmlFor}
        className="mb-[7px] flex items-center gap-[5px] text-[12px] font-semibold text-white/70"
      >
        <span>{label}</span>
        {required && (
          <span className="req font-bold" style={{ color: 'var(--accent-soft)' }} aria-hidden="true">
            *
          </span>
        )}
        {optional && (
          <span className="opt ml-[2px] text-[11px] font-medium text-white/40">{optionalLabel}</span>
        )}
      </label>
      {children}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-[6px] text-[12px] font-medium"
          style={{ color: 'var(--form-error, #FF6B6B)' }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
