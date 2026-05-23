import { useTranslation } from 'react-i18next'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  TrendingUp,
  Globe2,
  Calendar,
  Download,
  ArrowUpRight,
  Target,
  type LucideIcon,
} from 'lucide-react'
import { useDocumentMeta } from '@/components/SEO'

/**
 * Story 7.3 (AC 4): Predictive Insights dashboard page mounted at
 * `/dashboard/insights`.
 *
 * Source: Figma Make file `66Wb2MAv5PLOBSJLoFM3E3`,
 * `src/app/pages/Insights.tsx`. Ported verbatim via the Figma MCP
 * `ReadMcpResourceTool` with the following intentional, story-scoped
 * deltas:
 *
 *   - Dropped the redundant `import React from 'react'` default — React 18
 *     + Vite's new JSX transform makes it unnecessary (Story 7.3 dev-note
 *     3). The page uses no `React.*` identifier so no replacement import
 *     is required.
 *   - Removed unused recharts imports (`AreaChart`, `Area`, `Legend`) from
 *     the Figma source's import list — they were imported but never
 *     referenced.
 *   - Tightened the local `MetricCard` prop type from `any` to a real type
 *     using `LucideIcon` from `lucide-react`. The Figma source typed the
 *     icon prop as `any`; this would slip an `any` into the production
 *     bundle and trip our future strictness sweep. The render and call
 *     sites are identical to the Figma source.
 *   - Added the local `useDocumentMeta` SEO hook continuing the Story 7.2
 *     placeholder pattern.
 *
 * All 4 chart types (Line / Pie / vertical Bar) are 1:1 ports. Inline
 * chart-series hex literals (`#f59e0b`, `#8b5cf6`, `#ec4899`, `#1A1A24`)
 * stay inline for Epic 7 per dev-note 2; migration to `var(--chart-N)` is
 * a future story. The PieChart center label is positioned via absolutely
 * placed sibling overlay rather than recharts `<Label position="center" />`
 * because the source uses two stacked spans (count + region label).
 */

// TODO(epic-7-story-6): rewrite copy + sample data to the travel-commission
// domain; wire to real data in a later epic.
const FORECAST_DATA = [
  { month: 'Jan', actual: 120, forecast: null },
  { month: 'Feb', actual: 135, forecast: null },
  { month: 'Mar', actual: 125, forecast: null },
  { month: 'Apr', actual: 145, forecast: null },
  { month: 'May', actual: 160, forecast: 160 },
  { month: 'Jun', actual: null, forecast: 175 },
  { month: 'Jul', actual: null, forecast: 190 },
  { month: 'Aug', actual: null, forecast: 205 },
  { month: 'Sep', actual: null, forecast: 220 },
  { month: 'Oct', actual: null, forecast: 215 },
  { month: 'Nov', actual: null, forecast: 240 },
  { month: 'Dec', actual: null, forecast: 260 },
]

const REGIONAL_DATA = [
  { name: 'North America', value: 65, color: '#f59e0b' },
  { name: 'EMEA', value: 25, color: '#8b5cf6' },
  { name: 'APAC', value: 10, color: '#ec4899' },
]

const PRODUCT_PERFORMANCE = [
  { name: 'Air', revenue: 450, growth: 12 },
  { name: 'Hotel', revenue: 380, growth: 8 },
  { name: 'Car', revenue: 290, growth: 15 },
  { name: 'Cruise', revenue: 210, growth: -2 },
]

const TOP_AGENTS = [
  { name: 'Oak & Stone Partners', region: 'North America', volume: '$1.2M', growth: '+18%' },
  { name: 'Nexus Financial', region: 'EMEA', volume: '$850K', growth: '+24%' },
  { name: 'Vanguard Group', region: 'North America', volume: '$720K', growth: '+5%' },
  { name: 'Elevate Inc', region: 'APAC', volume: '$430K', growth: '+42%' },
]

export default function Insights() {
  const { t } = useTranslation()

  useDocumentMeta({
    titleKey: 'seo.dashboard.insights.title',
    descriptionKey: 'seo.dashboard.insights.description',
    ogTitleKey: 'seo.dashboard.insights.ogTitle',
    ogDescriptionKey: 'seo.dashboard.insights.ogDescription',
    path: '/dashboard/insights',
  })

  return (
    <div
      className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12"
      data-testid="dashboard-insights"
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {t('dashboard.insights.title', 'Predictive Insights')}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {t('dashboard.insights.subtitle', 'Forecast cash flow and visualize global agency performance.')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300">
            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
            {t('dashboard.insights.calendarLabel', '2026 Financial Year')}
          </div>
          <button
            type="button"
            className="px-4 py-2 bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('dashboard.insights.actions.exportData', 'Export Data')}
          </button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title={t('dashboard.insights.metrics.globalRevenue', 'Global Revenue YTD')}
          value="$4.2M"
          trend="+18.4%"
          icon={Globe2}
          color="text-amber-400"
          bg="bg-amber-400/10"
        />
        <MetricCard
          title={t('dashboard.insights.metrics.forecastedEoy', 'Forecasted EOY')}
          value="$8.5M"
          trend="+22.1%"
          icon={Target}
          color="text-purple-400"
          bg="bg-purple-400/10"
        />
        <MetricCard
          title={t('dashboard.insights.metrics.averageMargin', 'Average Margin')}
          value="24.8%"
          trend="+2.4%"
          icon={TrendingUp}
          color="text-pink-400"
          bg="bg-pink-400/10"
        />
        <MetricCard
          title={t('dashboard.insights.metrics.activeTerritories', 'Active Territories')}
          value="14"
          trend={t('dashboard.insights.metrics.activeTerritoriesTrend', '+2 new')}
          icon={Globe2}
          color="text-indigo-400"
          bg="bg-indigo-400/10"
        />
      </div>

      {/* Main Forecast Chart */}
      <div
        className="bg-[#12121A] border border-white/5 rounded-2xl p-6"
        data-testid="dashboard-insights-forecast"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-bold text-white">
              {t('dashboard.insights.forecast.title', 'Annual Revenue Forecast')}
            </h2>
            <p className="text-sm text-slate-400">
              {t(
                'dashboard.insights.forecast.subtitle',
                'Historical performance vs. AI-predicted outcomes (in thousands)',
              )}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-slate-300">{t('dashboard.insights.forecast.legendActual', 'Actual')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border-2 border-amber-500 border-dashed" />
              <span className="text-slate-300">{t('dashboard.insights.forecast.legendForecast', 'Forecast')}</span>
            </div>
          </div>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={FORECAST_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${val}k`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1A1A24', borderColor: '#ffffff1a', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Line
                type="monotone"
                dataKey="actual"
                name={t('dashboard.insights.forecast.legendActual', 'Actual')}
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                name={t('dashboard.insights.forecast.legendForecast', 'Forecast')}
                stroke="#f59e0b"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row: Charts & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Regional Distribution */}
        <div
          className="bg-[#12121A] border border-white/5 rounded-2xl p-6"
          data-testid="dashboard-insights-regional"
        >
          <h2 className="text-lg font-bold text-white mb-2">
            {t('dashboard.insights.regional.title', 'Regional Distribution')}
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            {t('dashboard.insights.regional.subtitle', 'Revenue breakdown by global market')}
          </p>
          <div className="h-[250px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={REGIONAL_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {REGIONAL_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1A1A24', borderColor: '#ffffff1a', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value) => [
                    `${value}%`,
                    t('dashboard.insights.regional.tooltipShare', 'Share'),
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-white">3</span>
              <span className="text-xs text-slate-500">
                {t('dashboard.insights.regional.centerLabel', 'Regions')}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {REGIONAL_DATA.map((region) => (
              <div key={region.name} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: region.color }} />
                <span className="text-slate-300">{region.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Product Performance Bar Chart */}
        <div
          className="bg-[#12121A] border border-white/5 rounded-2xl p-6"
          data-testid="dashboard-insights-product"
        >
          <h2 className="text-lg font-bold text-white mb-2">
            {t('dashboard.insights.product.title', 'Product Lines')}
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            {t('dashboard.insights.product.subtitle', 'Commission volume by travel product line')}
          </p>
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PRODUCT_PERFORMANCE} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#cbd5e1"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#1A1A24', borderColor: '#ffffff1a', borderRadius: '8px' }}
                  formatter={(value) => [
                    `$${value}k`,
                    t('dashboard.insights.product.tooltipVolume', 'Volume'),
                  ]}
                />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24}>
                  {PRODUCT_PERFORMANCE.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.growth > 0 ? '#8b5cf6' : '#64748b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers List */}
        <div
          className="bg-[#12121A] border border-white/5 rounded-2xl p-6 flex flex-col"
          data-testid="dashboard-insights-top-agents"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">
                {t('dashboard.insights.topAgencies.title', 'Top Agencies')}
              </h2>
              <p className="text-sm text-slate-400">
                {t('dashboard.insights.topAgencies.subtitle', 'Highest volume partners')}
              </p>
            </div>
          </div>
          <div className="flex-1 space-y-4">
            {TOP_AGENTS.map((agent, i) => (
              <div
                key={agent.name}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    aria-hidden="true"
                    className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs shrink-0 border border-white/10"
                  >
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{agent.name}</p>
                    <p className="text-xs text-slate-500">{agent.region}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{agent.volume}</p>
                  <p className="text-xs text-green-400 font-medium">{agent.growth}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

type MetricCardProps = {
  title: string
  value: string
  trend: string
  icon: LucideIcon
  color: string
  bg: string
}

function MetricCard({ title, value, trend, icon: Icon, color, bg }: MetricCardProps) {
  const { t } = useTranslation()
  return (
    <div className="bg-[#12121A] border border-white/5 rounded-2xl p-6 flex flex-col relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
      <div className="relative z-10">
        <h2 className="text-3xl font-bold text-white mb-2">{value}</h2>
        <div className="flex items-center text-sm font-medium text-green-400">
          <ArrowUpRight className="w-4 h-4 mr-0.5" />
          {trend} {t('dashboard.insights.metrics.yoySuffix', 'YoY')}
        </div>
      </div>
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 blur-[40px] opacity-20 ${bg.replace('/10', '')}`} />
    </div>
  )
}
