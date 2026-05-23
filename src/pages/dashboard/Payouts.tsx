import { useState } from 'react'
import {
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Filter,
  Download,
  Play,
  MoreHorizontal,
  Landmark,
  Wallet,
} from 'lucide-react'
import { useDocumentMeta } from '@/components/SEO'

/**
 * Story 7.3 (AC 3): Agent Payouts dashboard page mounted at
 * `/dashboard/payouts`.
 *
 * Source: Figma Make file `66Wb2MAv5PLOBSJLoFM3E3`,
 * `src/app/pages/Payouts.tsx`. Ported verbatim via the Figma MCP
 * `ReadMcpResourceTool` with the following intentional, story-scoped
 * deltas:
 *
 *   - Dropped the redundant `import React from 'react'` default — React 18
 *     + Vite's new JSX transform makes it unnecessary (Story 7.3 dev-note
 *     3); only the named `useState` import is retained.
 *   - Added the local `useDocumentMeta` SEO hook continuing the Story 7.2
 *     placeholder pattern.
 *   - Added explicit `type="button"` to every non-submit `<button>` and
 *     accessible labels for icon-only controls (filter, row actions, search
 *     input) — same baseline hardening as `RevenueRecovery.tsx`.
 *
 * Mock data (`METRICS`, `PAYOUTS`) retains the Figma vocabulary (agent
 * names, "SyncPay", "ACH Transfer", etc.); Story 7.6 owns the brand-copy +
 * domain vocabulary rewrite. The 5-tab filter pattern + status pill +
 * initials avatar are 1:1 ports from the Figma source — including the
 * inline gradient-corner glow that distinguishes each metric card on
 * hover.
 */

// TODO(epic-7-story-6): rewrite copy + sample data to the travel-commission
// domain; wire to real data in a later epic.
const METRICS = [
  { label: 'Total Processed (MTD)', value: '$142,300.00', trend: '+8.4%', isPositive: true as boolean | null },
  { label: 'Pending Payouts', value: '$24,500.00', trend: '12 agents queued', isPositive: null as boolean | null },
  { label: 'Failed Transactions', value: '$0.00', trend: '0 issues detected', isPositive: true as boolean | null },
]

const PAYOUTS = [
  { id: '1', agent: 'Sarah Jenkins', role: 'Senior Partner', amount: 4500, date: 'May 22, 2026', method: 'ACH Transfer', status: 'Completed' },
  { id: '2', agent: 'Michael Chen', role: 'Associate', amount: 2100, date: 'May 22, 2026', method: 'Direct Deposit', status: 'Completed' },
  { id: '3', agent: 'Emma Thompson', role: 'Managing Director', amount: 8400, date: 'May 23, 2026', method: 'Wire Transfer', status: 'Processing' },
  { id: '4', agent: 'David Rodriguez', role: 'Associate', amount: 1850, date: 'May 23, 2026', method: 'Direct Deposit', status: 'Processing' },
  { id: '5', agent: 'Jessica Davis', role: 'Senior Partner', amount: 5200, date: 'May 24, 2026', method: 'ACH Transfer', status: 'Scheduled' },
  { id: '6', agent: 'James Wilson', role: 'Associate', amount: 1900, date: 'May 18, 2026', method: 'Direct Deposit', status: 'Failed' },
  { id: '7', agent: 'Amanda Martinez', role: 'Partner', amount: 3600, date: 'May 15, 2026', method: 'ACH Transfer', status: 'Completed' },
]

const TABS = ['All Payouts', 'Processing', 'Scheduled', 'Completed', 'Failed']

export default function Payouts() {
  useDocumentMeta({
    titleKey: 'seo.dashboard.payouts.title',
    descriptionKey: 'seo.dashboard.payouts.description',
    ogTitleKey: 'seo.dashboard.payouts.ogTitle',
    ogDescriptionKey: 'seo.dashboard.payouts.ogDescription',
    path: '/dashboard/payouts',
  })

  const [activeTab, setActiveTab] = useState<string>('All Payouts')
  const [searchQuery, setSearchQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')

  const filteredData = PAYOUTS.filter((item) => {
    const matchesTab = activeTab === 'All Payouts' || item.status === activeTab
    const normalizedQuery = appliedQuery.trim().toLowerCase()
    const matchesQuery =
      normalizedQuery.length === 0 ||
      [item.agent, item.role, item.method, item.status, item.date].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      )

    return matchesTab && matchesQuery
  })

  return (
    <div
      className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500"
      data-testid="dashboard-payouts"
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Agent Payouts</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage and automate commission distributions via SyncPay.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-4 py-2 bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          >
            <Play className="w-4 h-4 fill-current" />
            Run Payout Cycle
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {METRICS.map((metric, idx) => (
          <div
            key={metric.label}
            className="bg-[#12121A] border border-white/5 rounded-2xl p-6 relative overflow-hidden group"
          >
            <div
              className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent ${
                idx === 0 ? 'to-blue-500/10' : idx === 1 ? 'to-amber-500/10' : 'to-green-500/10'
              } rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`}
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-slate-400">{metric.label}</p>
                <Wallet
                  className={`w-5 h-5 ${
                    idx === 0 ? 'text-blue-400' : idx === 1 ? 'text-amber-400' : 'text-green-400'
                  }`}
                />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{metric.value}</h2>
              <div className="flex items-center text-sm font-medium">
                {metric.isPositive === true && <ArrowUpRight className="w-4 h-4 text-green-400 mr-1" />}
                {metric.isPositive === false && <ArrowDownRight className="w-4 h-4 text-rose-400 mr-1" />}
                <span
                  className={
                    metric.isPositive === true
                      ? 'text-green-400'
                      : metric.isPositive === false
                      ? 'text-rose-400'
                      : 'text-slate-500'
                  }
                >
                  {metric.trend}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-[#12121A] border border-white/5 rounded-2xl flex flex-col">
        {/* Table Header & Controls */}
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div
            className="flex items-center gap-1 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar"
            data-testid="dashboard-payouts-tabs"
          >
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                data-testid={`dashboard-payouts-tab-${tab.replace(/\s+/g, '-').toLowerCase()}`}
                aria-pressed={activeTab === tab}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab}
                {tab === 'Processing' && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[10px]">
                    2
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <label htmlFor="dashboard-payouts-search" className="sr-only">
                Search agents
              </label>
              <input
                id="dashboard-payouts-search"
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    setAppliedQuery(searchQuery)
                  }
                }}
                placeholder="Search agents..."
                className="pl-9 pr-4 py-2 bg-white/[0.02] border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 w-full sm:w-64 transition-colors"
              />
            </div>
            <button
              type="button"
              aria-label="Filter results"
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
              <tr className="border-b border-white/5 text-sm text-slate-400 bg-white/[0.01]">
                <th className="px-6 py-4 font-medium">Agent</th>
                <th className="px-6 py-4 font-medium">Payout Date</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Method</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm" data-testid="dashboard-payouts-tbody">
              {filteredData.map((row) => (
                <tr
                  key={row.id}
                  data-testid="dashboard-payouts-row"
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        aria-hidden="true"
                        className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs"
                      >
                        {row.agent
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <div className="font-medium text-white">{row.agent}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{row.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{row.date}</td>
                  <td className="px-6 py-4 text-white font-medium">${row.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <Landmark className="w-4 h-4 opacity-50" />
                      {row.method}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        row.status === 'Completed'
                          ? 'bg-green-400/10 text-green-400 border-green-400/20'
                          : row.status === 'Processing'
                          ? 'bg-blue-400/10 text-blue-400 border-blue-400/20'
                          : row.status === 'Scheduled'
                          ? 'bg-slate-400/10 text-slate-300 border-slate-400/20'
                          : 'bg-rose-400/10 text-rose-400 border-rose-400/20'
                      }`}
                    >
                      {row.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                      {row.status === 'Processing' && <Clock className="w-3 h-3 animate-pulse" />}
                      {row.status === 'Scheduled' && <Clock className="w-3 h-3" />}
                      {row.status === 'Failed' && <XCircle className="w-3 h-3" />}
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      aria-label="Open row actions"
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No payouts found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination / Footer */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between text-sm text-slate-400">
          <p>
            Showing {filteredData.length} of {PAYOUTS.length} results
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 hover:bg-white/5 rounded-md transition-colors disabled:opacity-50"
              disabled
            >
              Previous
            </button>
            <button
              type="button"
              className="px-3 py-1.5 hover:bg-white/5 rounded-md transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
              disabled
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
