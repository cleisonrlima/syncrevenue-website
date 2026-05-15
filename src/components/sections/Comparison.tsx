import { useTranslation } from 'react-i18next'
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
    <div className="mt-12 overflow-x-auto rounded-lg border border-brand-slate/20 bg-white shadow-sm">
      <table aria-label={ariaLabel} className="min-w-[720px] w-full border-collapse text-left">
        <thead className="bg-[#F4F6FA]">
          <tr>
            <th scope="col" className="w-[22%] px-5 py-4 text-sm font-bold text-brand-navy">
              {t('comparison.featureHeader', { defaultValue: 'Feature' })}
            </th>
            <th scope="col" className="w-[26%] px-5 py-4 text-sm font-bold text-brand-navy">
              {t('comparison.syncrevenueHeader', { defaultValue: 'SyncRevenue' })}
            </th>
            <th scope="col" className="w-[26%] px-5 py-4 text-sm font-bold text-brand-navy">
              {t('comparison.legacyHeader', { defaultValue: 'Manual / Legacy Tools' })}
            </th>
            <th scope="col" className="w-[26%] px-5 py-4 text-sm font-bold text-brand-navy">
              {t('comparison.genericHeader', { defaultValue: 'Generic Tools' })}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-slate/15">
          {featureRows.map(row => (
            <tr key={row.key} className="align-top">
              <th scope="row" className="px-5 py-5 text-sm font-bold leading-6 text-brand-navy">
                {t(`comparison.features.${row.key}.label`, { defaultValue: row.labelDefault })}
              </th>
              <td className="px-5 py-5 text-sm leading-6 text-brand-slate">
                {t(`comparison.features.${row.key}.syncrevenue`, {
                  defaultValue: row.syncrevenueDefault,
                })}
              </td>
              <td className="px-5 py-5 text-sm leading-6 text-brand-slate">
                {t(`comparison.features.${row.key}.legacy`, {
                  defaultValue: row.legacyDefault,
                })}
              </td>
              <td className="px-5 py-5 text-sm leading-6 text-brand-slate">
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
    <section id="comparison" role="region" aria-label={ariaLabel} className="bg-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <SectionHeader
          variant="light"
          eyebrow={t('comparison.eyebrow', { defaultValue: 'Why SyncRevenue' })}
          heading={t('comparison.headline', {
            defaultValue: 'Stop Losing Revenue to Manual Processes',
          })}
          subtext={t('comparison.subtext', {
            defaultValue: 'See how automated commission management compares to the status quo.',
          })}
          className="[&>p:first-of-type]:text-brand-deep [&_h2]:scroll-mt-24"
        />

        <ComparisonTable ariaLabel={ariaLabel} />
      </div>
    </section>
  )
}
