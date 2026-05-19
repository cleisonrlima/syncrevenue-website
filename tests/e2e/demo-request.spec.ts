import { expect, test, type Page, type Route } from '@playwright/test'

type DemoPayload = {
  name: string
  email: string
  company: string
  phone: string
  role: string
  gds: string
  message: string
  locale: string
}

function demoForm(page: Page) {
  return page.getByRole('form', { name: /Request a demonstration|Solicitar demonstração/i })
}

async function fillRequiredDemoFields(page: Page) {
  const form = demoForm(page)
  await form.getByLabel(/Full name/i).fill('Jane Smith')
  await form.getByLabel(/Work email/i).fill('jane@example.com')
  await form.getByLabel(/Agency/i).fill('Example Travel')
  await form.getByLabel(/Your role/i).selectOption('Owner')
  await form.getByLabel(/Primary GDS/i).selectOption('Sabre')
}

function captureDemoRequest(page: Page) {
  let capturedPayload: DemoPayload | undefined
  let releaseResponse: () => void = () => {}
  const responseGate = new Promise<void>(resolve => {
    releaseResponse = resolve
  })

  return {
    get payload() {
      return capturedPayload
    },
    releaseResponse,
    async install() {
      await page.route('**/api/demo', async (route: Route) => {
        capturedPayload = route.request().postDataJSON() as DemoPayload
        await responseGate
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Demo request received' }),
        })
      })
    },
  }
}

test.describe('@P1 Demo request form (Story 6.10 — agendar-demo + Travelport)', () => {
  test('keeps invalid submissions local and submits a valid request with success confirmation', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.locator('#agendar-demo').scrollIntoViewIfNeeded()

    const form = demoForm(page)
    await expect(form).toBeVisible()
    await expect(form.getByLabel(/Full name/i)).toBeVisible()
    await expect(form.getByLabel(/Work email/i)).toBeVisible()
    await expect(form.getByLabel(/Agency/i)).toBeVisible()
    await expect(form.getByLabel(/Phone/i)).toBeVisible()
    await expect(form.getByLabel(/Your role/i)).toBeVisible()
    await expect(form.getByLabel(/Primary GDS/i)).toBeVisible()
    await expect(form.getByLabel(/Message/i)).toBeVisible()

    let requestCount = 0
    await page.route('**/api/demo', async route => {
      requestCount += 1
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Demo request received' }),
      })
    })

    const nameField = form.getByLabel(/Full name/i)
    await nameField.focus()
    await nameField.blur()
    const nameError = page.getByText('Full name is required')
    await expect(nameError).toBeVisible()
    await expect(nameField).toHaveAttribute('aria-describedby', 'demo-name-error')
    await expect(page.getByRole('button', { name: /Schedule demonstration/i })).toBeDisabled()

    await form.evaluate(element => {
      if (element instanceof HTMLFormElement) element.requestSubmit()
    })
    expect(requestCount).toBe(0)

    await page.unroute('**/api/demo')
    const demoRequest = captureDemoRequest(page)
    await demoRequest.install()

    await fillRequiredDemoFields(page)
    await form.getByLabel(/Phone/i).fill('+1 305 555 0100')
    await form.getByLabel(/Message/i).fill('We need help reconciling commissions.')
    await page.getByRole('button', { name: /Schedule demonstration/i }).click()

    await expect(page.getByRole('button', { name: /Sending/i })).toBeDisabled()
    expect(demoRequest.payload).toEqual({
      name: 'Jane Smith',
      email: 'jane@example.com',
      company: 'Example Travel',
      phone: '+1 305 555 0100',
      role: 'Owner',
      gds: 'Sabre',
      message: 'We need help reconciling commissions.',
      locale: 'en',
    })

    demoRequest.releaseResponse()
    const confirmation = page.getByRole('status')
    await expect(confirmation).toHaveAttribute('aria-live', 'polite')
    await expect(confirmation).toHaveAttribute('tabindex', '-1')
    await expect(confirmation).toBeFocused()
    await expect(confirmation).toContainText('Request received!')
    await expect(confirmation).toContainText('Our team will reach out within 1 business day.')
    await expect(page.getByRole('form', { name: /Request a demonstration/i })).toHaveCount(0)
  })

  test('submits the merged Travelport (Galileo/Worldspan) GDS value', async ({ page }) => {
    const demoRequest = captureDemoRequest(page)
    await demoRequest.install()

    await page.goto('/', { waitUntil: 'networkidle' })
    await page.locator('#agendar-demo').scrollIntoViewIfNeeded()

    const form = demoForm(page)
    await form.getByLabel(/Full name/i).fill('Maria Souza')
    await form.getByLabel(/Work email/i).fill('maria@agency.com')
    await form.getByLabel(/Agency/i).fill('Souza Travel')
    await form.getByLabel(/Your role/i).selectOption('Owner')
    await form.getByLabel(/Primary GDS/i).selectOption('Travelport (Galileo/Worldspan)')
    await page.getByRole('button', { name: /Schedule demonstration/i }).click()

    await expect(page.getByRole('button', { name: /Sending/i })).toBeDisabled()
    expect(demoRequest.payload?.gds).toBe('Travelport (Galileo/Worldspan)')

    demoRequest.releaseResponse()
    await expect(page.getByRole('status')).toContainText('Request received!')
  })

  test('supports keyboard tab order, native GDS select operation, and confirmation focus', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Keyboard sequence covered in desktop Chromium')

    const demoRequest = captureDemoRequest(page)
    await demoRequest.install()

    await page.goto('/', { waitUntil: 'networkidle' })
    await page.locator('#agendar-demo').scrollIntoViewIfNeeded()

    const form = demoForm(page)
    const name = form.getByLabel(/Full name/i)
    const email = form.getByLabel(/Work email/i)
    const company = form.getByLabel(/Agency/i)
    const phone = form.getByLabel(/Phone/i)
    const role = form.getByLabel(/Your role/i)
    const gds = form.getByLabel(/Primary GDS/i)
    const message = form.getByLabel(/Message/i)
    const submit = page.getByRole('button', { name: /Schedule demonstration/i })

    await name.fill('Jane Smith')
    await email.fill('jane@example.com')
    await company.fill('Example Travel')
    await role.selectOption('Owner')
    await gds.focus()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await expect(gds).toHaveValue('Sabre')

    await name.focus()
    await expect(name).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(email).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(company).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(phone).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(role).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(gds).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(message).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(submit).toBeFocused()

    await page.keyboard.press('Enter')
    demoRequest.releaseResponse()

    const confirmation = page.getByRole('status')
    await expect(confirmation).toHaveAttribute('aria-live', 'polite')
    await expect(confirmation).toBeFocused()
  })

  test('shows a retryable destructive toast when the API returns a non-rate-limit error', async ({
    page,
  }) => {
    await page.route('**/api/demo', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Internal server error' }),
      })
    })

    await page.goto('/', { waitUntil: 'networkidle' })
    await page.locator('#agendar-demo').scrollIntoViewIfNeeded()
    await fillRequiredDemoFields(page)
    await page.getByRole('button', { name: /Schedule demonstration/i }).click()

    await expect(page.getByRole('alert')).toContainText('Something went wrong. Please try again.')
    await expect(demoForm(page).getByLabel(/Full name/i)).toHaveValue('Jane Smith')
    await expect(page.getByRole('button', { name: /Schedule demonstration/i })).toBeEnabled()
  })

  test('submits the active pt-BR locale and renders localized confirmation', async ({ page }) => {
    const demoRequest = captureDemoRequest(page)
    await demoRequest.install()

    await page.goto('/', { waitUntil: 'networkidle' })
    const languageSwitcher = page.getByRole('group', { name: /select language/i }).first()
    await languageSwitcher.getByRole('button').click()
    await page.getByRole('menuitemradio', { name: 'PT-BR' }).click()
    await page.locator('#agendar-demo').scrollIntoViewIfNeeded()

    const form = demoForm(page)
    await form.getByLabel(/Nome completo/i).fill('Ana Silva')
    await form.getByLabel(/E-mail corporativo/i).fill('ana@agencia.com.br')
    await form.getByLabel(/Agência/i).fill('Agencia Exemplo')
    await form.getByLabel(/Seu cargo/i).selectOption('Owner')
    await form.getByLabel(/GDS principal/i).selectOption('Sabre')
    await page.getByRole('button', { name: /Agendar demonstração/i }).click()

    await expect(page.getByRole('button', { name: /Enviando/i })).toBeDisabled()
    expect(demoRequest.payload?.locale).toBe('pt-BR')

    demoRequest.releaseResponse()
    const confirmation = page.getByRole('status')
    await expect(confirmation).toContainText('Solicitação recebida!')
    await expect(confirmation).toContainText('Nossa equipe entrará em contato em até 1 dia útil.')
  })
})
