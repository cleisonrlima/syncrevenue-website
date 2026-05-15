import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import DemoForm, { type DemoFormHandle } from './DemoForm'
import SectionHeader from '@/components/ui/SectionHeader'
import GradientButton from '@/components/ui/GradientButton'

export default function DemoScheduler() {
  const { t } = useTranslation()
  const demoFormRef = useRef<DemoFormHandle | null>(null)
  const formContainerRef = useRef<HTMLDivElement | null>(null)

  const handleFocusForm = () => {
    if (typeof window === 'undefined') return
    formContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    demoFormRef.current?.focusFirstField()
  }

  return (
    <section
      id="demo-scheduler"
      role="region"
      aria-label={t('sections.demoScheduler.ariaLabel')}
      className="bg-gradient-to-b from-[#0D0D3A] to-[#080820] text-white overflow-hidden"
    >
      <div className="mx-auto max-w-[960px] px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <SectionHeader
          variant="dark"
          eyebrow={t('sections.demoScheduler.eyebrow')}
          heading={t('sections.demoScheduler.heading')}
          subtext={t('sections.demoScheduler.subtext')}
        />
        <div className="mt-8 flex justify-center">
          <GradientButton size="lg" onClick={handleFocusForm} className="min-h-[44px]">
            {t('sections.demoScheduler.cta')}
          </GradientButton>
        </div>
        <div ref={formContainerRef} className="mt-12">
          <DemoForm ref={demoFormRef} />
        </div>
      </div>
    </section>
  )
}
