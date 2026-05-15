import { useTranslation } from 'react-i18next'
import SectionHeader from '@/components/ui/SectionHeader'

const serviceCards = [
  {
    key: 'syncrevenue',
    titleDefault: 'SyncRevenue',
    descriptionDefault: 'Automated GDS commission reconciliation and recovery for travel agencies.',
  },
  {
    key: 'analytics',
    titleDefault: 'BI & Data Analytics',
    descriptionDefault: 'Turn your booking and commission data into actionable intelligence.',
  },
  {
    key: 'obts',
    titleDefault: 'Online Booking Tools',
    descriptionDefault: 'Implementation, optimization, and support for OBT platforms.',
  },
  {
    key: 'custom',
    titleDefault: 'Custom Development',
    descriptionDefault: 'Bespoke solutions for complex airline distribution and revenue challenges.',
  },
] as const

export default function Services() {
  const { t } = useTranslation()

  return (
    <section
      id="services"
      role="region"
      aria-label={t('services.headline', {
        defaultValue: 'Complete Revenue Intelligence Suite',
      })}
      className="bg-[#F4F6FA]"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <SectionHeader
          variant="light"
          eyebrow={t('services.eyebrow', { defaultValue: 'Our Services' })}
          heading={t('services.headline', {
            defaultValue: 'Complete Revenue Intelligence Suite',
          })}
          subtext={t('services.subtext', {
            defaultValue:
              'Whether you need automated reconciliation, data analytics, or custom development, we have the expertise to solve your specific challenge.',
          })}
          className="[&>p:first-of-type]:text-brand-deep [&_h2]:scroll-mt-24"
        />

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {serviceCards.map(service => (
            <article
              key={service.key}
              className="rounded-lg border border-brand-slate/20 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-bold text-brand-navy">
                {t(`services.${service.key}.title`, { defaultValue: service.titleDefault })}
              </h3>
              <p className="mt-3 text-sm leading-6 text-brand-slate">
                {t(`services.${service.key}.description`, {
                  defaultValue: service.descriptionDefault,
                })}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-12 text-center text-base leading-7 text-brand-slate">
          {t('services.contact', { defaultValue: 'Not sure which service fits? Contact us.' })}
        </p>
      </div>
    </section>
  )
}
