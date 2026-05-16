import { test, expect } from '@playwright/test'

/**
 * Story 3.4 — Mobile UX polish pass.
 * Validates 375px no-horizontal-overflow contract, Hero mobile sizing/layout,
 * form full-width submit controls, and cross-locale heading fit (PT-BR/ES).
 */

const SECTION_IDS = [
  '#hero',
  '#syncrevenue',
  '#services',
  '#comparison',
  '#security',
  '#client-references',
  '#team',
  '#demo-scheduler',
  '#contact',
]

const HORIZONTAL_SCROLL_EXEMPT = new Set(['#comparison'])

test.use({ viewport: { width: 375, height: 800 } })

test.describe('@P0 Mobile UX 375px', () => {
  test('document has no horizontal overflow before or after scrolling all sections', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const initial = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      vw: window.innerWidth,
    }))
    expect(initial.doc).toBeLessThanOrEqual(initial.vw)
    expect(initial.body).toBeLessThanOrEqual(initial.vw)

    for (const id of SECTION_IDS) {
      await page.locator(id).scrollIntoViewIfNeeded()
      const measurement = await page.evaluate(() => ({
        doc: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
        vw: window.innerWidth,
      }))
      expect(measurement.doc, `${id} caused document overflow`).toBeLessThanOrEqual(measurement.vw)
      expect(measurement.body, `${id} caused body overflow`).toBeLessThanOrEqual(measurement.vw)
    }
  })

  test('every public section is visible and stays within viewport width', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    for (const id of SECTION_IDS) {
      const section = page.locator(id)
      await section.scrollIntoViewIfNeeded()
      await expect(section).toBeVisible()

      const box = await section.boundingBox()
      expect(box, `${id} has no bounding box`).not.toBeNull()
      if (box) {
        expect(box.width, `${id} wider than viewport`).toBeLessThanOrEqual(375 + 1)
      }

      if (HORIZONTAL_SCROLL_EXEMPT.has(id)) continue

      const childOverflow = await section.evaluate((el) => {
        const vw = window.innerWidth
        const isInsideHorizontalScroll = (node: HTMLElement) => {
          let cur: HTMLElement | null = node.parentElement
          while (cur && cur !== el) {
            const style = window.getComputedStyle(cur)
            if (style.overflowX === 'auto' || style.overflowX === 'scroll') return true
            cur = cur.parentElement
          }
          return false
        }
        const overflowed: string[] = []
        el.querySelectorAll<HTMLElement>('*').forEach((node) => {
          if (isInsideHorizontalScroll(node)) return
          const rect = node.getBoundingClientRect()
          if (rect.right - 1 > vw) {
            const cls = typeof node.className === 'string' ? node.className : ''
            overflowed.push(node.tagName + (cls ? '.' + cls.split(' ').slice(0, 2).join('.') : ''))
          }
        })
        return overflowed.slice(0, 5)
      })
      expect(childOverflow, `${id} has children past viewport`).toEqual([])
    }
  })

  test('Hero H1 computes to 32-36px on mobile and primary CTA is full-width', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const h1 = page.locator('#hero h1').first()
    await expect(h1).toBeVisible()

    const fontSize = await h1.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    expect(fontSize).toBeGreaterThanOrEqual(32)
    expect(fontSize).toBeLessThanOrEqual(36)

    const cta = page.locator('#hero button, #hero a[role="button"]').first()
    await expect(cta).toBeVisible()
    const ctaBox = await cta.boundingBox()
    expect(ctaBox).not.toBeNull()
    if (ctaBox) {
      expect(ctaBox.width, 'CTA should be near-full-width on mobile').toBeGreaterThanOrEqual(300)
      expect(ctaBox.height, 'CTA touch target at least 44px').toBeGreaterThanOrEqual(44)
    }
  })

  test('demo form submit button is full-width on mobile', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.locator('#demo-scheduler').scrollIntoViewIfNeeded()

    const submit = page.locator('#demo-form button[type="submit"]').first()
    await expect(submit).toBeVisible()
    const widths = await submit.evaluate((btn) => {
      const form = btn.closest('form') as HTMLElement | null
      const formStyle = form ? getComputedStyle(form) : null
      const formInner = form
        ? form.clientWidth - parseFloat(formStyle!.paddingLeft) - parseFloat(formStyle!.paddingRight)
        : 0
      return { btn: btn.getBoundingClientRect().width, formInner }
    })
    expect(widths.formInner).toBeGreaterThan(0)
    expect(widths.btn / widths.formInner, 'demo submit should fill form content width').toBeGreaterThanOrEqual(0.95)
    const box = await submit.boundingBox()
    expect(box).not.toBeNull()
    if (box) expect(box.height).toBeGreaterThanOrEqual(44)
  })

  test('contact form submit button is full-width on mobile', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.locator('#contact').scrollIntoViewIfNeeded()

    const submit = page.locator('#contact button[type="submit"]').first()
    await expect(submit).toBeVisible()
    const widths = await submit.evaluate((btn) => {
      const form = btn.closest('form') as HTMLElement | null
      const formStyle = form ? getComputedStyle(form) : null
      const formInner = form
        ? form.clientWidth - parseFloat(formStyle!.paddingLeft) - parseFloat(formStyle!.paddingRight)
        : 0
      return { btn: btn.getBoundingClientRect().width, formInner }
    })
    expect(widths.formInner).toBeGreaterThan(0)
    expect(widths.btn / widths.formInner, 'contact submit should fill form content width').toBeGreaterThanOrEqual(0.95)
    const box = await submit.boundingBox()
    expect(box).not.toBeNull()
    if (box) expect(box.height).toBeGreaterThanOrEqual(44)
  })
})

test.describe('@P1 Mobile UX cross-locale heading fit', () => {
  test('PT-BR Hero H1 stays within viewport without horizontal overflow', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    await page.getByRole('button', { name: /open menu/i }).click()
    const switcher = page.getByTestId('mobile-overlay-content').getByRole('group', { name: /select language/i })
    await switcher.getByRole('button', { name: /pt-br/i }).click()
    await expect(switcher.getByRole('button', { name: /pt-br/i })).toHaveAttribute('aria-current', 'true')

    await page.keyboard.press('Escape')

    const h1 = page.locator('#hero h1').first()
    await expect(h1).toBeVisible()
    const box = await h1.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(375 + 1)
    }

    const overflow = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      vw: window.innerWidth,
    }))
    expect(overflow.doc).toBeLessThanOrEqual(overflow.vw)
  })
})
