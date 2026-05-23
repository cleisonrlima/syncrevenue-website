import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { useDocumentMeta } from '@/components/SEO'

/**
 * Story 7.3 (AC 1): Dashboard Overview page mounted at `/dashboard`.
 *
 * Source: Figma Make file `66Wb2MAv5PLOBSJLoFM3E3`,
 * `src/app/pages/DashboardHome.tsx`. Ported verbatim via the Figma MCP
 * `ReadMcpResourceTool` (file://figma/make/source/.../DashboardHome.tsx)
 * with the following intentional, story-scoped deltas:
 *
 *   - Dropped the redundant `import React from 'react'` default — React 18
 *     + Vite's new JSX transform makes it unnecessary (Story 7.3 dev-note
 *     3). `React.ReactNode` references are replaced with the named type
 *     import `import { type ReactNode } from 'react'`.
 *   - Added the local `useDocumentMeta` SEO hook (continuing the
 *     placeholder pattern Story 7.2 established for every dashboard page).
 *     The page document title/description still resolve through the existing
 *     i18n keys so Story 7.5 (i18n extraction) lands as a no-op against the
 *     surrounding head metadata.
 *   - Removed unused lucide icon `Users` from the Figma source's import
 *     list (it was present in the source but never referenced).
 *   - Added `aria-label="Time range"` to the unlabeled `<select>` for
 *     baseline a11y. Story 7.8 owns the full per-route axe pass.
 *
 * Mock data (`REVENUE_DATA`, `DISCREPANCIES`) retains the Figma vocabulary
 * (carrier, policy, etc.). Story 7.6 owns the brand-copy + domain
 * vocabulary rewrite to travel-commission terms; Story 7.5 owns the
 * extraction of the hard-coded English strings into i18n. Inline chart
 * color hex literals (`#818cf8`, `#94a3b8`, `#1A1A24`) stay inline for
 * Epic 7; migration to `var(--chart-N)` is a future story.
 */

// TODO(epic-7-story-6): rename `carrier`/`policy` fields + sample copy to
// travel-commission vocabulary; also wire to real data in a later epic.
const REVENUE_DATA = [
  { name: 'Jan', recovered: 4000, baseline: 2400 },
  { name: 'Feb', recovered: 5500, baseline: 2800 },
  { name: 'Mar', recovered: 4800, baseline: 3200 },
  { name: 'Apr', recovered: 7200, baseline: 3600 },
  { name: 'May', recovered: 8500, baseline: 4000 },
  { name: 'Jun', recovered: 9400, baseline: 4200 },
  { name: 'Jul', recovered: 12500, baseline: 4600 },
]

// Status pill data: `statusKey` drives the translated label via
// `t('dashboard.status.<statusKey>')`; `statusColor` styling stays inline
// (kept English-keyed pre-Story-7.5; Story 7.6 owns the redesign).
const DISCREPANCIES = [
  { id: '1', carrier: 'Global Life', policy: 'POL-8823', expected: 1200, actual: 800, statusKey: 'pending', statusColor: 'text-amber-400 bg-amber-400/10' },
  { id: '2', carrier: 'Apex Health', policy: 'POL-9011', expected: 450, actual: 0, statusKey: 'resolved', statusColor: 'text-green-400 bg-green-400/10' },
  { id: '3', carrier: 'Prime Auto', policy: 'POL-7734', expected: 890, actual: 800, statusKey: 'disputed', statusColor: 'text-indigo-400 bg-indigo-400/10' },
  { id: '4', carrier: 'Global Life', policy: 'POL-8824', expected: 2100, actual: 1500, statusKey: 'pending', statusColor: 'text-amber-400 bg-amber-400/10' },
] as const

// Time range state uses stable ID-style keys; the `t()` lookup resolves the
// translated label at render time. The data lookup is a no-op for all three
// IDs (the Figma source ships a single dataset across ranges), so the
// function is preserved for future expansion.
const TIME_RANGES = ['last7Months', 'thisYear', 'allTime'] as const
type TimeRange = (typeof TIME_RANGES)[number]

const TIME_RANGE_FALLBACK_LABEL: Record<TimeRange, string> = {
  last7Months: 'Last 7 Months',
  thisYear: 'This Year',
  allTime: 'All Time',
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function chartDataForRange(range: TimeRange) {
  if (range === 'last7Months') return REVENUE_DATA
  if (range === 'thisYear') return REVENUE_DATA
  return REVENUE_DATA
}

export default function DashboardHome() {
  const { t } = useTranslation()

  useDocumentMeta({
    titleKey: 'seo.dashboard.home.title',
    descriptionKey: 'seo.dashboard.home.description',
    ogTitleKey: 'seo.dashboard.home.ogTitle',
    ogDescriptionKey: 'seo.dashboard.home.ogDescription',
    path: '/dashboard',
  })

  const [timeRange, setTimeRange] = useState<TimeRange>('last7Months')
  const chartData = chartDataForRange(timeRange)

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500" data-testid="dashboard-home">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {t('dashboard.overview.title', 'Overview')}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {t('dashboard.overview.subtitle', "Here's what's happening with your revenue today.")}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title={t('dashboard.overview.metrics.totalRecovered', 'Total Recovered')}
          value="$51,900.00"
          trend="+14.2%"
          isPositive={true}
          icon={<DollarSign className="w-5 h-5 text-green-400" />}
        />
        <MetricCard
          title={t('dashboard.overview.metrics.activeDiscrepancies', 'Active Discrepancies')}
          value="24"
          trend="-5.1%"
          isPositive={true}
          icon={<AlertCircle className="w-5 h-5 text-amber-400" />}
        />
        <MetricCard
          title={t('dashboard.overview.metrics.payoutsProcessed', 'Payouts Processed')}
          value="$142,300.00"
          trend="+8.4%"
          isPositive={true}
          icon={<CheckCircle2 className="w-5 h-5 text-indigo-400" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#12121A] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold text-white">
                {t('dashboard.overview.chart.title', 'Revenue Recovery Trend')}
              </h2>
              <p className="text-sm text-slate-400">
                {t('dashboard.overview.chart.subtitle', 'Comparing recovered vs baseline commissions')}
              </p>
            </div>
            <select
              aria-label={t('dashboard.overview.chart.timeRangeLabel', 'Time range')}
              data-testid="dashboard-home-time-range"
              value={timeRange}
              onChange={(event) => setTimeRange(event.target.value as TimeRange)}
              className="bg-[#1A1A24] border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none hover:border-white/20 transition-colors"
            >
              {TIME_RANGES.map((range) => (
                <option key={range} value={range}>
                  {t(`dashboard.overview.timeRanges.${range}`, TIME_RANGE_FALLBACK_LABEL[range])}
                </option>
              ))}
            </select>
          </div>
          <div className="h-[300px] w-full" data-testid="dashboard-home-area-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1A1A24', borderColor: '#ffffff1a', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="recovered" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorRecovered)" />
                <Area type="monotone" dataKey="baseline" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorBaseline)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions / Discrepancies Summary */}
        <div className="bg-[#12121A] border border-white/5 rounded-2xl p-6 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-6">
            {t('dashboard.overview.recentDiscrepancies.title', 'Recent Discrepancies')}
          </h2>
          <div className="flex-1 space-y-4" data-testid="dashboard-home-recent-list">
            {DISCREPANCIES.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-sm font-medium text-white">{item.carrier}</p>
                  <p className="text-xs text-slate-400">{item.policy}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">
                    {formatCurrency(item.actual)}{' '}
                    <span className="text-slate-500 font-normal text-xs line-through ml-1">
                      {formatCurrency(item.expected)}
                    </span>
                  </p>
                  <p className="text-xs font-medium text-amber-400">
                    {t('dashboard.overview.recentDiscrepancies.deltaLabel', 'Delta {{amount}}', {
                      amount: formatCurrency(item.expected - item.actual),
                    })}
                  </p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${item.statusColor}`}>
                    {t(`dashboard.status.${item.statusKey}`, item.statusKey.charAt(0).toUpperCase() + item.statusKey.slice(1))}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="w-full mt-6 py-2.5 text-sm font-medium text-white hover:text-black transition-colors border border-white/20 rounded-xl hover:bg-white"
          >
            {t('dashboard.overview.recentDiscrepancies.viewAll', 'View All Discrepancies')}
          </button>
        </div>
      </div>
    </div>
  )
}

type MetricCardProps = {
  title: string
  value: string
  trend: string
  isPositive: boolean
  icon: ReactNode
}

function MetricCard({ title, value, trend, isPositive, icon }: MetricCardProps) {
  return (
    <div className="bg-[#12121A] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">{icon}</div>
      </div>
      <div className="flex items-baseline gap-4">
        <h2 className="text-3xl font-bold text-white">{value}</h2>
        <div className={`flex items-center text-sm font-medium ${isPositive ? 'text-green-400' : 'text-rose-400'}`}>
          {isPositive ? (
            <ArrowUpRight className="w-4 h-4 mr-0.5" />
          ) : (
            <ArrowDownRight className="w-4 h-4 mr-0.5" />
          )}
          {trend}
        </div>
      </div>
    </div>
  )
}
