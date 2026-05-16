import { test, expect } from '@playwright/test'

/**
 * Story 3.1 — Real Team Photos & Bio Content.
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

async function gotoHomeWithLocale(page: import('@playwright/test').Page, locale: string) {
  await page.addInitScript(loc => {
    try {
      window.localStorage.setItem('i18nextLng', loc)
    } catch {
      // private browsing — fall back to default
    }
  }, locale)
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.locator('#team').scrollIntoViewIfNeeded()
}

test.describe('@P0 Team section — real photos', () => {
  test('renders the Team region with 2 article cards', async ({ page }) => {
    await gotoHomeWithLocale(page, 'en')

    const region = page.locator('#team')
    await expect(region).toBeVisible()

    const articles = page.locator(TEAM_ARTICLE)
    await expect(articles).toHaveCount(2)
  })

  test('each member <img> uses composed "{name}, {role}" alt text', async ({ page }) => {
    await gotoHomeWithLocale(page, 'en')

    const imgs = page.locator(TEAM_IMG)
    const count = await imgs.count()
    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const alt = await imgs.nth(i).getAttribute('alt')
      expect(alt, `img[${i}] missing alt`).not.toBeNull()
      expect(alt, `img[${i}] empty alt`).not.toBe('')
      // Composed format: "Name, Role" — exactly one ", " separator,
      // non-empty parts on both sides.
      expect(alt!).toMatch(/^.+,\s+.+$/)
    }
  })

  test('each member <img> declares width=320, height=320, loading=lazy (CLS)', async ({ page }) => {
    await gotoHomeWithLocale(page, 'en')

    const imgs = page.locator(TEAM_IMG)
    const count = await imgs.count()
    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const img = imgs.nth(i)
      await expect(img).toHaveAttribute('width', '320')
      await expect(img).toHaveAttribute('height', '320')
      await expect(img).toHaveAttribute('loading', 'lazy')
      const src = await img.getAttribute('src')
      expect(src, `img[${i}] src`).toMatch(/^\/team\/.+\.webp$/)
    }
  })
})

test.describe('@P1 Team section — content & layout', () => {
  test('no placeholder initials block renders when all members have photos', async ({ page }) => {
    await gotoHomeWithLocale(page, 'en')

    // Current i18n data ships a non-empty `photo` for every member.
    // If anyone empties it back to "", this asserts the regression.
    await expect(page.locator(TEAM_PLACEHOLDER)).toHaveCount(0)
  })

  test('no LinkedIn anchor renders when linkedinUrl is empty (current data)', async ({ page }) => {
    await gotoHomeWithLocale(page, 'en')

    // Current i18n ships empty `linkedinUrl` for every member.
    // Guards against `href="#"` placeholder leaking back in.
    const anchors = page.locator(`${TEAM_ARTICLE} a`)
    await expect(anchors).toHaveCount(0)
  })

  test('mobile viewport renders a single column grid', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await gotoHomeWithLocale(page, 'en')

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

  test('role text differs across en, pt-BR, and es locales (locale-distinct bios contract)', async ({ page }) => {
    const rolesByLocale: Record<string, string[]> = {}

    for (const locale of ['en', 'pt-BR', 'es']) {
      await gotoHomeWithLocale(page, locale)
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
