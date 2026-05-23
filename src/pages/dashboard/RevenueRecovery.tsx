import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Filter,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreHorizontal,
} from 'lucide-react'
import { useDocumentMeta } from '@/components/SEO'

/**
 * Story 7.3 (AC 2): Revenue Recovery dashboard page mounted at
 * `/dashboard/recovery`.
 *
 * Source: Figma Make file `66Wb2MAv5PLOBSJLoFM3E3`,
 * `src/app/pages/RevenueRecovery.tsx`. Ported verbatim via the Figma MCP
 * `ReadMcpResourceTool` with the following intentional, story-scoped
 * deltas:
 *
 *   - Dropped the redundant `import React from 'react'` default — React 18
 *     + Vite's new JSX transform makes it unnecessary (Story 7.3 dev-note
 *     3); only the named `useState` import is retained.
 *   - Removed unused lucide icon `ChevronDown` from the Figma source's
 *     import list (it was imported but never referenced).
 *   - Added the local `useDocumentMeta` SEO hook continuing the Story 7.2
 *     placeholder pattern (every dashboard page owns its head metadata).
 *   - Added explicit `type="button"` to every non-submit `<button>` so
 *     React form-default `type="submit"` does not surprise consumers — a
 *     baseline hardening Story 3.10 established for the rest of the app.
 *   - Added a `<label>` (`sr-only`) for the search `<input>` and
 *     `aria-label` strings for icon-only buttons (filter / row actions) so
 *     the page passes a basic a11y audit even before Story 7.8 runs the
 *     full per-route axe sweep.
 *
 * Mock data (`METRICS`, `DISCREPANCIES`) retains the Figma vocabulary
 * (carrier, policy, clawback, etc.); Story 7.6 owns the brand-copy +
 * domain vocabulary rewrite. The 4-tab filter pattern uses `useState<string>`
 * with derived `filter`; identical pattern repeats in `Payouts.tsx`.
 * Empty-state row + pagination footer are wired but stateless (real
 * pagination lands in a later epic).
 */

// TODO(epic-7-story-6): rename `carrier`/`policy`/`clawback` fields + sample
// copy to travel-commission vocabulary; wire to real data in a later epic.
// Story 7.5: `labelKey`/`subKey` resolve via `t()`; English fallbacks remain
// inline so dev-mode missing-key renders are still legible.
type Metric = {
  labelKey: string
  labelFallback: string
  value: string
  subKey: string
  subFallback: string
  icon: typeof AlertTriangle
  color: string
  bg: string
}

const METRICS: ReadonlyArray<Metric> = [
  {
    labelKey: 'dashboard.recovery.metrics.unrecovered',
    labelFallback: 'Unrecovered Revenue',
    value: '$42,500.00',
    subKey: 'dashboard.recovery.metrics.unrecoveredSub',
    subFallback: '24 pending discrepancies',
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
  },
  {
    labelKey: 'dashboard.recovery.metrics.inDispute',
    labelFallback: 'In Dispute',
    value: '$18,200.00',
    subKey: 'dashboard.recovery.metrics.inDisputeSub',
    subFallback: '12 active disputes',
    icon: Clock,
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10',
  },
  {
    labelKey: 'dashboard.recovery.metrics.recoveredYtd',
    labelFallback: 'Recovered (YTD)',
    value: '$154,800.00',
    subKey: 'dashboard.recovery.metrics.recoveredYtdSub',
    subFallback: 'From 85 policies',
    icon: CheckCircle,
    color: 'text-green-400',
    bg: 'bg-green-400/10',
  },
]

// Row `status` uses the English label as identity key for the
// conditional pill styling below (kept English-keyed pre-Story-7.6 per the
// Story 7.5 plan approved 2026-05-22). The displayed label is resolved via
// `t('dashboard.status.<englishToKey>')` at render time.
const DISCREPANCIES = [
  { id: '1', carrier: 'Global Life', policy: 'POL-8823', client: 'Acme Corp', expected: 1200, actual: 800, type: 'Missing Payment', status: 'Action Required' },
  { id: '2', carrier: 'Apex Health', policy: 'POL-9011', client: 'TechFlow', expected: 450, actual: 0, type: 'Clawback Error', status: 'Disputed' },
  { id: '3', carrier: 'Prime Auto', policy: 'POL-7734', client: 'Vanguard', expected: 890, actual: 800, type: 'Incorrect Rate', status: 'Resolved' },
  { id: '4', carrier: 'Global Life', policy: 'POL-8824', client: 'Acme Corp', expected: 2100, actual: 1500, type: 'Missing Payment', status: 'Action Required' },
  { id: '5', carrier: 'SecureCare', policy: 'POL-4412', client: 'Elevate Inc', expected: 300, actual: 150, type: 'Incorrect Rate', status: 'Action Required' },
  { id: '6', carrier: 'Apex Health', policy: 'POL-9012', client: 'TechFlow', expected: 800, actual: 400, type: 'Missing Payment', status: 'Disputed' },
  { id: '7', carrier: 'Prime Auto', policy: 'POL-7735', client: 'Vanguard', expected: 1200, actual: 1200, type: 'Matched', status: 'Resolved' },
]

// Tab IDs decouple the active-tab state from the rendered label.
// `englishMatch` is the value used against `item.status` for filtering,
// preserving the existing English-keyed mock data without a separate
// translation lookup.
const TABS = [
  { id: 'all', testIdSlug: 'all-discrepancies', i18nKey: 'dashboard.recovery.tabs.all', fallback: 'All Discrepancies', englishMatch: 'All Discrepancies' },
  { id: 'actionRequired', testIdSlug: 'action-required', i18nKey: 'dashboard.recovery.tabs.actionRequired', fallback: 'Action Required', englishMatch: 'Action Required' },
  { id: 'disputed', testIdSlug: 'disputed', i18nKey: 'dashboard.recovery.tabs.disputed', fallback: 'Disputed', englishMatch: 'Disputed' },
  { id: 'resolved', testIdSlug: 'resolved', i18nKey: 'dashboard.recovery.tabs.resolved', fallback: 'Resolved', englishMatch: 'Resolved' },
] as const

type TabId = (typeof TABS)[number]['id']

// Map English row.status → translated pill label key.
const STATUS_KEY_MAP: Record<string, string> = {
  'Action Required': 'actionRequired',
  Disputed: 'disputed',
  Resolved: 'resolved',
}

export default function RevenueRecovery() {
  const { t } = useTranslation()

  useDocumentMeta({
    titleKey: 'seo.dashboard.recovery.title',
    descriptionKey: 'seo.dashboard.recovery.description',
    ogTitleKey: 'seo.dashboard.recovery.ogTitle',
    ogDescriptionKey: 'seo.dashboard.recovery.ogDescription',
    path: '/dashboard/recovery',
  })

  const [activeTab, setActiveTab] = useState<TabId>('actionRequired')
  const [searchQuery, setSearchQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')

  const filteredData = DISCREPANCIES.filter((item) => {
    const tab = TABS.find((entry) => entry.id === activeTab)
    const matchesTab = activeTab === 'all' || (tab && item.status === tab.englishMatch)
    const normalizedQuery = appliedQuery.trim().toLowerCase()
    const matchesQuery =
      normalizedQuery.length === 0 ||
      [item.carrier, item.policy, item.client, item.type, item.status].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      )

    return matchesTab && matchesQuery
  })

  return (
    <div
      className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500"
      data-testid="dashboard-recovery"
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {t('dashboard.recovery.title', 'Revenue Recovery')}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {t('dashboard.recovery.subtitle', 'Audit carrier statements and manage commission disputes.')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-4 py-2 bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('dashboard.recovery.actions.exportReport', 'Export Report')}
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {t('dashboard.recovery.actions.newDispute', 'New Dispute')}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {METRICS.map((metric) => {
          const Icon = metric.icon
          return (
            <div
              key={metric.labelKey}
              className="bg-[#12121A] border border-white/5 rounded-2xl p-6 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-white/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">
                    {t(metric.labelKey, metric.labelFallback)}
                  </p>
                  <h2 className="text-3xl font-bold text-white mb-2">{metric.value}</h2>
                  <p className="text-xs text-slate-500">{t(metric.subKey, metric.subFallback)}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${metric.bg}`}>
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Content Area */}
      <div className="bg-[#12121A] border border-white/5 rounded-2xl flex flex-col">
        {/* Table Header & Controls */}
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div
            className="flex items-center gap-1 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar"
            data-testid="dashboard-recovery-tabs"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                data-testid={`dashboard-recovery-tab-${tab.testIdSlug}`}
                aria-pressed={activeTab === tab.id}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {t(tab.i18nKey, tab.fallback)}
                {tab.id === 'actionRequired' && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px]">
                    3
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <label htmlFor="dashboard-recovery-search" className="sr-only">
                {t('dashboard.recovery.searchLabel', 'Search policies')}
              </label>
              <input
                id="dashboard-recovery-search"
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    setAppliedQuery(searchQuery)
                  }
                }}
                placeholder={t('dashboard.recovery.searchPlaceholder', 'Search policies...')}
                className="pl-9 pr-4 py-2 bg-white/[0.02] border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 w-full sm:w-64 transition-colors"
              />
            </div>
            <button
              type="button"
              aria-label={t('dashboard.recovery.filterLabel', 'Filter results')}
              onClick={() => setAppliedQuery(searchQuery)}
              className="p-2 bg-white/[0.02] border border-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-sm text-slate-400">
                <th className="px-6 py-4 font-medium">{t('dashboard.recovery.table.carrier', 'Carrier & Policy')}</th>
                <th className="px-6 py-4 font-medium">{t('dashboard.recovery.table.client', 'Client')}</th>
                <th className="px-6 py-4 font-medium">{t('dashboard.recovery.table.expected', 'Expected')}</th>
                <th className="px-6 py-4 font-medium">{t('dashboard.recovery.table.actual', 'Actual')}</th>
                <th className="px-6 py-4 font-medium">{t('dashboard.recovery.table.delta', 'Delta')}</th>
                <th className="px-6 py-4 font-medium">{t('dashboard.recovery.table.type', 'Type')}</th>
                <th className="px-6 py-4 font-medium">{t('dashboard.recovery.table.status', 'Status')}</th>
                <th className="px-6 py-4 font-medium text-right">{t('dashboard.recovery.table.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="text-sm" data-testid="dashboard-recovery-tbody">
              {filteredData.map((row) => {
                const delta = row.expected - row.actual
                return (
                  <tr
                    key={row.id}
                    data-testid="dashboard-recovery-row"
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{row.carrier}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{row.policy}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{row.client}</td>
                    <td className="px-6 py-4 text-slate-300">${row.expected.toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-300">${row.actual.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {delta > 0 ? (
                        <span className="text-amber-400 font-medium">-${delta.toFixed(2)}</span>
                      ) : (
                        <span className="text-slate-500">-$0.00</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{row.type}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          row.status === 'Action Required'
                            ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                            : row.status === 'Disputed'
                            ? 'bg-indigo-400/10 text-indigo-400 border border-indigo-400/20'
                            : 'bg-green-400/10 text-green-400 border border-green-400/20'
                        }`}
                      >
                        {t(`dashboard.status.${STATUS_KEY_MAP[row.status] ?? 'resolved'}`, row.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        aria-label={t('dashboard.rowActions.open', 'Open row actions')}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                )
              })}

              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    {t('dashboard.recovery.emptyState', 'No discrepancies found for this view.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination / Footer */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between text-sm text-slate-400">
          <p>
            {t('dashboard.recovery.pagination.showing', 'Showing {{count}} of {{total}} results', {
              count: filteredData.length,
              total: DISCREPANCIES.length,
            })}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 hover:bg-white/5 rounded-md transition-colors disabled:opacity-50"
              disabled
            >
              {t('dashboard.pagination.previous', 'Previous')}
            </button>
            <button
              type="button"
              className="px-3 py-1.5 hover:bg-white/5 rounded-md transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
              disabled
            >
              {t('dashboard.pagination.next', 'Next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
