import { useRef, type ReactNode } from 'react'
import { LazyMotion, useInView, useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'

type MotionSectionProps = {
  id?: string
  role?: string
  className?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  children: ReactNode
}

const loadFeatures = () => import('./motionFeatures').then(mod => mod.default)

export default function MotionSection({ children, ...rest }: MotionSectionProps) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return (
      <section ref={ref} {...rest}>
        {children}
      </section>
    )
  }

  return (
    <LazyMotion strict features={loadFeatures}>
      <m.section
        ref={ref}
        {...rest}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {children}
      </m.section>
    </LazyMotion>
  )
}
