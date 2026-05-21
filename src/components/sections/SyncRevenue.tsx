import { useTranslation } from 'react-i18next'
import MotionSection from './MotionSection'
import SectionHeader from '@/components/ui/SectionHeader'

const gdsIntegrations = [
  { key: 'amadeus', defaultValue: 'Amadeus' },
  { key: 'sabre', defaultValue: 'Sabre' },
  { key: 'galileo', defaultValue: 'Galileo' },
  { key: 'worldspan', defaultValue: 'Worldspan' },
] as const

export default function SyncRevenue() {
  const { t } = useTranslation()

  return (
    <MotionSection
      id="syncrevenue"
      role="region"
      aria-label={t('syncrevenue.headline', {
        defaultValue: 'Automated Commission Reconciliation',
      })}
      className="sec sec-deep relative bg-[#0A0B22] text-white scroll-mt-24"
    >
      <span id="produto" aria-hidden="true" className="absolute top-0" />
      <div className="sec-inner mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-14 py-24 lg:py-[100px]">
        <SectionHeader
          variant="sober"
          eyebrow={t('syncrevenue.eyebrow', { defaultValue: 'Our Flagship Product' })}
          heading={t('syncrevenue.headline', {
            defaultValue: 'Automated Commission Reconciliation',
          })}
          subtext={t('syncrevenue.subtext', {
            defaultValue:
              'SyncRevenue connects to your GDS feeds and automatically identifies commission discrepancies, disputed debit memos, and BSP/ARC reconciliation failures — recovering revenue your team would otherwise miss.',
          })}
          className="[&_h2]:scroll-mt-24"
        />

        <div className="mx-auto max-w-4xl text-center">
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/50">
            {t('syncrevenue.gds.title', { defaultValue: 'GDS Integrations' })}
          </h3>

          <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {gdsIntegrations.map(integration => (
              <div
                key={integration.key}
                className="rounded-[14px] border border-[var(--line)] bg-white/[0.03] px-5 py-4 text-center motion-safe:transition-colors motion-safe:duration-150 hover:border-[var(--line-strong)] hover:bg-white/[0.045]"
              >
                <span className="text-[15px] font-semibold tracking-[-0.01em] text-white">
                  {t(`syncrevenue.gds.${integration.key}`, {
                    defaultValue: integration.defaultValue,
                  })}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-8 text-[15px] leading-[1.65] text-white/[0.65]">
            {t('syncrevenue.accuracy', {
              defaultValue: '99.99% commission assertivity across all integrated GDS platforms.',
            })}
          </p>
        </div>
      </div>
    </MotionSection>
  )
}
