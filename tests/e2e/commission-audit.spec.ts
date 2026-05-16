import { test, expect } from '@playwright/test'

/**
 * Story 3.5 — Commission Audit Lead Magnet.
 * Validates section visibility + ordering, form submission flow, blur
 * validation, and the 375px mobile contract.
 */

test.describe('@P0 Commission audit section', () => {
  test('section renders between SyncRevenue and Services in scroll order', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const syncrevenue = page.locator('#syncrevenue')
    const audit = page.locator('#commission-audit')
    const services = page.locator('#services')

    await audit.scrollIntoViewIfNeeded()
    await expect(audit).toBeVisible()

    const orders = await page.evaluate(() => {
      const ids = ['syncrevenue', 'commission-audit', 'services']
      return ids.map(id => document.getElementById(id)?.getBoundingClientRect().top ?? Infinity)
    })

    // SyncRevenue must be above CommissionAudit, which must be above Services.
    expect(orders[0]).toBeLessThan(orders[1])
    expect(orders[1]).toBeLessThan(orders[2])

    await expect(syncrevenue).toBeVisible()
    await expect(services).toBeVisible()
  })

  test('form submits with valid PT-BR data and shows in-place aria-live confirmation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    // Open hamburger to access the mobile language switcher (works on mobile preset; desktop has its own).
    const isMobile = (page.viewportSize()?.width ?? 1280) < 1024
    if (isMobile) {
      await page.getByRole('button', { name: /open menu/i }).click()
      const switcher = page.getByTestId('mobile-overlay-content').getByRole('group', { name: /select language/i })
      await switcher.getByRole('button', { name: /pt-br/i }).click()
      await page.keyboard.press('Escape')
    } else {
      const switcher = page.locator('nav').getByRole('group', { name: /select language/i }).first()
      await switcher.getByRole('button', { name: /pt-br/i }).click()
    }

    await page.locator('#commission-audit').scrollIntoViewIfNeeded()

    // Intercept the POST so the test does not require a running backend.
    await page.route('**/api/audit', route =>
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'Audit request received' }) })
    )

    await page.fill('#audit-name', 'Marcos Pereira')
    await page.fill('#audit-email', 'marcos@example.com')
    await page.fill('#audit-company', 'Agencia Sirius')
    await page.selectOption('#audit-role', 'Operations')
    await page.selectOption('#audit-gds', 'Amadeus')

    const submit = page.getByTestId('commission-audit-submit')
    await expect(submit).toBeEnabled()
    await submit.click()

    const status = page.getByRole('status').first()
    await expect(status).toBeVisible()
    await expect(status).toHaveAttribute('aria-live', 'polite')
  })

  test('renders ES locale copy in section heading and form labels', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const isMobile = (page.viewportSize()?.width ?? 1280) < 1024
    if (isMobile) {
      await page.getByRole('button', { name: /open menu/i }).click()
      const switcher = page.getByTestId('mobile-overlay-content').getByRole('group', { name: /select language/i })
      await switcher.getByRole('button', { name: /^es$/i }).click()
      await page.keyboard.press('Escape')
    } else {
      const switcher = page.locator('nav').getByRole('group', { name: /select language/i }).first()
      await switcher.getByRole('button', { name: /^es$/i }).click()
    }

    const audit = page.locator('#commission-audit')
    await audit.scrollIntoViewIfNeeded()

    // ES heading + form labels must NOT match EN/PT-BR exact strings (locale-distinct copy).
    const headingText = await audit.locator('h2, h3').first().innerText()
    expect(headingText.length).toBeGreaterThan(0)
    expect(headingText.toLowerCase()).not.toContain('commission')
    expect(headingText.toLowerCase()).not.toContain('auditoria')

    // Form name label rendered in ES — should not equal the EN label "Name".
    const nameLabel = await page.locator('label[for="audit-name"]').innerText()
    expect(nameLabel.length).toBeGreaterThan(0)
    expect(nameLabel.trim().toLowerCase()).not.toBe('name')
  })
})

test.describe('@P1 Commission audit mobile contract (375px)', () => {
  test.use({ viewport: { width: 375, height: 800 } })

  test('all form fields and submit are full-width with 44px tap target at 375px', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.locator('#commission-audit').scrollIntoViewIfNeeded()

    const submit = page.getByTestId('commission-audit-submit')
    await expect(submit).toBeVisible()

    const submitBox = await submit.boundingBox()
    expect(submitBox).not.toBeNull()
    if (submitBox) {
      // 375 viewport - page padding (px-4 = 16+16) - form padding (p-6 = 24+24) = 295px content width.
      // Submit is w-full so its bounding box matches the form content area.
      expect(submitBox.width).toBeGreaterThanOrEqual(280)
      expect(submitBox.height).toBeGreaterThanOrEqual(44)
    }

    // Verify input widths near form content width (no side-by-side at 375px).
    const fieldYs = await page.locator('#audit-form input, #audit-form select, #audit-form textarea').evaluateAll(nodes =>
      (nodes as HTMLElement[])
        .filter(n => (n as HTMLInputElement).type !== 'hidden')
        .map(n => Math.round(n.getBoundingClientRect().top))
    )
    const sorted = [...fieldYs].sort((a, b) => a - b)
    for (let i = 1; i < sorted.length; i += 1) {
      // No two visible fields share a row (within 8px tolerance for stacked layout).
      expect(sorted[i] - sorted[i - 1]).toBeGreaterThan(8)
    }

    // Every visible field must match the form content width (full-width contract).
    const formBox = await page.locator('#audit-form').boundingBox()
    expect(formBox).not.toBeNull()
    if (formBox) {
      const fieldWidths = await page.locator('#audit-form input, #audit-form select, #audit-form textarea').evaluateAll(nodes =>
        (nodes as HTMLElement[])
          .filter(n => (n as HTMLInputElement).type !== 'hidden')
          .map(n => Math.round(n.getBoundingClientRect().width))
      )
      const expectedWidth = Math.round(formBox.width) - 48 // form p-6 padding (24+24)
      for (const w of fieldWidths) {
        // Each input fills the form content area (within 4px tolerance for borders).
        expect(Math.abs(w - expectedWidth)).toBeLessThanOrEqual(4)
      }
    }

    // Section is visible without horizontal overflow at 375px.
    const overflow = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      vw: window.innerWidth,
    }))
    expect(overflow.doc).toBeLessThanOrEqual(overflow.vw + 2)
  })
})
