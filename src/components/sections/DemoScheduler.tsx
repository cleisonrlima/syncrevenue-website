import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import MotionSection from './MotionSection'
import DemoForm, { type DemoFormHandle } from './DemoForm'

/**
 * Story 6.10 — DemoScheduler restyled to the 40/60 grid (info-side left,
 * form-card right). Section id renamed `demo-scheduler` → `agendar-demo` per
 * Story 6.2 nav target. Background stays `var(--ink)` from Story 6.8.
 */

const STEPS = ['0', '1', '2'] as const

const ClockIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    width={18}
    height={18}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

export default function DemoScheduler() {
  const { t } = useTranslation()
  const demoFormRef = useRef<DemoFormHandle | null>(null)

  return (
    <MotionSection
      id="agendar-demo"
      role="region"
      aria-label={t('demo.sectionAriaLabel', { defaultValue: 'Schedule a SyncRevenue demo' })}
      className="sec sec-deep bg-[#0A0B22] text-white overflow-hidden scroll-mt-24"
    >
      <div className="sec-inner mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-14 py-24 lg:py-[100px]">
        <header className="sec-head mx-auto mb-14 max-w-[760px] text-center">
          <div className="sec-eyebrow inline-flex items-center justify-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/50">
            <span aria-hidden="true" className="inline-block h-px w-6 bg-white/30" />
            {t('demo.eyebrow', { defaultValue: 'Schedule a demo' })}
          </div>
          <h2
            id="demo-heading"
            className="sec-h mt-[18px] text-[clamp(1.9rem,3.4vw,2.8rem)] font-bold leading-tight tracking-[-0.025em] text-white"
          >
            {t('demo.heading.text', { defaultValue: 'See SyncRevenue running' })}{' '}
            <span className="accent text-[var(--accent-brand-soft)]">
              {t('demo.heading.accent', { defaultValue: 'in your workflow' })}
            </span>
          </h2>
          <p className="sec-sub mt-5 mx-auto max-w-[62ch] text-[15px] leading-[1.65] text-white/[0.65]">
            {t('demo.subhead', {
              defaultValue:
                'A short conversation with the team, a personalized demo on your real contracts, and a clear proposal in 48 hours. No commitment.',
            })}
          </p>
        </header>

        <div className="form-grid grid mx-auto max-w-[1180px] grid-cols-1 items-start gap-[40px] min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
          <aside className="form-info">
            <h3 className="text-[16px] font-semibold text-white/85">
              {t('demo.info.h3', { defaultValue: 'What to expect' })}
            </h3>
            <ol className="steps mt-[18px] flex flex-col gap-[18px]" data-testid="demo-steps">
              {STEPS.map((idx, i) => (
                <li key={idx} className="step flex items-start gap-[14px]">
                  <span
                    aria-hidden="true"
                    className="step-num flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[8px] bg-[var(--accent-brand-dim)] text-[13px] font-bold text-[var(--accent-brand-soft)]"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <strong className="block text-[14px] font-semibold text-white">
                      {t(`demo.info.steps.${idx}.title`)}
                    </strong>
                    <span className="mt-[3px] block text-[13px] leading-[1.55] text-white/60">
                      {t(`demo.info.steps.${idx}.body`)}
                    </span>
                  </div>
                </li>
              ))}
            </ol>

            <div className="info-card mt-6 flex items-center gap-[14px] rounded-[10px] border border-[var(--line)] bg-white/[0.03] px-5 py-[18px]">
              <div className="info-card-ico flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[9px] bg-[var(--accent-brand-dim)] text-[var(--accent-brand-soft)]">
                <ClockIcon />
              </div>
              <div>
                <div className="info-card-t text-[13.5px] font-semibold text-white leading-tight">
                  {t('demo.info.infoCard.title', { defaultValue: 'Reply within 1 business day' })}
                </div>
                <div className="info-card-s mt-[3px] text-[12px] text-white/55 leading-snug">
                  {t('demo.info.infoCard.subtitle', {
                    defaultValue: 'Maria or Lucas reaches out personally.',
                  })}
                </div>
              </div>
            </div>
          </aside>

          <div>
            <DemoForm ref={demoFormRef} />
          </div>
        </div>
      </div>
    </MotionSection>
  )
}
