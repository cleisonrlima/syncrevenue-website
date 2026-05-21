import { useTranslation } from 'react-i18next'
import type { ReactElement } from 'react'
import MotionSection from './MotionSection'
import SectionHeader from '@/components/ui/SectionHeader'

type CommitmentKey = 'encryption' | 'certification' | 'insurance'

const ICON_PROPS = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
  'aria-hidden': true,
}

const COMMITMENTS: ReadonlyArray<{
  key: CommitmentKey
  titleDefault: string
  descriptionDefault: string
  icon: (props: { className: string }) => ReactElement
}> = [
  {
    key: 'encryption',
    titleDefault: 'Encrypted Transmission',
    descriptionDefault:
      'All website form submissions are encrypted in transit. SyncRevenue product connections use separately scoped, encrypted data handling outside this website.',
    icon: ({ className }) => (
      <svg className={className} {...ICON_PROPS}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    key: 'certification',
    titleDefault: 'Certification Roadmap',
    descriptionDefault:
      'Sync Sirius is building toward formal security certification milestones including SOC 2 Type II, with the roadmap available during security review.',
    icon: ({ className }) => (
      <svg className={className} {...ICON_PROPS}>
        <circle cx="12" cy="8" r="5" />
        <path d="M9 13l-2 8 5-3 5 3-2-8" />
      </svg>
    ),
  },
  {
    key: 'insurance',
    titleDefault: 'Contract Insurance',
    descriptionDefault:
      'Commercial agreements can include explicit data protection commitments and liability coverage requirements for commission recovery operations.',
    icon: ({ className }) => (
      <svg className={className} {...ICON_PROPS}>
        <path d="M20 7l-9 9-5-5" />
      </svg>
    ),
  },
] as const

export default function Security() {
  const { t } = useTranslation()

  return (
    <MotionSection
      id="security"
      role="region"
      aria-labelledby="security-heading"
      className="sec sec-deep relative bg-[#0A0B22] text-white scroll-mt-24"
    >
      <span id="seguranca" aria-hidden="true" className="absolute top-0" />
      <div className="sec-inner mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-14 py-24 lg:py-[100px]">
        <SectionHeader
          variant="sober"
          headingId="security-heading"
          eyebrow={t('security.eyebrow', { defaultValue: 'Security & Trust' })}
          heading={t('security.headline', { defaultValue: 'Your Data is Protected' })}
          subtext={t('security.subtext', {
            defaultValue:
              'Clear commitments for website inquiries and SyncRevenue product data handling.',
          })}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COMMITMENTS.map(({ key, titleDefault, descriptionDefault, icon: Icon }) => (
            <article
              key={key}
              className="rounded-[14px] border border-[var(--line)] bg-white/[0.03] px-[22px] pt-6 pb-[22px] motion-safe:transition-colors motion-safe:duration-150 hover:border-[var(--line-strong)] hover:bg-white/[0.045]"
            >
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-[var(--accent-dim)] text-[var(--accent-soft)]">
                <Icon className="h-[18px] w-[18px]" />
              </div>
              <h3 className="mt-4 text-[15px] font-bold tracking-[-0.01em] leading-tight text-white">
                {t(`security.commitments.${key}.title`, { defaultValue: titleDefault })}
              </h3>
              <p className="mt-2 text-[13px] leading-[1.55] text-white/[0.72]">
                {t(`security.commitments.${key}.description`, { defaultValue: descriptionDefault })}
              </p>
            </article>
          ))}
        </div>

        <article className="mt-4 rounded-[14px] border border-[var(--line-strong)] bg-white/[0.035] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-[var(--accent-dim)] text-[var(--accent-soft)]">
              <svg className="h-[18px] w-[18px]" {...ICON_PROPS}>
                <rect x="3" y="6" width="8" height="12" rx="1.5" />
                <rect x="13" y="6" width="8" height="12" rx="1.5" />
              </svg>
            </div>
            <div>
              <h3 className="text-[15px] font-bold tracking-[-0.01em] leading-tight text-white">
                {t('security.separation.title', {
                  defaultValue: 'Website and Product Data Stay Separate',
                })}
              </h3>
              <p className="mt-2 text-[14px] leading-[1.6] text-white/[0.72]">
                {t('security.separation.description', {
                  defaultValue:
                    'The website collects contact and demo inquiry fields only. SyncRevenue product data processing is separate, and GDS credentials never touch the website.',
                })}
              </p>
            </div>
          </div>
        </article>
      </div>
    </MotionSection>
  )
}
