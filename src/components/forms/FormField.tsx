import {
  Children,
  cloneElement,
  isValidElement,
  type AriaAttributes,
  type ReactElement,
  type ReactNode,
} from 'react'
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

type ControlProps = AriaAttributes & {
  'aria-describedby'?: string
  'aria-invalid'?: boolean | 'true' | 'false'
}

function mergeIdRefs(...refs: Array<string | undefined>) {
  const ids = refs.flatMap(ref => ref?.split(/\s+/).filter(Boolean) ?? [])
  return ids.length ? Array.from(new Set(ids)).join(' ') : undefined
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
  let renderedChildren = children

  if (Children.count(children) === 1) {
    const onlyChild = Children.only(children)
    if (isValidElement<ControlProps>(onlyChild)) {
      const child = onlyChild as ReactElement<ControlProps>
      renderedChildren = cloneElement(child, {
        'aria-describedby': mergeIdRefs(child.props['aria-describedby'], describedBy),
        'aria-invalid': error ? 'true' : child.props['aria-invalid'],
        'aria-required': required ? 'true' : child.props['aria-required'],
      })
    }
  }

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
          <span className="req font-bold" style={{ color: 'var(--accent-brand-soft)' }} aria-hidden="true">
            *
          </span>
        )}
        {optional && !required && (
          <span className="opt ml-[2px] text-[11px] font-medium text-white/40">{optionalLabel}</span>
        )}
      </label>
      {renderedChildren}
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
