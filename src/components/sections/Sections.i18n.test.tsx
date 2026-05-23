import { afterEach, describe, expect, it, vi, type Mock } from 'vitest'
import { act, render, screen, cleanup, waitFor } from '@testing-library/react'
import i18next from '@/i18n'
import enResources from '@/i18n/locales/en/translation.json'
import ptResources from '@/i18n/locales/pt-BR/translation.json'
import esResources from '@/i18n/locales/es/translation.json'
import SyncRevenue from './SyncRevenue'
import Services from './Services'
import Comparison from './Comparison'
import Team from './Team'
import Security from './Security'
import ClientReferences from './ClientReferences'
import { useLocaleStore } from '@/store/useLocaleStore'
import type { PublicTeamMemberRow } from '@/lib/api'

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return {
    ...actual,
    getPublicTeam: vi.fn(),
  }
})

const api = await import('@/lib/api')

const teamFixture: PublicTeamMemberRow[] = [
  {
    id: 1,
    name: 'Maria Silva',
    role_en: 'Airline Distribution & Commission Strategy Lead',
    role_pt: 'Liderança em Distribuição Aérea e Estratégia de Comissões',
    role_es: 'Liderazgo en Distribución Aérea y Estrategia de Comisiones',
    bio_en: 'Guides GDS operations, BSP/ARC reconciliation.',
    bio_pt: 'Orienta operações GDS, reconciliação BSP/ARC.',
    bio_es: 'Guía operaciones GDS, conciliación BSP/ARC.',
    experience_en: '20+ years in airline distribution',
    experience_pt: '20+ anos em distribuição aérea',
    experience_es: '20+ años en distribución aérea',
    linkedin: null,
    photo_url: null,
    order_index: 0,
    active: 1,
  },
]

describe('Section i18n', () => {
  afterEach(async () => {
    cleanup()
    await i18next.changeLanguage('en')
  })

  it('updates SyncRevenue copy when locale changes', async () => {
    const { rerender } = render(<SyncRevenue />)

    expect(screen.getByRole('heading', { name: 'Automated Commission Reconciliation' })).toBeInTheDocument()

    await act(async () => {
      await i18next.changeLanguage('pt-BR')
    })
    rerender(<SyncRevenue />)

    expect(screen.getByRole('heading', { name: 'Reconciliação Automatizada de Comissões' })).toBeInTheDocument()
    expect(screen.getByText(/99,99% de assertividade de comissões/)).toBeInTheDocument()
  })

  it('updates Services copy when locale changes', async () => {
    const { rerender } = render(<Services />)

    expect(screen.getByRole('heading', { name: 'Complete Revenue Intelligence Suite' })).toBeInTheDocument()

    await act(async () => {
      await i18next.changeLanguage('es')
    })
    rerender(<Services />)

    expect(screen.getByRole('heading', { name: 'Suite Completa de Inteligencia de Ingresos' })).toBeInTheDocument()
    expect(screen.getByText('¿No está seguro de qué servicio necesita? Contáctenos.')).toBeInTheDocument()
  })

  it('updates Comparison table copy when locale changes', async () => {
    const { rerender } = render(<Comparison />)

    expect(screen.getByRole('heading', { name: 'Stop Losing Revenue to Manual Processes' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'BSP/ARC Reconciliation' })).toBeInTheDocument()

    await act(async () => {
      await i18next.changeLanguage('pt-BR')
    })
    rerender(<Comparison />)

    expect(screen.getByRole('heading', { name: 'Pare de Perder Receita com Processos Manuais' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Reconciliação BSP/ARC' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Ferramentas Genéricas' })).toBeInTheDocument()
    expect(screen.getByText(/Não modelam fluxos de liquidação aérea/)).toBeInTheDocument()
  })

  it('updates Team member roles and bios when locale changes', async () => {
    ;(api.getPublicTeam as unknown as Mock).mockResolvedValue(teamFixture)
    useLocaleStore.setState({ locale: 'en' })
    const { rerender } = render(<Team />)

    // Story 6.7 reshaped this headline into accent-split form.
    expect(screen.getByRole('heading', { name: /Specialists in\s+airline distribution/i })).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByText('Airline Distribution & Commission Strategy Lead')).toBeInTheDocument()
    )

    await act(async () => {
      await i18next.changeLanguage('pt-BR')
      useLocaleStore.setState({ locale: 'pt-BR' })
    })
    rerender(<Team />)

    expect(screen.getByRole('heading', { name: /Especialistas em\s+distribuição aérea/i })).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByText('Liderança em Distribuição Aérea e Estratégia de Comissões')).toBeInTheDocument()
    )
    expect(screen.getByText(/operações GDS, reconciliação BSP\/ARC/)).toBeInTheDocument()
  })

  it('updates Security copy when locale changes', async () => {
    const { rerender } = render(<Security />)

    expect(screen.getByRole('heading', { name: 'Your Data is Protected' })).toBeInTheDocument()
    expect(screen.getByText(/GDS credentials never touch the website/)).toBeInTheDocument()

    await act(async () => {
      await i18next.changeLanguage('es')
    })
    rerender(<Security />)

    expect(screen.getByRole('heading', { name: 'Sus Datos Están Protegidos' })).toBeInTheDocument()
    expect(screen.getByText(/Las credenciales GDS nunca tocan el sitio web/)).toBeInTheDocument()
  })

  it('updates ClientReferences copy when locale changes', async () => {
    const { rerender } = render(<ClientReferences />)

    // Story 6.6 reshaped this headline into "Trusted by real <accent>agencies</accent>".
    expect(screen.getByRole('heading', { name: /Trusted by real\s+agencies/i })).toBeInTheDocument()
    expect(screen.getByText(/Named references are shared with approval/)).toBeInTheDocument()

    await act(async () => {
      await i18next.changeLanguage('pt-BR')
    })
    rerender(<ClientReferences />)

    expect(screen.getByRole('heading', { name: /Confiança comprovada por\s+agências reais/i })).toBeInTheDocument()
    expect(screen.getByText(/Referências nomeadas são compartilhadas com aprovação/)).toBeInTheDocument()
  })
})

// Story 6.9 — namespace parity for new `demo.*` / `contact.*` / `forms.encryptedNote` keys.
// Each locale must carry every leaf path; missing keys in any locale fail the build.

type Json = Record<string, unknown>

function collectLeafPaths(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return [prefix]
  }
  const out: string[] = []
  for (const [k, v] of Object.entries(obj as Json)) {
    const next = prefix ? `${prefix}.${k}` : k
    out.push(...collectLeafPaths(v, next))
  }
  return out
}

function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc !== null && typeof acc === 'object' && !Array.isArray(acc)) {
      return (acc as Json)[key]
    }
    return undefined
  }, obj)
}

function interpolationTokens(value: unknown): string[] {
  if (typeof value !== 'string') return []
  return Array.from(value.matchAll(/\{\{\s*([^,\s}]+)[^}]*\}\}/g), (match) => match[1]).sort()
}

const REQUIRED_DEMO_PATHS = [
  'demo.eyebrow',
  'demo.heading.text',
  'demo.heading.accent',
  'demo.subhead',
  'demo.info.h3',
  'demo.info.steps.0.title',
  'demo.info.steps.0.body',
  'demo.info.steps.1.title',
  'demo.info.steps.1.body',
  'demo.info.steps.2.title',
  'demo.info.steps.2.body',
  'demo.info.infoCard.title',
  'demo.info.infoCard.subtitle',
  'demo.sectionAriaLabel',
  'demo.form.heading',
  'demo.form.helper',
  'demo.form.fields.name.label',
  'demo.form.fields.name.placeholder',
  'demo.form.fields.email.label',
  'demo.form.fields.email.placeholder',
  'demo.form.fields.company.label',
  'demo.form.fields.company.placeholder',
  'demo.form.fields.phone.label',
  'demo.form.fields.phone.placeholder',
  'demo.form.fields.phone.optional',
  'demo.form.fields.role.label',
  'demo.form.fields.role.placeholder',
  'demo.form.fields.role.options.Owner',
  'demo.form.fields.role.options.Executive',
  'demo.form.fields.role.options.Operations',
  'demo.form.fields.role.options.Finance',
  'demo.form.fields.role.options.Technology',
  'demo.form.fields.role.options.Other',
  'demo.form.fields.gds.label',
  'demo.form.fields.gds.placeholder',
  'demo.form.fields.gds.options.Amadeus',
  'demo.form.fields.gds.options.Sabre',
  'demo.form.fields.gds.options.Travelport (Galileo/Worldspan)',
  'demo.form.fields.gds.options.Other',
  'demo.form.fields.message.label',
  'demo.form.fields.message.placeholder',
  'demo.form.fields.message.optional',
  'demo.form.submit',
  'demo.form.submitting',
  'demo.form.errors.name',
  'demo.form.errors.email',
  'demo.form.errors.company',
  'demo.form.errors.role',
  'demo.form.errors.gds',
  'demo.form.errors.rateLimit',
  'demo.form.errors.generic',
  'demo.form.success.title',
  'demo.form.success.body',
]

const REQUIRED_CONTACT_PATHS = [
  'contact.eyebrow',
  'contact.heading.text',
  'contact.heading.accent',
  'contact.subhead',
  'contact.channels.0.label',
  'contact.channels.0.value',
  'contact.channels.0.kind',
  'contact.channels.1.label',
  'contact.channels.1.value',
  'contact.channels.1.kind',
  'contact.channels.2.label',
  'contact.channels.2.value',
  'contact.channels.2.kind',
  'contact.infoCard.title',
  'contact.infoCard.subtitle',
  'contact.form.heading',
  'contact.form.helper',
  'contact.form.fields.name.label',
  'contact.form.fields.name.placeholder',
  'contact.form.fields.email.label',
  'contact.form.fields.email.placeholder',
  'contact.form.fields.subject.label',
  'contact.form.fields.subject.placeholder',
  'contact.form.fields.subject.options.commercial',
  'contact.form.fields.subject.options.support',
  'contact.form.fields.subject.options.partnerships',
  'contact.form.fields.subject.options.press',
  'contact.form.fields.subject.options.other',
  'contact.form.fields.message.label',
  'contact.form.fields.message.placeholder',
  'contact.form.submit',
  // Story 6.13 — new error / success / submitting leaves under contact.form.*
  'contact.form.submitting',
  'contact.form.errors.name',
  'contact.form.errors.email',
  'contact.form.errors.subject',
  'contact.form.errors.message',
  'contact.form.errors.rateLimit',
  'contact.form.errors.generic',
  'contact.form.success.title',
  'contact.form.success.body',
]

const REQUIRED_FORMS_PATHS = ['forms.encryptedNote']

const REQUIRED_PATHS = [...REQUIRED_DEMO_PATHS, ...REQUIRED_CONTACT_PATHS, ...REQUIRED_FORMS_PATHS]

const LOCALES = [
  ['en', enResources as unknown],
  ['pt-BR', ptResources as unknown],
  ['es', esResources as unknown],
] as const

describe('Story 6.9 — namespace parity for demo.*, contact.*, forms.encryptedNote', () => {
  it.each(LOCALES)('locale %s carries every required key as a non-empty string', (_locale, bundle) => {
    const missing: string[] = []
    const empty: string[] = []
    for (const path of REQUIRED_PATHS) {
      const value = getByPath(bundle, path)
      if (value === undefined) {
        missing.push(path)
      } else if (typeof value !== 'string' || value.trim() === '') {
        empty.push(path)
      }
    }
    expect(missing).toEqual([])
    expect(empty).toEqual([])
  })

  it('demo.* tree shape is identical across en/pt-BR/es (no extra keys per locale)', () => {
    const enPaths = collectLeafPaths((enResources as Json).demo, 'demo').sort()
    const ptPaths = collectLeafPaths((ptResources as Json).demo, 'demo').sort()
    const esPaths = collectLeafPaths((esResources as Json).demo, 'demo').sort()
    expect(ptPaths).toEqual(enPaths)
    expect(esPaths).toEqual(enPaths)
  })

  it('contact.* tree shape is identical across en/pt-BR/es', () => {
    const enPaths = collectLeafPaths((enResources as Json).contact, 'contact').sort()
    const ptPaths = collectLeafPaths((ptResources as Json).contact, 'contact').sort()
    const esPaths = collectLeafPaths((esResources as Json).contact, 'contact').sort()
    expect(ptPaths).toEqual(enPaths)
    expect(esPaths).toEqual(enPaths)
  })
})

// Story 7.5 — namespace parity for new `landing.*`, `figmaDemo.*`,
// `dashboard.*` trees. Mirrors the Story 6.9 pattern: explicit required
// leaf paths + full tree-shape equality so en/pt-BR/es never drift apart.

const REQUIRED_LANDING_PATHS = [
  'landing.nav.logoAlt',
  'landing.nav.brand',
  'landing.nav.products',
  'landing.nav.benefits',
  'landing.nav.security',
  'landing.nav.customers',
  'landing.nav.login',
  'landing.nav.bookDemo',
  'landing.nav.openMenu',
  'landing.nav.closeMenu',
  'landing.mobileMenu.ariaLabel',
  'landing.heroSlides.revenue.badge',
  'landing.heroSlides.revenue.title',
  'landing.heroSlides.revenue.titleHighlight',
  'landing.heroSlides.revenue.description',
  'landing.heroSlides.revenue.floatingTitle',
  'landing.heroSlides.revenue.floatingValue',
  'landing.heroSlides.pay.badge',
  'landing.heroSlides.pay.title',
  'landing.heroSlides.pay.titleHighlight',
  'landing.heroSlides.pay.description',
  'landing.heroSlides.pay.floatingTitle',
  'landing.heroSlides.pay.floatingValue',
  'landing.heroSlides.insights.badge',
  'landing.heroSlides.insights.title',
  'landing.heroSlides.insights.titleHighlight',
  'landing.heroSlides.insights.description',
  'landing.heroSlides.insights.floatingTitle',
  'landing.heroSlides.insights.floatingValue',
  'landing.hero.bgImageAlt',
  'landing.hero.explorePlatform',
  'landing.hero.exploreProduct',
  'landing.hero.requestDemo',
  'landing.hero.trustBadge1',
  'landing.hero.trustBadge2',
  'landing.hero.systemStatus',
  'landing.hero.liveSyncActive',
  'landing.trust.heading',
  'landing.benefits.heading',
  'landing.benefits.subheading',
  'landing.benefits.card1.title',
  'landing.benefits.card1.description',
  'landing.benefits.card2.title',
  'landing.benefits.card2.description',
  'landing.benefits.card3.title',
  'landing.benefits.card3.description',
  'landing.security.heading',
  'landing.security.subheading',
  'landing.security.soc2.title',
  'landing.security.soc2.sub',
  'landing.security.e2e.title',
  'landing.security.e2e.sub',
  'landing.security.rbac.title',
  'landing.security.rbac.sub',
  'landing.security.uptime.title',
  'landing.security.uptime.sub',
  'landing.cta.heading',
  'landing.cta.subheading',
  'landing.cta.button',
  'landing.footer.logoAlt',
  'landing.footer.brand',
  'landing.footer.privacy',
  'landing.footer.terms',
  'landing.footer.contact',
  'landing.footer.copyright',
]

const REQUIRED_FIGMA_DEMO_PATHS = [
  'figmaDemo.nav.logoAlt',
  'figmaDemo.nav.brand',
  'figmaDemo.nav.backToHome',
  'figmaDemo.hero.badge',
  'figmaDemo.hero.heading',
  'figmaDemo.hero.description',
  'figmaDemo.hero.bullet1',
  'figmaDemo.hero.bullet2',
  'figmaDemo.hero.bullet3',
  'figmaDemo.form.firstName',
  'figmaDemo.form.lastName',
  'figmaDemo.form.workEmail',
  'figmaDemo.form.companyName',
  'figmaDemo.form.phoneNumber',
  'figmaDemo.form.placeholders.firstName',
  'figmaDemo.form.placeholders.lastName',
  'figmaDemo.form.placeholders.email',
  'figmaDemo.form.placeholders.company',
  'figmaDemo.form.placeholders.phone',
  'figmaDemo.form.submit',
  'figmaDemo.form.disclaimer',
  'figmaDemo.success.heading',
  'figmaDemo.success.body',
  'figmaDemo.success.reset',
]

const REQUIRED_DASHBOARD_LAYOUT_PATHS = [
  'dashboard.layout.brand',
  'dashboard.layout.logoAlt',
  'dashboard.layout.searchLabel',
  'dashboard.layout.searchPlaceholder',
  'dashboard.layout.notificationsLabel',
  'dashboard.layout.importCta',
  'dashboard.layout.sidebarAriaLabel',
  'dashboard.layout.primaryNavAriaLabel',
  'dashboard.layout.mobileNavAriaLabel',
  'dashboard.layout.contentAriaLabel',
  'dashboard.nav.overview',
  'dashboard.nav.recovery',
  'dashboard.nav.payouts',
  'dashboard.nav.insights',
  'dashboard.nav.settings',
]

const REQUIRED_DASHBOARD_STATUS_PATHS = [
  'dashboard.status.pending',
  'dashboard.status.resolved',
  'dashboard.status.disputed',
  'dashboard.status.actionRequired',
  'dashboard.status.completed',
  'dashboard.status.processing',
  'dashboard.status.scheduled',
  'dashboard.status.failed',
  'dashboard.status.active',
  'dashboard.status.invited',
  'dashboard.status.connected',
  'dashboard.status.unknown',
  'dashboard.pagination.previous',
  'dashboard.pagination.next',
  'dashboard.rowActions.open',
  'dashboard.rowActions.openRecovery',
  'dashboard.rowActions.openPayout',
]

const REQUIRED_DASHBOARD_OVERVIEW_PATHS = [
  'dashboard.overview.title',
  'dashboard.overview.subtitle',
  'dashboard.overview.metrics.totalRecovered',
  'dashboard.overview.metrics.activeDiscrepancies',
  'dashboard.overview.metrics.payoutsProcessed',
  'dashboard.overview.chart.title',
  'dashboard.overview.chart.subtitle',
  'dashboard.overview.chart.timeRangeLabel',
  'dashboard.overview.chart.recoveredSeries',
  'dashboard.overview.chart.baselineSeries',
  'dashboard.overview.timeRanges.last7Months',
  'dashboard.overview.timeRanges.thisYear',
  'dashboard.overview.timeRanges.allTime',
  'dashboard.overview.recentDiscrepancies.title',
  'dashboard.overview.recentDiscrepancies.deltaLabel',
  'dashboard.overview.recentDiscrepancies.viewAll',
]

const REQUIRED_DASHBOARD_RECOVERY_PATHS = [
  'dashboard.recovery.title',
  'dashboard.recovery.subtitle',
  'dashboard.recovery.actions.exportReport',
  'dashboard.recovery.actions.newDispute',
  'dashboard.recovery.metrics.unrecovered',
  'dashboard.recovery.metrics.unrecoveredSub',
  'dashboard.recovery.metrics.inDispute',
  'dashboard.recovery.metrics.inDisputeSub',
  'dashboard.recovery.metrics.recoveredYtd',
  'dashboard.recovery.metrics.recoveredYtdSub',
  'dashboard.recovery.tabs.all',
  'dashboard.recovery.tabs.actionRequired',
  'dashboard.recovery.tabs.disputed',
  'dashboard.recovery.tabs.resolved',
  'dashboard.recovery.searchLabel',
  'dashboard.recovery.searchPlaceholder',
  'dashboard.recovery.filterLabel',
  'dashboard.recovery.table.carrier',
  'dashboard.recovery.table.client',
  'dashboard.recovery.table.expected',
  'dashboard.recovery.table.actual',
  'dashboard.recovery.table.delta',
  'dashboard.recovery.table.type',
  'dashboard.recovery.table.status',
  'dashboard.recovery.table.actions',
  'dashboard.recovery.emptyState',
  'dashboard.recovery.pagination.showing',
]

const REQUIRED_DASHBOARD_PAYOUTS_PATHS = [
  'dashboard.payouts.title',
  'dashboard.payouts.subtitle',
  'dashboard.payouts.actions.export',
  'dashboard.payouts.actions.runCycle',
  'dashboard.payouts.metrics.totalProcessed',
  'dashboard.payouts.metrics.pending',
  'dashboard.payouts.metrics.pendingSub',
  'dashboard.payouts.metrics.failed',
  'dashboard.payouts.metrics.failedSub',
  'dashboard.payouts.tabs.all',
  'dashboard.payouts.tabs.processing',
  'dashboard.payouts.tabs.scheduled',
  'dashboard.payouts.tabs.completed',
  'dashboard.payouts.tabs.failed',
  'dashboard.payouts.searchLabel',
  'dashboard.payouts.searchPlaceholder',
  'dashboard.payouts.filterLabel',
  'dashboard.payouts.table.agent',
  'dashboard.payouts.table.payoutDate',
  'dashboard.payouts.table.amount',
  'dashboard.payouts.table.method',
  'dashboard.payouts.table.status',
  'dashboard.payouts.table.actions',
  'dashboard.payouts.emptyState',
  'dashboard.payouts.pagination.showing',
]

const REQUIRED_DASHBOARD_INSIGHTS_PATHS = [
  'dashboard.insights.title',
  'dashboard.insights.subtitle',
  'dashboard.insights.calendarLabel',
  'dashboard.insights.actions.exportData',
  'dashboard.insights.metrics.globalRevenue',
  'dashboard.insights.metrics.forecastedEoy',
  'dashboard.insights.metrics.averageMargin',
  'dashboard.insights.metrics.activeTerritories',
  'dashboard.insights.metrics.activeTerritoriesTrend',
  'dashboard.insights.metrics.yoySuffix',
  'dashboard.insights.forecast.title',
  'dashboard.insights.forecast.subtitle',
  'dashboard.insights.forecast.legendActual',
  'dashboard.insights.forecast.legendForecast',
  'dashboard.insights.regional.title',
  'dashboard.insights.regional.subtitle',
  'dashboard.insights.regional.centerLabel',
  'dashboard.insights.regional.tooltipShare',
  'dashboard.insights.product.title',
  'dashboard.insights.product.subtitle',
  'dashboard.insights.product.tooltipVolume',
  'dashboard.insights.topAgencies.title',
  'dashboard.insights.topAgencies.subtitle',
]

const REQUIRED_DASHBOARD_SETTINGS_PATHS = [
  'dashboard.settings.title',
  'dashboard.settings.subtitle',
  'dashboard.settings.save',
  'dashboard.settings.saved',
  'dashboard.settings.tabs.general',
  'dashboard.settings.tabs.team',
  'dashboard.settings.tabs.security',
  'dashboard.settings.tabs.billing',
  'dashboard.settings.tabs.integrations',
  'dashboard.settings.tabs.notifications',
  'dashboard.settings.general.heading',
  'dashboard.settings.general.companyName',
  'dashboard.settings.general.supportEmail',
  'dashboard.settings.general.baseCurrency',
  'dashboard.settings.general.currencyOptions.usd',
  'dashboard.settings.general.currencyOptions.eur',
  'dashboard.settings.general.currencyOptions.gbp',
  'dashboard.settings.general.timezone',
  'dashboard.settings.general.timezoneOptions.est',
  'dashboard.settings.general.timezoneOptions.pst',
  'dashboard.settings.general.timezoneOptions.gmt',
  'dashboard.settings.general.dangerZone',
  'dashboard.settings.general.dangerZoneBody',
  'dashboard.settings.general.deleteOrg',
  'dashboard.settings.team.heading',
  'dashboard.settings.team.subheading',
  'dashboard.settings.team.invite',
  'dashboard.settings.team.table.user',
  'dashboard.settings.team.table.role',
  'dashboard.settings.team.table.status',
  'dashboard.settings.team.table.actions',
  'dashboard.settings.team.edit',
  'dashboard.settings.security.heading',
  'dashboard.settings.security.twoFactor',
  'dashboard.settings.security.twoFactorBody',
  'dashboard.settings.security.enable',
  'dashboard.settings.security.password',
  'dashboard.settings.security.passwordBody',
  'dashboard.settings.security.update',
  'dashboard.settings.security.apiKeys',
  'dashboard.settings.security.apiKeysNotice',
  'dashboard.settings.security.productionKey',
  'dashboard.settings.security.live',
  'dashboard.settings.security.createdLabel',
  'dashboard.settings.security.hide',
  'dashboard.settings.security.reveal',
  'dashboard.settings.security.hideAriaLabel',
  'dashboard.settings.security.revealAriaLabel',
  'dashboard.settings.billing.currentPlan',
  'dashboard.settings.billing.subheading',
  'dashboard.settings.billing.tier',
  'dashboard.settings.billing.monthlyCost',
  'dashboard.settings.billing.nextBilling',
  'dashboard.settings.billing.apiRequests',
  'dashboard.settings.billing.paymentMethod',
  'dashboard.settings.billing.cardLabel',
  'dashboard.settings.billing.cardExpires',
  'dashboard.settings.billing.update',
  'dashboard.settings.integrations.heading',
  'dashboard.settings.integrations.items.stripe',
  'dashboard.settings.integrations.items.salesforce',
  'dashboard.settings.integrations.items.hubspot',
  'dashboard.settings.integrations.items.netsuite',
  'dashboard.settings.integrations.connect',
  'dashboard.settings.integrations.disconnect',
  'dashboard.settings.notifications.heading',
  'dashboard.settings.notifications.items.payoutApprovals.title',
  'dashboard.settings.notifications.items.payoutApprovals.desc',
  'dashboard.settings.notifications.items.commissionAnomalies.title',
  'dashboard.settings.notifications.items.commissionAnomalies.desc',
  'dashboard.settings.notifications.items.dailyDigest.title',
  'dashboard.settings.notifications.items.dailyDigest.desc',
  'dashboard.settings.notifications.items.newIntegrations.title',
  'dashboard.settings.notifications.items.newIntegrations.desc',
  'dashboard.settings.notifications.toggleLabel',
]

const REQUIRED_EPIC_7_PATHS = [
  ...REQUIRED_LANDING_PATHS,
  ...REQUIRED_FIGMA_DEMO_PATHS,
  ...REQUIRED_DASHBOARD_LAYOUT_PATHS,
  ...REQUIRED_DASHBOARD_STATUS_PATHS,
  ...REQUIRED_DASHBOARD_OVERVIEW_PATHS,
  ...REQUIRED_DASHBOARD_RECOVERY_PATHS,
  ...REQUIRED_DASHBOARD_PAYOUTS_PATHS,
  ...REQUIRED_DASHBOARD_INSIGHTS_PATHS,
  ...REQUIRED_DASHBOARD_SETTINGS_PATHS,
]

describe('Story 7.5 — namespace parity for landing.*, figmaDemo.*, dashboard.*', () => {
  it.each(LOCALES)(
    'locale %s carries every required Epic 7 i18n key as a non-empty string',
    (_locale, bundle) => {
      const missing: string[] = []
      const empty: string[] = []
      for (const path of REQUIRED_EPIC_7_PATHS) {
        const value = getByPath(bundle, path)
        if (value === undefined) {
          missing.push(path)
        } else if (typeof value !== 'string' || value.trim() === '') {
          empty.push(path)
        }
      }
      expect(missing).toEqual([])
      expect(empty).toEqual([])
    },
  )

  it('landing.* tree shape is identical across en/pt-BR/es', () => {
    const enPaths = collectLeafPaths((enResources as Json).landing, 'landing').sort()
    const ptPaths = collectLeafPaths((ptResources as Json).landing, 'landing').sort()
    const esPaths = collectLeafPaths((esResources as Json).landing, 'landing').sort()
    expect(ptPaths).toEqual(enPaths)
    expect(esPaths).toEqual(enPaths)
  })

  it('figmaDemo.* tree shape is identical across en/pt-BR/es', () => {
    const enPaths = collectLeafPaths((enResources as Json).figmaDemo, 'figmaDemo').sort()
    const ptPaths = collectLeafPaths((ptResources as Json).figmaDemo, 'figmaDemo').sort()
    const esPaths = collectLeafPaths((esResources as Json).figmaDemo, 'figmaDemo').sort()
    expect(ptPaths).toEqual(enPaths)
    expect(esPaths).toEqual(enPaths)
  })

  it('dashboard.* tree shape is identical across en/pt-BR/es', () => {
    const enPaths = collectLeafPaths((enResources as Json).dashboard, 'dashboard').sort()
    const ptPaths = collectLeafPaths((ptResources as Json).dashboard, 'dashboard').sort()
    const esPaths = collectLeafPaths((esResources as Json).dashboard, 'dashboard').sort()
    expect(ptPaths).toEqual(enPaths)
    expect(esPaths).toEqual(enPaths)
  })

  it('interpolation placeholders match across en/pt-BR/es for every Epic 7 key', () => {
    const mismatches: string[] = []

    for (const path of REQUIRED_EPIC_7_PATHS) {
      const enTokens = interpolationTokens(getByPath(enResources, path))
      const ptTokens = interpolationTokens(getByPath(ptResources, path))
      const esTokens = interpolationTokens(getByPath(esResources, path))

      if (ptTokens.join('|') !== enTokens.join('|')) {
        mismatches.push(`pt-BR:${path}`)
      }
      if (esTokens.join('|') !== enTokens.join('|')) {
        mismatches.push(`es:${path}`)
      }
    }

    expect(mismatches).toEqual([])
  })
})
