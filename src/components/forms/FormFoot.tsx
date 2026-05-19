import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type FormFootProps = {
  note: ReactNode
  submit: ReactNode
  className?: string
}

/**
 * Story 6.9 — Form footer row: note on the left, submit on the right.
 * Collapses to a stacked column under 600px via flex-col / `xs:`-equivalent breakpoint.
 * Tailwind has `sm:` (640px) baked-in; we use an arbitrary `@[600px]` container-query-ish
 * via inline media wrapper — since project Tailwind has no container queries plugin,
 * fall back to a `flex-col min-[600px]:flex-row` pattern which matches the < 600px stack rule.
 */
export default function FormFoot({ note, submit, className }: FormFootProps) {
  return (
    <div
      className={cn(
        'form-foot mt-[20px] flex flex-col gap-[16px] pt-[8px]',
        'min-[600px]:flex-row min-[600px]:items-center min-[600px]:justify-between',
        className,
      )}
      data-form-foot
    >
      <div className="form-foot__note">{note}</div>
      <div className="form-foot__submit">{submit}</div>
    </div>
  )
}
