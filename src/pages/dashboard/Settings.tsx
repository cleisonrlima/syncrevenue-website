import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  labelKey: string
  labelFallback: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
}

// Typed as `any` for the icon component because lucide-react's typed
// export shape varies per package version; this avoids dragging the
// version-specific `LucideIcon` import into this file's call-sites.
// Story 7.5: `labelKey` + `labelFallback` decouple the tab identity from
// the rendered i18n string.
const SETTINGS_TABS: ReadonlyArray<SettingsTab> = [
  { id: 'general', labelKey: 'dashboard.settings.tabs.general', labelFallback: 'General Profile', icon: User },
  { id: 'team', labelKey: 'dashboard.settings.tabs.team', labelFallback: 'Team Members', icon: Users },
  { id: 'security', labelKey: 'dashboard.settings.tabs.security', labelFallback: 'Security & API', icon: Shield },
  { id: 'billing', labelKey: 'dashboard.settings.tabs.billing', labelFallback: 'Billing & Plans', icon: CreditCard },
  { id: 'integrations', labelKey: 'dashboard.settings.tabs.integrations', labelFallback: 'Integrations', icon: Blocks },
  { id: 'notifications', labelKey: 'dashboard.settings.tabs.notifications', labelFallback: 'Notifications', icon: Bell },
]

export default function Settings() {
  const { t } = useTranslation()

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
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {t('dashboard.settings.title', 'Platform Settings')}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {t(
              'dashboard.settings.subtitle',
              "Manage your organization's preferences, billing, and team access.",
            )}
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
                {t('dashboard.settings.saved', 'Saved Successfully')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t('dashboard.settings.save', 'Save Changes')}
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
                {t(tab.labelKey, tab.labelFallback)}
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
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <div className="bg-[#12121A] border border-white/5 rounded-2xl p-6 md:p-8">
        <h2 className="text-lg font-bold text-white mb-6">
          {t('dashboard.settings.general.heading', 'Organization Profile')}
        </h2>

        <div className="space-y-6 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="settings-company-name" className="text-sm font-medium text-slate-300 block">
                {t('dashboard.settings.general.companyName', 'Company Name')}
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="settings-company-name"
                  type="text"
                  defaultValue="Meridian Travel Agency"
                  className="w-full pl-9 pr-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="settings-support-email" className="text-sm font-medium text-slate-300 block">
                {t('dashboard.settings.general.supportEmail', 'Support Email')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="settings-support-email"
                  type="email"
                  defaultValue="support@meridiantravel.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="settings-currency" className="text-sm font-medium text-slate-300 block">
                {t('dashboard.settings.general.baseCurrency', 'Base Currency')}
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  id="settings-currency"
                  defaultValue="brl"
                  className="w-full pl-9 pr-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-lg text-sm text-white appearance-none focus:outline-none focus:border-blue-500/50 transition-colors"
                >
                  <option value="brl">{t('dashboard.settings.general.currencyOptions.brl', 'BRL — Brazilian Real')}</option>
                  <option value="eur">{t('dashboard.settings.general.currencyOptions.eur', 'EUR — Euro')}</option>
                  <option value="usd">{t('dashboard.settings.general.currencyOptions.usd', 'USD — US Dollar')}</option>
                  <option value="gbp">{t('dashboard.settings.general.currencyOptions.gbp', 'GBP — British Pound')}</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="settings-timezone" className="text-sm font-medium text-slate-300 block">
                {t('dashboard.settings.general.timezone', 'Timezone')}
              </label>
              <select
                id="settings-timezone"
                defaultValue="saopaulo"
                className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-lg text-sm text-white appearance-none focus:outline-none focus:border-blue-500/50 transition-colors"
              >
                <option value="saopaulo">{t('dashboard.settings.general.timezoneOptions.saopaulo', 'America/Sao_Paulo (BRT)')}</option>
                <option value="newyork">{t('dashboard.settings.general.timezoneOptions.newyork', 'America/New_York (ET)')}</option>
                <option value="london">{t('dashboard.settings.general.timezoneOptions.london', 'Europe/London (GMT/BST)')}</option>
                <option value="est">{t('dashboard.settings.general.timezoneOptions.est', 'Eastern Time (ET)')}</option>
                <option value="pst">{t('dashboard.settings.general.timezoneOptions.pst', 'Pacific Time (PT)')}</option>
                <option value="gmt">{t('dashboard.settings.general.timezoneOptions.gmt', 'Greenwich Mean Time (GMT)')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#12121A] border border-rose-500/20 rounded-2xl p-6 md:p-8">
        <h2 className="text-lg font-bold text-rose-400 mb-2">
          {t('dashboard.settings.general.dangerZone', 'Danger Zone')}
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          {t(
            'dashboard.settings.general.dangerZoneBody',
            'Permanently remove your organization and all associated data.',
          )}
        </p>
        <button
          type="button"
          className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-sm font-medium transition-colors"
        >
          {t('dashboard.settings.general.deleteOrg', 'Delete Organization')}
        </button>
      </div>
    </div>
  )
}

function TeamSettings() {
  const { t } = useTranslation()
  // Status key stays English-keyed for conditional pill styling (Story 7.6
  // owns the redesign). Pill label is resolved via `dashboard.status.*`.
  const team = [
    { name: 'Alex Rivera', role: 'Owner', email: 'alex@acme.com', status: 'Active' },
    { name: 'Morgan Smith', role: 'Admin', email: 'morgan@acme.com', status: 'Active' },
    { name: 'Taylor Doe', role: 'Analyst', email: 'taylor@acme.com', status: 'Invited' },
  ]

  return (
    <div className="bg-[#12121A] border border-white/5 rounded-2xl flex flex-col">
      <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">
            {t('dashboard.settings.team.heading', 'Team Members')}
          </h2>
          <p className="text-sm text-slate-400">
            {t('dashboard.settings.team.subheading', 'Manage who has access to your workspace.')}
          </p>
        </div>
        <button
          type="button"
          className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('dashboard.settings.team.invite', 'Invite Member')}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-sm text-slate-400 bg-white/[0.01]">
              <th className="px-6 py-4 font-medium">{t('dashboard.settings.team.table.user', 'User')}</th>
              <th className="px-6 py-4 font-medium">{t('dashboard.settings.team.table.role', 'Role')}</th>
              <th className="px-6 py-4 font-medium">{t('dashboard.settings.team.table.status', 'Status')}</th>
              <th className="px-6 py-4 font-medium text-right">{t('dashboard.settings.team.table.actions', 'Actions')}</th>
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
                    {t(`dashboard.status.${member.status === 'Active' ? 'active' : 'invited'}`, member.status)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    className="text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    {t('dashboard.settings.team.edit', 'Edit')}
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
  const { t } = useTranslation()
  const [apiKeyVisible, setApiKeyVisible] = useState(false)
  const maskedApiKey = 'sk_live_[demo-key-hidden]'

  return (
    <div className="space-y-6">
      <div className="bg-[#12121A] border border-white/5 rounded-2xl p-6 md:p-8">
        <h2 className="text-lg font-bold text-white mb-6">
          {t('dashboard.settings.security.heading', 'Authentication')}
        </h2>

        <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] mb-4">
          <div>
            <div className="font-medium text-white mb-1">
              {t('dashboard.settings.security.twoFactor', 'Two-Factor Authentication (2FA)')}
            </div>
            <div className="text-sm text-slate-400">
              {t('dashboard.settings.security.twoFactorBody', 'Add an extra layer of security to your account.')}
            </div>
          </div>
          <button
            type="button"
            className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          >
            {t('dashboard.settings.security.enable', 'Enable')}
          </button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
          <div>
            <div className="font-medium text-white mb-1">
              {t('dashboard.settings.security.password', 'Password')}
            </div>
            <div className="text-sm text-slate-400">
              {t('dashboard.settings.security.passwordBody', 'Last changed 3 months ago.')}
            </div>
          </div>
          <button
            type="button"
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors border border-white/10"
          >
            {t('dashboard.settings.security.update', 'Update')}
          </button>
        </div>
      </div>

      <div className="bg-[#12121A] border border-white/5 rounded-2xl p-6 md:p-8">
        <h2 className="text-lg font-bold text-white mb-6">
          {t('dashboard.settings.security.apiKeys', 'API Keys')}
        </h2>
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-6">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>
            {t(
              'dashboard.settings.security.apiKeysNotice',
              "Your API keys carry full access to your organization's data. Keep them secure and never share them publicly.",
            )}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <div className="font-medium text-white flex items-center gap-2">
                {t('dashboard.settings.security.productionKey', 'Production Key')}{' '}
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-slate-300 uppercase tracking-wider">
                  {t('dashboard.settings.security.live', 'Live')}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {t('dashboard.settings.security.createdLabel', 'Created May 12, 2026')}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-black/50 border border-white/10 rounded font-mono text-sm text-slate-400">
                {apiKeyVisible ? maskedApiKey : 'sk_live_••••••••••••••••'}
              </div>
              <button
                type="button"
                aria-label={apiKeyVisible
                  ? t('dashboard.settings.security.hideAriaLabel', 'Hide API key placeholder')
                  : t('dashboard.settings.security.revealAriaLabel', 'Reveal API key placeholder')}
                aria-pressed={apiKeyVisible}
                onClick={() => setApiKeyVisible((visible) => !visible)}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors inline-flex items-center gap-2"
              >
                <Key className="w-4 h-4" />
                {apiKeyVisible
                  ? t('dashboard.settings.security.hide', 'Hide')
                  : t('dashboard.settings.security.reveal', 'Reveal')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BillingSettings() {
  const { t } = useTranslation()
  return (
    <div className="bg-[#12121A] border border-white/5 rounded-2xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-lg font-bold text-white">
            {t('dashboard.settings.billing.currentPlan', 'Current Plan')}
          </h2>
          <p className="text-sm text-slate-400">
            {t('dashboard.settings.billing.subheading', 'You are currently on the Enterprise tier.')}
          </p>
        </div>
        <span className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/20 rounded-full text-sm font-bold tracking-wide">
          {t('dashboard.settings.billing.tier', 'ENTERPRISE')}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="text-sm text-slate-400 mb-1">
            {t('dashboard.settings.billing.monthlyCost', 'Monthly Cost')}
          </div>
          <div className="text-2xl font-bold text-white">$1,499</div>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="text-sm text-slate-400 mb-1">
            {t('dashboard.settings.billing.nextBilling', 'Next Billing Date')}
          </div>
          <div className="text-2xl font-bold text-white">Jun 1, 2026</div>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="text-sm text-slate-400 mb-1">
            {t('dashboard.settings.billing.apiRequests', 'API Requests')}
          </div>
          <div className="text-2xl font-bold text-white">
            1.2M <span className="text-sm font-normal text-slate-500">/ 5M</span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 pt-8">
        <h3 className="font-bold text-white mb-4">
          {t('dashboard.settings.billing.paymentMethod', 'Payment Method')}
        </h3>
        <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-8 bg-slate-800 rounded border border-white/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <div className="font-medium text-white">
                {t('dashboard.settings.billing.cardLabel', 'Visa ending in 4242')}
              </div>
              <div className="text-sm text-slate-400">
                {t('dashboard.settings.billing.cardExpires', 'Expires 12/28')}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            {t('dashboard.settings.billing.update', 'Update')}
          </button>
        </div>
      </div>
    </div>
  )
}

function IntegrationsSettings() {
  const { t } = useTranslation()
  // `descKey` resolves the integration's translated description; the brand
  // `name` field is left inline (brand names don't get translated until
  // Story 7.6 / Story 7.7 rewrite the source vocabulary). `descFallback`
  // is the dev-mode safety net for missing keys.
  const [integrations, setIntegrations] = useState([
    { name: 'Stripe', descKey: 'dashboard.settings.integrations.items.stripe', descFallback: 'Sync payments and invoices automatically.', connected: true },
    { name: 'Salesforce', descKey: 'dashboard.settings.integrations.items.salesforce', descFallback: 'Import CRM deals and commission structures.', connected: true },
    { name: 'HubSpot', descKey: 'dashboard.settings.integrations.items.hubspot', descFallback: 'Sync contacts and agency data.', connected: false },
    { name: 'NetSuite', descKey: 'dashboard.settings.integrations.items.netsuite', descFallback: 'Enterprise ERP syncing for ledger entries.', connected: false },
  ])

  const toggleIntegration = (name: string) => {
    setIntegrations((current) =>
      current.map((app) => (app.name === name ? { ...app, connected: !app.connected } : app)),
    )
  }

  return (
    <div className="bg-[#12121A] border border-white/5 rounded-2xl p-6 md:p-8">
      <h2 className="text-lg font-bold text-white mb-6">
        {t('dashboard.settings.integrations.heading', 'Connected Apps')}
      </h2>
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
                    <Check className="w-3 h-3" /> {t('dashboard.status.connected', 'Connected')}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400">{t(app.descKey, app.descFallback)}</p>
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
              {app.connected
                ? t('dashboard.settings.integrations.disconnect', 'Disconnect')
                : t('dashboard.settings.integrations.connect', 'Connect')}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function NotificationSettings() {
  const { t } = useTranslation()
  const items = [
    {
      id: 'payoutApprovals',
      titleKey: 'dashboard.settings.notifications.items.payoutApprovals.title',
      titleFallback: 'Payout Approvals',
      descKey: 'dashboard.settings.notifications.items.payoutApprovals.desc',
      descFallback: 'Get notified when a payout cycle requires manual approval.',
    },
    {
      id: 'commissionAnomalies',
      titleKey: 'dashboard.settings.notifications.items.commissionAnomalies.title',
      titleFallback: 'Commission Anomalies',
      descKey: 'dashboard.settings.notifications.items.commissionAnomalies.desc',
      descFallback: 'Alerts for unexpected spikes or drops in commission calculations.',
    },
    {
      id: 'dailyDigest',
      titleKey: 'dashboard.settings.notifications.items.dailyDigest.title',
      titleFallback: 'Daily Digest',
      descKey: 'dashboard.settings.notifications.items.dailyDigest.desc',
      descFallback: "A summary of the day's processed transactions and errors.",
    },
    {
      id: 'newIntegrations',
      titleKey: 'dashboard.settings.notifications.items.newIntegrations.title',
      titleFallback: 'New Integrations',
      descKey: 'dashboard.settings.notifications.items.newIntegrations.desc',
      descFallback: 'Updates when new partner apps are available.',
    },
  ]

  return (
    <div className="bg-[#12121A] border border-white/5 rounded-2xl p-6 md:p-8">
      <h2 className="text-lg font-bold text-white mb-6">
        {t('dashboard.settings.notifications.heading', 'Notification Preferences')}
      </h2>

      <div className="space-y-6">
        {items.map((item, idx) => {
          const title = t(item.titleKey, item.titleFallback)
          return (
            <div key={item.id} className="flex items-start justify-between">
              <div className="pr-8">
                <div className="font-medium text-white mb-1">{title}</div>
                <div className="text-sm text-slate-400">{t(item.descKey, item.descFallback)}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <span className="sr-only">
                  {t('dashboard.settings.notifications.toggleLabel', 'Toggle {{title}}', { title })}
                </span>
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked={idx < 2}
                />
                <span className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0)_inset] peer-checked:shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )
}
