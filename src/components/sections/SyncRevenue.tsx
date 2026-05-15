import { useTranslation } from 'react-i18next'
import SectionHeader from '@/components/ui/SectionHeader'

const gdsIntegrations = [
  {
    key: 'amadeus',
    defaultValue: 'Amadeus',
  },
  {
    key: 'sabre',
    defaultValue: 'Sabre',
  },
  {
    key: 'galileo',
    defaultValue: 'Galileo',
  },
  {
    key: 'worldspan',
    defaultValue: 'Worldspan',
  },
] as const

export default function SyncRevenue() {
  const { t } = useTranslation()

  return (
    <section
      id="syncrevenue"
      role="region"
      aria-label={t('syncrevenue.headline', {
        defaultValue: 'Automated Commission Reconciliation',
      })}
      className="bg-white"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <SectionHeader
          variant="light"
          eyebrow={t('syncrevenue.eyebrow', { defaultValue: 'Our Flagship Product' })}
          heading={t('syncrevenue.headline', {
            defaultValue: 'Automated Commission Reconciliation',
          })}
          subtext={t('syncrevenue.subtext', {
            defaultValue:
              'SyncRevenue connects to your GDS feeds and automatically identifies commission discrepancies, disputed debit memos, and BSP/ARC reconciliation failures — recovering revenue your team would otherwise miss.',
          })}
          className="[&>p:first-of-type]:text-brand-deep [&_h2]:scroll-mt-24"
        />

        <div className="mt-12 mx-auto max-w-4xl text-center">
          <h3 className="text-xl font-bold text-brand-navy">
            {t('syncrevenue.gds.title', { defaultValue: 'GDS Integrations' })}
          </h3>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {gdsIntegrations.map(integration => (
              <div
                key={integration.key}
                className="rounded-lg border border-brand-slate/20 bg-[#F4F6FA] px-5 py-4 text-center"
              >
                <span className="text-base font-semibold text-brand-navy">
                  {t(`syncrevenue.gds.${integration.key}`, {
                    defaultValue: integration.defaultValue,
                  })}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-8 text-base sm:text-lg leading-8 text-brand-slate">
            {t('syncrevenue.accuracy', {
              defaultValue: '99.99% commission assertivity across all integrated GDS platforms.',
            })}
          </p>
        </div>
      </div>
    </section>
  )
}
