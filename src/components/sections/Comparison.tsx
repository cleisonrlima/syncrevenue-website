import { useTranslation } from 'react-i18next'
import MotionSection from './MotionSection'
import SectionHeader from '@/components/ui/SectionHeader'

const featureRows = [
  {
    key: 'reconciliation',
    labelDefault: 'BSP/ARC Reconciliation',
    syncrevenueDefault: 'Automatically detects settlement discrepancies before revenue leaks continue.',
    legacyDefault: 'Spreadsheet matching after closing leaves issues for monthly cleanup.',
    genericDefault: 'Does not model airline settlement workflows without heavy configuration.',
  },
  {
    key: 'debitMemo',
    labelDefault: 'Debit Memo Dispute Management',
    syncrevenueDefault: 'Links each dispute to commission context, booking history, and recovery status.',
    legacyDefault: 'Teams track reason codes and supporting notes manually.',
    genericDefault: 'Requires custom task processes to keep disputes and commissions connected.',
  },
  {
    key: 'gdsIntegration',
    labelDefault: 'Multi-GDS Integration',
    syncrevenueDefault: 'Covers Amadeus, Sabre, Galileo, and Worldspan commission workflows.',
    legacyDefault: 'Depends on copied exports or isolated single-GDS views.',
    genericDefault: 'Requires CSV imports and manual mapping before analysis can start.',
  },
  {
    key: 'reporting',
    labelDefault: 'Real-Time Commission Reporting',
    syncrevenueDefault: 'Shows recovery status and commission exceptions as work progresses.',
    legacyDefault: 'Monthly reporting delays visibility into missed or disputed revenue.',
    genericDefault: 'Dashboards depend on manual refreshes and spreadsheet upkeep.',
  },
  {
    key: 'audit',
    labelDefault: 'Automated Audit Trail',
    syncrevenueDefault: 'Creates system records for reconciliation actions, disputes, and outcomes.',
    legacyDefault: 'Evidence is scattered across emails, files, and individual spreadsheets.',
    genericDefault: 'Stores attachments or notes without travel-specific traceability.',
  },
] as const

function ComparisonTable({ ariaLabel }: { ariaLabel: string }) {
  const { t } = useTranslation()

  return (
    <div className="overflow-x-auto rounded-[14px] border border-[var(--line-strong)] bg-white/[0.03]">
      <table aria-label={ariaLabel} className="min-w-[720px] w-full border-collapse text-left">
        <thead className="bg-white/[0.04]">
          <tr>
            <th
              scope="col"
              className="w-[22%] px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/55"
            >
              {t('comparison.featureHeader', { defaultValue: 'Feature' })}
            </th>
            <th
              scope="col"
              className="w-[26%] px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-brand-soft)]"
            >
              {t('comparison.syncrevenueHeader', { defaultValue: 'SyncRevenue' })}
            </th>
            <th
              scope="col"
              className="w-[26%] px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/55"
            >
              {t('comparison.legacyHeader', { defaultValue: 'Manual / Legacy Tools' })}
            </th>
            <th
              scope="col"
              className="w-[26%] px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/55"
            >
              {t('comparison.genericHeader', { defaultValue: 'Generic Tools' })}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line)]">
          {featureRows.map(row => (
            <tr key={row.key} className="align-top">
              <th
                scope="row"
                className="px-5 py-5 text-[13.5px] font-semibold leading-[1.5] text-white"
              >
                {t(`comparison.features.${row.key}.label`, { defaultValue: row.labelDefault })}
              </th>
              <td className="px-5 py-5 text-[13px] leading-[1.6] text-white/[0.78]">
                {t(`comparison.features.${row.key}.syncrevenue`, {
                  defaultValue: row.syncrevenueDefault,
                })}
              </td>
              <td className="px-5 py-5 text-[13px] leading-[1.6] text-white/55">
                {t(`comparison.features.${row.key}.legacy`, {
                  defaultValue: row.legacyDefault,
                })}
              </td>
              <td className="px-5 py-5 text-[13px] leading-[1.6] text-white/55">
                {t(`comparison.features.${row.key}.generic`, {
                  defaultValue: row.genericDefault,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Comparison() {
  const { t } = useTranslation()
  const ariaLabel = t('comparison.ariaLabel', {
    defaultValue: 'SyncRevenue comparison against manual and generic tools',
  })

  return (
    <MotionSection
      id="comparison"
      role="region"
      aria-label={ariaLabel}
      className="sec bg-[var(--ink)] text-white scroll-mt-24"
    >
      <div className="sec-inner mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-14 py-24 lg:py-[100px]">
        <SectionHeader
          variant="sober"
          eyebrow={t('comparison.eyebrow', { defaultValue: 'Why SyncRevenue' })}
          heading={t('comparison.headline', {
            defaultValue: 'Stop Losing Revenue to Manual Processes',
          })}
          subtext={t('comparison.subtext', {
            defaultValue: 'See how automated commission management compares to the status quo.',
          })}
          className="[&_h2]:scroll-mt-24"
        />

        <ComparisonTable ariaLabel={ariaLabel} />
      </div>
    </MotionSection>
  )
}
