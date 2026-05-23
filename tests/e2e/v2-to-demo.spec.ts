import { test, expect } from '@playwright/test'

/**
 * Story 7.8 (AC 3) — User-journey traversal: /v2 (Landing) → /demo (DemoForm).
 *
 * Spec:
 *   1. Navigate to /v2 and confirm the hero heading loads.
 *   2. Click the primary "Schedule a Demo" CTA that points to /demo.
 *   3. Fill the demo request form with mock values (no real API call —
 *      the form's submit handler is entirely client-side in the Epic 7 port).
 *   4. Submit the form and assert the success panel appears.
 *
 * The form submission is intentionally NOT wired to the backend (the Epic 7
 * DemoForm is a static Figma port without a real API call), so there is no
 * network mock needed. The success panel is rendered client-side on submit.
 *
 * Runs in chromium + webkit (and their mobile counterparts) per
 * playwright.config.ts → projects.
 */

test.describe('Story 7.8 — /v2 → /demo journey @P1', () => {
  test.setTimeout(90_000)

  test('navigates from Landing hero to the Demo form and submits successfully', async ({ page }) => {
    // Step 1: land on /v2 and confirm hero h1 visible
    await page.goto('/v2', { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: /Recover lost revenue\./i })).toBeVisible()

    // Step 2: click a visible "Schedule a Demo" CTA. The desktop nav CTA is
    // first in DOM but hidden on mobile, so scope to Playwright's visible
    // pseudo-class for the configured mobile projects.
    const bookLink = page.locator('a[href="/demo"]:visible').first()
    await expect(bookLink).toBeVisible()
    await bookLink.click()

    // Step 3: confirm we arrived on /demo
    await expect(page).toHaveURL(/\/demo/)
    await expect(page.getByRole('heading', { level: 1, name: /See SyncRevenue in action/i })).toBeVisible()

    // Step 4: fill required fields
    await page.getByLabel(/First Name/i).fill('Jane')
    await page.getByLabel(/Last Name/i).fill('Doe')
    await page.getByLabel(/Work Email/i).fill('jane@agency.com')
    await page.getByLabel(/Company Name/i).fill('Acme Agency')

    // Step 5: submit
    const form = page.locator('form')
    await form.evaluate((el: HTMLFormElement) => el.requestSubmit())

    // Step 6: assert success panel
    await expect(page.getByRole('heading', { level: 3, name: /Request Received/i })).toBeVisible()
    // Confirm the form fields are replaced (mutual exclusion)
    await expect(page.getByLabel(/Work Email/i)).not.toBeVisible()
  })
})
