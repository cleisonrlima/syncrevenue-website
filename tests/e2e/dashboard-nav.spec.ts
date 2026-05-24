import { test, expect } from './fixtures'

/**
 * Story 7.8 (AC 3) — User-journey traversal: Dashboard sidebar navigation.
 *
 * Spec:
 *   1. Navigate to /dashboard and confirm the Overview heading loads.
 *   2. Click each of the 4 child sidebar nav items in order:
 *        Revenue Recovery  → /dashboard/recovery
 *        Payouts           → /dashboard/payouts
 *        Insights          → /dashboard/insights
 *        Settings          → /dashboard/settings
 *   3. After each click, assert the URL updated AND the page's h1 heading
 *      matches the expected page title.
 *
 * DashboardLayout is front-end-only in Epic 7 (no backend auth guard),
 * so no mock/login step is needed.
 *
 * Nav items use `data-testid="dashboard-nav-{suffix}"` from DashboardLayout
 * (suffix derived from the last path segment; the Overview index route uses
 * "dashboard" as suffix). The tests use the accessible name ("role=link") as
 * the primary selector and fall back to testId where the accessible-name
 * lookup would be ambiguous between the desktop + mobile nav copies.
 *
 * Runs in chromium + webkit (and their mobile counterparts) per
 * playwright.config.ts → projects.
 */

const CHILD_NAV_ITEMS = [
  {
    label: 'Revenue Recovery',
    suffix: 'recovery',
    expectedUrl: /\/dashboard\/recovery/,
    expectedHeading: /Revenue Recovery/i,
  },
  {
    label: 'Payouts',
    suffix: 'payouts',
    expectedUrl: /\/dashboard\/payouts/,
    expectedHeading: /Agent Payouts/i,
  },
  {
    label: 'Insights',
    suffix: 'insights',
    expectedUrl: /\/dashboard\/insights/,
    expectedHeading: /Predictive Insights/i,
  },
  {
    label: 'Settings',
    suffix: 'settings',
    expectedUrl: /\/dashboard\/settings/,
    expectedHeading: /Platform Settings/i,
  },
]

test.describe('Story 7.8 — Dashboard sidebar navigation @P1', () => {
  test.setTimeout(90_000)

  test('navigates to each dashboard child route via the sidebar nav', async ({ page }) => {
    // Step 1: open /dashboard → Overview heading visible
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await expect(page.getByRole('heading', { level: 1, name: /Overview/i })).toBeVisible()

    // Step 2-3: iterate over child nav items
    for (const { label, suffix, expectedUrl, expectedHeading } of CHILD_NAV_ITEMS) {
      // Use the sidebar nav link (desktop); it is the first matching link in
      // the sidebar — data-testid="dashboard-nav-{suffix}" is also available
      // but the accessible-name query is more semantically robust.
      // `page.getByRole('link', { name: label })` matches both the desktop
      // sidebar link and the mobile bottom-nav link; `.first()` picks the
      // desktop sidebar which is always in the DOM on desktop viewports.
      const navLink = page.locator(
        `[data-testid="dashboard-nav-${suffix}"]:visible, [data-testid="dashboard-mobile-nav-${suffix}"]:visible`,
      ).first()
      await expect(navLink).toBeVisible()
      await navLink.scrollIntoViewIfNeeded()
      await navLink.click({ force: true })

      // URL updated
      await expect(page).toHaveURL(expectedUrl)

      // Page heading matches
      await expect(page.getByRole('heading', { level: 1, name: expectedHeading })).toBeVisible()
    }
  })
})
