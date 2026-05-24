import { test, expect } from './fixtures'

/**
 * Story 3.1 — Team Photos & Bio Content.
 *
 * Verifies the public Team section against AC1, AC3 (UI invariants), and
 * cross-locale content (AC2). Component-level details (LinkedIn-present
 * anchor, parity test) are covered by unit tests in
 * `src/components/sections/Team.test.tsx` and `src/i18n/index.test.ts`.
 */

const TEAM_GRID = '[data-team-grid="true"]'
const TEAM_ARTICLE = `${TEAM_GRID} > article`
const TEAM_IMG = `${TEAM_GRID} img`
const TEAM_PLACEHOLDER = '[data-team-photo-placeholder="true"]'
const TEAM_NAMES = ['Maria Silva', 'Lucas Oliveira']

async function seedDefaultTeam(e2eDb: import('./fixtures').E2eDb) {
  e2eDb.deleteTeamByNames(TEAM_NAMES)
  e2eDb.seedTeamMember({
    name: 'Maria Silva',
    role_en: 'Airline Distribution & Commission Strategy Lead',
    role_pt: 'Líder de Distribuição Aérea e Estratégia de Comissões',
    role_es: 'Líder de Distribución Aérea y Estrategia de Comisiones',
    bio_en:
      'Guides travel agencies through GDS operations, BSP/ARC reconciliation, debit memo workflows, and commission recovery strategy across the Americas.',
    bio_pt:
      'Orienta agências de viagens em operações de GDS, conciliação BSP/ARC, fluxos de débito e estratégia de recuperação de comissões nas Américas.',
    bio_es:
      'Guía a agencias de viajes en operaciones GDS, conciliación BSP/ARC, flujos de débitos y estrategia de recuperación de comisiones en las Américas.',
    experience_en: '20+ years in airline distribution',
    experience_pt: '20+ anos em distribuição aérea',
    experience_es: '20+ años en distribución aérea',
    linkedin: 'https://www.linkedin.com/in/maria-silva-syncsirius/',
    photo_url: '/team/maria-silva.webp',
    order_index: 0,
  })
  e2eDb.seedTeamMember({
    name: 'Lucas Oliveira',
    role_en: 'Travel Data Integration & Automation Lead',
    role_pt: 'Líder de Integração de Dados e Automação de Viagens',
    role_es: 'Líder de Integración de Datos y Automatización de Viajes',
    bio_en:
      'Designs the automation layer behind SyncRevenue, connecting booking data, commission rules, and revenue optimization systems.',
    bio_pt:
      'Projeta a camada de automação por trás do SyncRevenue, conectando dados de reservas, regras de comissão e sistemas de receita.',
    bio_es:
      'Diseña la capa de automatización detrás de SyncRevenue, conectando datos de reservas, reglas de comisión y sistemas de ingresos.',
    experience_en: '15+ years in travel data automation',
    experience_pt: '15+ anos em automação de dados de viagens',
    experience_es: '15+ años en automatización de datos de viajes',
    linkedin: 'https://www.linkedin.com/in/lucas-oliveira-syncsirius/',
    photo_url: '/team/lucas-oliveira.webp',
    order_index: 1,
  })
}

async function gotoHomeWithLocale(
  page: import('@playwright/test').Page,
  e2eDb: import('./fixtures').E2eDb,
  locale: string,
) {
  await seedDefaultTeam(e2eDb)
  await page.addInitScript(loc => {
    try {
      window.localStorage.setItem('i18nextLng', loc)
    } catch {
      // private browsing — fall back to default
    }
  }, locale)
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.locator('#equipe').scrollIntoViewIfNeeded()
}

test.describe('@P0 Team section — member media', () => {
  test('renders the Team region with 2 article cards', async ({ page, e2eDb }) => {
    await gotoHomeWithLocale(page, e2eDb, 'en')

    const region = page.locator('#equipe')
    await expect(region).toBeVisible()

    const articles = page.locator(TEAM_ARTICLE)
    await expect(articles).toHaveCount(2)
  })

  test('configured member photos use composed "{name}, {role}" alt text', async ({ page, e2eDb }) => {
    await gotoHomeWithLocale(page, e2eDb, 'en')

    const imgs = page.locator(TEAM_IMG)
    const count = await imgs.count()

    for (let i = 0; i < count; i++) {
      const alt = await imgs.nth(i).getAttribute('alt')
      expect(alt, `img[${i}] missing alt`).not.toBeNull()
      expect(alt, `img[${i}] empty alt`).not.toBe('')
      // Composed format: "Name, Role" — exactly one ", " separator,
      // non-empty parts on both sides.
      expect(alt!).toMatch(/^.+,\s+.+$/)
    }
  })

  test('configured member photos declare width=200, height=200, loading=lazy (CLS)', async ({ page, e2eDb }) => {
    await gotoHomeWithLocale(page, e2eDb, 'en')

    const imgs = page.locator(TEAM_IMG)
    const count = await imgs.count()

    for (let i = 0; i < count; i++) {
      const img = imgs.nth(i)
      await expect(img).toHaveAttribute('width', '200')
      await expect(img).toHaveAttribute('height', '200')
      await expect(img).toHaveAttribute('loading', 'lazy')
      const src = await img.getAttribute('src')
      expect(src, `img[${i}] src`).toMatch(/^\/team\/.+\.webp$/)
    }
  })
})

test.describe('@P1 Team section — content & layout', () => {
  test('all members render real photos — initials placeholder block is absent', async ({ page, e2eDb }) => {
    await gotoHomeWithLocale(page, e2eDb, 'en')

    await expect(page.locator(TEAM_PLACEHOLDER)).toHaveCount(0)
    const photos = page.locator(`${TEAM_IMG}[src^="/team/"]`)
    await expect(photos).toHaveCount(2)
  })

  test('LinkedIn anchor renders for every member with linkedinUrl set', async ({ page, e2eDb }) => {
    await gotoHomeWithLocale(page, e2eDb, 'en')

    const anchors = page.locator(`${TEAM_ARTICLE} a[target="_blank"]`)
    await expect(anchors).toHaveCount(2)

    for (let i = 0; i < 2; i++) {
      const anchor = anchors.nth(i)
      const href = await anchor.getAttribute('href')
      expect(href, `LinkedIn href ${i}`).toMatch(/^https:\/\/www\.linkedin\.com\//)
      await expect(anchor).toHaveAttribute('rel', /noopener\s+noreferrer/)
    }
  })

  test('mobile viewport renders a single column grid', async ({ page, e2eDb }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await gotoHomeWithLocale(page, e2eDb, 'en')

    const grid = page.locator(TEAM_GRID)
    await expect(grid).toBeVisible()

    const cards = page.locator(TEAM_ARTICLE)
    const count = await cards.count()
    expect(count).toBeGreaterThanOrEqual(2)

    // Boxes for first two cards must stack: card[1].top >= card[0].bottom.
    const first = await cards.nth(0).boundingBox()
    const second = await cards.nth(1).boundingBox()
    expect(first, 'first card bounding box').not.toBeNull()
    expect(second, 'second card bounding box').not.toBeNull()
    expect(second!.y).toBeGreaterThanOrEqual(first!.y + first!.height - 1)
  })

  test('role text differs across en, pt-BR, and es locales (locale-distinct bios contract)', async ({ page, e2eDb }) => {
    const rolesByLocale: Record<string, string[]> = {}

    for (const locale of ['en', 'pt-BR', 'es']) {
      await gotoHomeWithLocale(page, e2eDb, locale)
      const roles = await page.locator(`${TEAM_ARTICLE} p.uppercase`).allInnerTexts()
      expect(roles.length, `${locale} role count`).toBeGreaterThan(0)
      rolesByLocale[locale] = roles.map(r => r.trim())
    }

    // Each locale's first-member role must be a distinct string from the other two.
    expect(rolesByLocale.en[0]).not.toBe(rolesByLocale['pt-BR'][0])
    expect(rolesByLocale.en[0]).not.toBe(rolesByLocale.es[0])
    expect(rolesByLocale['pt-BR'][0]).not.toBe(rolesByLocale.es[0])
  })
})
