import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import DemoForm, { type DemoFormHandle } from './DemoForm'
import MotionSection from './MotionSection'
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
    <MotionSection
      id="demo-scheduler"
      role="region"
      aria-label={t('sections.demoScheduler.ariaLabel', { defaultValue: 'Schedule a SyncRevenue demo' })}
      className="bg-[var(--ink)] text-white overflow-hidden"
    >
      <div className="mx-auto max-w-[960px] px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <SectionHeader
          variant="dark"
          eyebrow={t('sections.demoScheduler.eyebrow', { defaultValue: 'Ready When You Are' })}
          heading={t('sections.demoScheduler.heading', { defaultValue: 'Schedule Your SyncRevenue Demo' })}
          subtext={t('sections.demoScheduler.subtext', { defaultValue: "See multi-GDS commission recovery applied to your agency's reconciliation workflow." })}
        />
        <div className="mt-8 flex justify-center">
          <GradientButton size="lg" onClick={handleFocusForm} className="min-h-[44px]">
            {t('sections.demoScheduler.cta', { defaultValue: 'Schedule a Demo' })}
          </GradientButton>
        </div>
        <div ref={formContainerRef} className="mt-12">
          <DemoForm ref={demoFormRef} />
        </div>
      </div>
    </MotionSection>
  )
}
