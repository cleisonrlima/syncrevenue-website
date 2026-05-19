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
