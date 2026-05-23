import { useState } from 'react'
import {
  User,
  Users,
  Shield,
  CreditCard,
  Blocks,
  Bell,
  Save,
  Building,
  Mail,
  Key,
  Globe,
  Plus,
  Check,
  AlertCircle,
} from 'lucide-react'
import { useDocumentMeta } from '@/components/SEO'

/**
 * Story 7.3 (AC 5): Platform Settings dashboard page mounted at
 * `/dashboard/settings`.
 *
 * Source: Figma Make file `66Wb2MAv5PLOBSJLoFM3E3`,
 * `src/app/pages/Settings.tsx`. Ported verbatim via the Figma MCP
 * `ReadMcpResourceTool` with the following intentional, story-scoped
 * deltas:
 *
 *   - Dropped the redundant `import React from 'react'` default — React 18
 *     + Vite's new JSX transform makes it unnecessary (Story 7.3 dev-note
 *     3); only the named `useState` import is retained.
 *   - Single-file layout preserved per Figma source convention (Story 7.3
 *     dev-note Task 5 explicitly accepts this): the top-level `Settings`
 *     component co-locates the 6 sub-components (`GeneralSettings`,
 *     `TeamSettings`, `SecuritySettings`, `BillingSettings`,
 *     `IntegrationsSettings`, `NotificationSettings`) in this file rather
 *     than splitting into `src/pages/dashboard/settings/*.tsx`. Single-file
 *     keeps the diff-able 1:1 mapping against the Figma source.
 *   - `defaultValue` / `defaultChecked` uncontrolled inputs retained as-is.
 *     The Figma source ships them without a paired `value`/`checked` prop
 *     so they are legitimate uncontrolled inputs (no controlled/uncontrolled
 *     conflict). The custom eslint rule `t-requires-default-value` only
 *     targets `t('key')` calls, not `defaultValue` on `<input>`; the rule
 *     referenced in story dev-note 4 does not exist in this repo today
 *     (verified `eslint-rules/` listing on 2026-05-22). Leaving them
 *     uncontrolled preserves the Figma demo behaviour; Story 7.6 / future
 *     real-data wiring will revisit.
 *   - Added `type="button"` to every non-submit `<button>` and `htmlFor`
 *     pairings on the explicit `<label>`s so the page passes a baseline
 *     a11y audit before Story 7.8.
 *   - Replaced the Figma source's HTML-entity-style apostrophe escapes
 *     (`day\\'s`) with plain `'` inside double-quoted strings (functionally
 *     identical, more idiomatic in TSX).
 *
 * Mock data (`team`, `integrations`, the `notifications` list) retains the
 * Figma vocabulary (Alex Rivera, "Acme Financial Corp", "Stripe", etc.).
 * Story 7.6 owns the brand-copy + domain vocabulary rewrite.
 */

type TabId = 'general' | 'team' | 'security' | 'billing' | 'integrations' | 'notifications'

type SettingsTab = {
  id: TabId
  label: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
}

// Typed as `any` for the icon component because lucide-react's typed
// export shape varies per package version; this avoids dragging the
// version-specific `LucideIcon` import into this file's call-sites.
const SETTINGS_TABS: ReadonlyArray<SettingsTab> = [
  { id: 'general', label: 'General Profile', icon: User },
  { id: 'team', label: 'Team Members', icon: Users },
  { id: 'security', label: 'Security & API', icon: Shield },
  { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
  { id: 'integrations', label: 'Integrations', icon: Blocks },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

export default function Settings() {
  useDocumentMeta({
    titleKey: 'seo.dashboard.settings.title',
    descriptionKey: 'seo.dashboard.settings.description',
    ogTitleKey: 'seo.dashboard.settings.ogTitle',
    ogDescriptionKey: 'seo.dashboard.settings.ogDescription',
    path: '/dashboard/settings',
  })

  const [activeTab, setActiveTab] = useState<TabId>('general')
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = () => {
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  return (
    <div
      className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12"
      data-testid="dashboard-settings"
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Settings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your organization's preferences, billing, and team access.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            data-testid="dashboard-settings-save"
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
              isSaved
                ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" />
                Saved Successfully
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Settings Navigation */}
        <div
          className="w-full lg:w-64 shrink-0 space-y-1"
          data-testid="dashboard-settings-tabs"
        >
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                data-testid={`dashboard-settings-tab-${tab.id}`}
                aria-pressed={isActive}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                  isActive
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 min-w-0" data-testid="dashboard-settings-content">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'team' && <TeamSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'billing' && <BillingSettings />}
          {activeTab === 'integrations' && <IntegrationsSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components — one per Settings tab (single-file pattern per Figma)
// ---------------------------------------------------------------------------

function GeneralSettings() {
  return (
    <div className="space-y-6">
      <div className="bg-[#12121A] border border-white/5 rounded-2xl p-6 md:p-8">
        <h2 className="text-lg font-bold text-white mb-6">Organization Profile</h2>

        <div className="space-y-6 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="settings-company-name" className="text-sm font-medium text-slate-300 block">
                Company Name
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="settings-company-name"
                  type="text"
                  defaultValue="Acme Financial Corp"
                  className="w-full pl-9 pr-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="settings-support-email" className="text-sm font-medium text-slate-300 block">
                Support Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="settings-support-email"
                  type="email"
                  defaultValue="support@acmefinancial.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="settings-currency" className="text-sm font-medium text-slate-300 block">
                Base Currency
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  id="settings-currency"
                  defaultValue="usd"
                  className="w-full pl-9 pr-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-lg text-sm text-white appearance-none focus:outline-none focus:border-blue-500/50 transition-colors"
                >
                  <option value="usd">USD - US Dollar</option>
                  <option value="eur">EUR - Euro</option>
                  <option value="gbp">GBP - British Pound</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="settings-timezone" className="text-sm font-medium text-slate-300 block">
                Timezone
              </label>
              <select
                id="settings-timezone"
                defaultValue="est"
                className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-lg text-sm text-white appearance-none focus:outline-none focus:border-blue-500/50 transition-colors"
              >
                <option value="est">Eastern Time (ET)</option>
                <option value="pst">Pacific Time (PT)</option>
                <option value="gmt">Greenwich Mean Time (GMT)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#12121A] border border-rose-500/20 rounded-2xl p-6 md:p-8">
        <h2 className="text-lg font-bold text-rose-400 mb-2">Danger Zone</h2>
        <p className="text-sm text-slate-400 mb-6">
          Permanently remove your organization and all associated data.
        </p>
        <button
          type="button"
          className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-sm font-medium transition-colors"
        >
          Delete Organization
        </button>
      </div>
    </div>
  )
}

function TeamSettings() {
  const team = [
    { name: 'Alex Rivera', role: 'Owner', email: 'alex@acme.com', status: 'Active' },
    { name: 'Morgan Smith', role: 'Admin', email: 'morgan@acme.com', status: 'Active' },
    { name: 'Taylor Doe', role: 'Analyst', email: 'taylor@acme.com', status: 'Invited' },
  ]

  return (
    <div className="bg-[#12121A] border border-white/5 rounded-2xl flex flex-col">
      <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Team Members</h2>
          <p className="text-sm text-slate-400">Manage who has access to your workspace.</p>
        </div>
        <button
          type="button"
          className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Invite Member
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-sm text-slate-400 bg-white/[0.01]">
              <th className="px-6 py-4 font-medium">User</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {team.map((member) => (
              <tr key={member.email} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-6 py-4">
                  <div className="font-medium text-white">{member.name}</div>
                  <div className="text-slate-500 text-xs">{member.email}</div>
                </td>
                <td className="px-6 py-4 text-slate-300">{member.role}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      member.status === 'Active'
                        ? 'bg-green-400/10 text-green-400'
                        : 'bg-amber-400/10 text-amber-400'
                    }`}
                  >
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    className="text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SecuritySettings() {
  const [apiKeyVisible, setApiKeyVisible] = useState(false)
  const maskedApiKey = 'sk_live_[demo-key-hidden]'

  return (
    <div className="space-y-6">
      <div className="bg-[#12121A] border border-white/5 rounded-2xl p-6 md:p-8">
        <h2 className="text-lg font-bold text-white mb-6">Authentication</h2>

        <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] mb-4">
          <div>
            <div className="font-medium text-white mb-1">Two-Factor Authentication (2FA)</div>
            <div className="text-sm text-slate-400">Add an extra layer of security to your account.</div>
          </div>
          <button
            type="button"
            className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          >
            Enable
          </button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
          <div>
            <div className="font-medium text-white mb-1">Password</div>
            <div className="text-sm text-slate-400">Last changed 3 months ago.</div>
          </div>
          <button
            type="button"
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors border border-white/10"
          >
            Update
          </button>
        </div>
      </div>

      <div className="bg-[#12121A] border border-white/5 rounded-2xl p-6 md:p-8">
        <h2 className="text-lg font-bold text-white mb-6">API Keys</h2>
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-6">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>
            Your API keys carry full access to your organization's data. Keep them secure and never share them
            publicly.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <div className="font-medium text-white flex items-center gap-2">
                Production Key{' '}
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-slate-300 uppercase tracking-wider">
                  Live
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">Created May 12, 2026</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-black/50 border border-white/10 rounded font-mono text-sm text-slate-400">
                {apiKeyVisible ? maskedApiKey : 'sk_live_••••••••••••••••'}
              </div>
              <button
                type="button"
                aria-label={apiKeyVisible ? 'Hide API key placeholder' : 'Reveal API key placeholder'}
                aria-pressed={apiKeyVisible}
                onClick={() => setApiKeyVisible((visible) => !visible)}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors inline-flex items-center gap-2"
              >
                <Key className="w-4 h-4" />
                {apiKeyVisible ? 'Hide' : 'Reveal'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BillingSettings() {
  return (
    <div className="bg-[#12121A] border border-white/5 rounded-2xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-lg font-bold text-white">Current Plan</h2>
          <p className="text-sm text-slate-400">You are currently on the Enterprise tier.</p>
        </div>
        <span className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/20 rounded-full text-sm font-bold tracking-wide">
          ENTERPRISE
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="text-sm text-slate-400 mb-1">Monthly Cost</div>
          <div className="text-2xl font-bold text-white">$1,499</div>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="text-sm text-slate-400 mb-1">Next Billing Date</div>
          <div className="text-2xl font-bold text-white">Jun 1, 2026</div>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="text-sm text-slate-400 mb-1">API Requests</div>
          <div className="text-2xl font-bold text-white">
            1.2M <span className="text-sm font-normal text-slate-500">/ 5M</span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 pt-8">
        <h3 className="font-bold text-white mb-4">Payment Method</h3>
        <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-8 bg-slate-800 rounded border border-white/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <div className="font-medium text-white">Visa ending in 4242</div>
              <div className="text-sm text-slate-400">Expires 12/28</div>
            </div>
          </div>
          <button
            type="button"
            className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  )
}

function IntegrationsSettings() {
  const [integrations, setIntegrations] = useState([
    { name: 'Stripe', desc: 'Sync payments and invoices automatically.', connected: true },
    { name: 'Salesforce', desc: 'Import CRM deals and commission structures.', connected: true },
    { name: 'HubSpot', desc: 'Sync contacts and agency data.', connected: false },
    { name: 'NetSuite', desc: 'Enterprise ERP syncing for ledger entries.', connected: false },
  ])

  const toggleIntegration = (name: string) => {
    setIntegrations((current) =>
      current.map((app) => (app.name === name ? { ...app, connected: !app.connected } : app)),
    )
  }

  return (
    <div className="bg-[#12121A] border border-white/5 rounded-2xl p-6 md:p-8">
      <h2 className="text-lg font-bold text-white mb-6">Connected Apps</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((app) => (
          <div
            key={app.name}
            data-testid={`dashboard-settings-integration-${app.name.toLowerCase()}`}
            className="p-5 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col justify-between"
          >
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-white">{app.name}</div>
                {app.connected && (
                  <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3" /> Connected
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400">{app.desc}</p>
            </div>
            <button
              type="button"
              aria-pressed={app.connected}
              onClick={() => toggleIntegration(app.name)}
              className={`w-full py-2 rounded-lg text-sm font-medium transition-colors border ${
                app.connected
                  ? 'bg-white/5 text-white border-white/10 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20'
                  : 'bg-blue-500 text-white border-transparent hover:bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
              }`}
            >
              {app.connected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function NotificationSettings() {
  const items = [
    { title: 'Payout Approvals', desc: 'Get notified when a payout cycle requires manual approval.' },
    { title: 'Commission Anomalies', desc: 'Alerts for unexpected spikes or drops in commission calculations.' },
    { title: 'Daily Digest', desc: "A summary of the day's processed transactions and errors." },
    { title: 'New Integrations', desc: 'Updates when new partner apps are available.' },
  ]

  return (
    <div className="bg-[#12121A] border border-white/5 rounded-2xl p-6 md:p-8">
      <h2 className="text-lg font-bold text-white mb-6">Notification Preferences</h2>

      <div className="space-y-6">
        {items.map((item, idx) => (
          <div key={item.title} className="flex items-start justify-between">
            <div className="pr-8">
              <div className="font-medium text-white mb-1">{item.title}</div>
              <div className="text-sm text-slate-400">{item.desc}</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <span className="sr-only">Toggle {item.title}</span>
              <input
                type="checkbox"
                className="sr-only peer"
                defaultChecked={idx < 2}
              />
              <span className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0)_inset] peer-checked:shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}
