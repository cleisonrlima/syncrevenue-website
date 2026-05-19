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
      className="sec sec-deep bg-[var(--ink)] text-white overflow-hidden scroll-mt-24"
    >
      <div className="sec-inner mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <header className="sec-head mb-[40px] max-w-[720px]">
          <span className="sec-eyebrow text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--accent-soft)]">
            {t('demo.eyebrow', { defaultValue: 'Schedule a demo' })}
          </span>
          <h2
            id="demo-heading"
            className="sec-h mt-[10px] text-[clamp(28px,3.4vw,40px)] font-bold leading-[1.15] text-white"
          >
            {t('demo.heading.text', { defaultValue: 'See SyncRevenue running' })}{' '}
            <span className="accent text-[var(--accent-soft)]">
              {t('demo.heading.accent', { defaultValue: 'in your workflow' })}
            </span>
          </h2>
          <p className="sec-sub mt-[14px] text-[15px] leading-[1.6] text-white/65">
            {t('demo.subhead', {
              defaultValue:
                'A short conversation with the team, a personalized demo on your real contracts, and a clear proposal in 48 hours. No commitment.',
            })}
          </p>
        </header>

        <div className="form-grid grid max-w-[1180px] grid-cols-1 items-start gap-[40px] min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
          <aside className="form-info">
            <h3 className="text-[16px] font-semibold text-white/85">
              {t('demo.info.h3', { defaultValue: 'What to expect' })}
            </h3>
            <ol className="steps mt-[18px] flex flex-col gap-[18px]" data-testid="demo-steps">
              {STEPS.map((idx, i) => (
                <li key={idx} className="step flex items-start gap-[14px]">
                  <span
                    aria-hidden="true"
                    className="step-num flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[8px] bg-[var(--accent-dim)] text-[13px] font-bold text-[var(--accent-soft)]"
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

            <div className="info-card mt-[24px] flex items-start gap-[14px] rounded-[12px] border border-[var(--line-strong)] bg-white/[0.025] p-[16px]">
              <div className="info-card-ico flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[var(--accent-dim)] text-[var(--accent-soft)]">
                <ClockIcon />
              </div>
              <div>
                <div className="info-card-t text-[13px] font-semibold text-white">
                  {t('demo.info.infoCard.title', { defaultValue: 'Reply within 1 business day' })}
                </div>
                <div className="info-card-s mt-[3px] text-[13px] text-white/60">
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
