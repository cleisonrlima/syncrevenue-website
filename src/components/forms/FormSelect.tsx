import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'
import { cn } from '@/lib/utils'

export type FormSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean
  wrapperClassName?: string
}

const baseFieldClasses = cn(
  'w-full appearance-none rounded-[9px] border bg-white/[0.04] px-[13px] py-[11px] pr-[34px]',
  'text-[14px] leading-[1.4] text-white',
  'transition-colors duration-150',
  'hover:border-white/[0.22]',
  'focus:outline-none focus:bg-white/[0.06]',
)

const OPTION_BACKGROUND = '#0A0B2E'

type OptionLikeProps = {
  children?: ReactNode
  style?: CSSProperties
}

function withOptionBackground(children: ReactNode): ReactNode {
  return Children.map(children, child => {
    if (!isValidElement<OptionLikeProps>(child)) return child

    if (child.type === 'option') {
      const option = child as ReactElement<OptionLikeProps>
      return cloneElement(option, {
        style: { ...option.props.style, background: OPTION_BACKGROUND },
      })
    }

    if (child.type === 'optgroup') {
      const group = child as ReactElement<OptionLikeProps>
      return cloneElement(group, {
        children: withOptionBackground(group.props.children),
      })
    }

    return child
  })
}

/**
 * Story 6.9 — Native `<select>` wrapped in `.select-wrap` with a span-based chevron
 * (preferred over `::after` pseudo-element so the icon is component-level).
 */
const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(function FormSelect(
  { className, invalid, wrapperClassName, children, ...rest },
  ref,
) {
  return (
    <div className={cn('select-wrap relative', wrapperClassName)}>
      <select
        ref={ref}
        aria-invalid={invalid ? 'true' : undefined}
        className={cn(
          baseFieldClasses,
          invalid
            ? 'border-[var(--form-error,#FF6B6B)]'
            : 'border-[var(--line-strong)]',
          'focus:border-[var(--accent-brand)] focus:[box-shadow:0_0_0_3px_rgba(61,111,224,0.12)]',
          className,
        )}
        {...rest}
      >
        {withOptionBackground(children)}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[14px] top-1/2 block h-[7px] w-[7px] border-b-[1.5px] border-r-[1.5px] border-white/50 [transform:translateY(-70%)_rotate(45deg)]"
      />
    </div>
  )
})

export default FormSelect
