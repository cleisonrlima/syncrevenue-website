import { useTranslation } from 'react-i18next'
import type { ReactElement } from 'react'
import MotionSection from './MotionSection'
import SectionHeader from '@/components/ui/SectionHeader'

type ServiceKey = 'syncrevenue' | 'analytics' | 'obts' | 'custom'

type ServiceCard = {
  key: ServiceKey
  titleDefault: string
  descriptionDefault: string
  icon: (props: { className: string }) => ReactElement
}

const ICON_PROPS = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
  'aria-hidden': true,
}

const serviceCards: ReadonlyArray<ServiceCard> = [
  {
    key: 'syncrevenue',
    titleDefault: 'SyncRevenue',
    descriptionDefault: 'Automated GDS commission reconciliation and recovery for travel agencies.',
    icon: ({ className }) => (
      <svg className={className} {...ICON_PROPS}>
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    key: 'analytics',
    titleDefault: 'BI & Data Analytics',
    descriptionDefault: 'Turn your booking and commission data into actionable intelligence.',
    icon: ({ className }) => (
      <svg className={className} {...ICON_PROPS}>
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 4 4 5-7" />
      </svg>
    ),
  },
  {
    key: 'obts',
    titleDefault: 'Online Booking Tools',
    descriptionDefault: 'Implementation, optimization, and support for OBT platforms.',
    icon: ({ className }) => (
      <svg className={className} {...ICON_PROPS}>
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M8 22h8M12 18v4" />
      </svg>
    ),
  },
  {
    key: 'custom',
    titleDefault: 'Custom Development',
    descriptionDefault: 'Bespoke solutions for complex airline distribution and revenue challenges.',
    icon: ({ className }) => (
      <svg className={className} {...ICON_PROPS}>
        <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
      </svg>
    ),
  },
] as const

export default function Services() {
  const { t } = useTranslation()

  return (
    <MotionSection
      id="services"
      role="region"
      aria-label={t('services.headline', {
        defaultValue: 'Complete Revenue Intelligence Suite',
      })}
      className="sec sec-deep bg-[#0A0B22] text-white scroll-mt-24"
    >
      <div className="sec-inner mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-14 py-24 lg:py-[100px]">
        <SectionHeader
          variant="sober"
          eyebrow={t('services.eyebrow', { defaultValue: 'Our Services' })}
          heading={t('services.headline', {
            defaultValue: 'Complete Revenue Intelligence Suite',
          })}
          subtext={t('services.subtext', {
            defaultValue:
              'Whether you need automated reconciliation, data analytics, or custom development, we have the expertise to solve your specific challenge.',
          })}
          className="[&_h2]:scroll-mt-24"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {serviceCards.map(service => {
            const Icon = service.icon
            return (
              <article
                key={service.key}
                className="rounded-[14px] border border-[var(--line)] bg-white/[0.03] px-[22px] pt-6 pb-[22px] motion-safe:transition-colors motion-safe:duration-150 hover:border-[var(--line-strong)] hover:bg-white/[0.045]"
              >
                <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-[var(--accent-dim)] text-[var(--accent-soft)]">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <h3 className="mt-4 text-[15px] font-bold tracking-[-0.01em] leading-tight text-white">
                  {t(`services.${service.key}.title`, { defaultValue: service.titleDefault })}
                </h3>
                <p className="mt-2 text-[13px] leading-[1.55] text-white/[0.72]">
                  {t(`services.${service.key}.description`, {
                    defaultValue: service.descriptionDefault,
                  })}
                </p>
              </article>
            )
          })}
        </div>

        <p className="mt-12 text-center text-[14px] leading-[1.6] text-white/55">
          {t('services.contact', { defaultValue: 'Not sure which service fits? Contact us.' })}
        </p>
      </div>
    </MotionSection>
  )
}
