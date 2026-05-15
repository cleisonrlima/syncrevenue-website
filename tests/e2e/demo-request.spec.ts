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

async function fillRequiredDemoFields(page: Page) {
  await page.getByLabel(/Full Name/i).fill('Jane Smith')
  await page.getByLabel(/Work Email/i).fill('jane@example.com')
  await page.getByLabel(/Company/i).fill('Example Travel')
  await page.getByLabel(/Your Role/i).selectOption('Owner')
  await page.getByLabel(/Primary GDS/i).selectOption('Sabre')
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

test.describe('@P1 Demo request form', () => {
  test('keeps invalid submissions local and submits a valid request with success confirmation', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const demoForm = page.getByRole('form', { name: /Request a Demo/i })
    await expect(demoForm).toBeVisible()
    await expect(page.getByLabel(/Full Name/i)).toBeVisible()
    await expect(page.getByLabel(/Work Email/i)).toBeVisible()
    await expect(page.getByLabel(/Company/i)).toBeVisible()
    await expect(page.getByLabel(/Phone \(optional\)/i)).toBeVisible()
    await expect(page.getByLabel(/Your Role/i)).toBeVisible()
    await expect(page.getByLabel(/Primary GDS/i)).toBeVisible()
    await expect(page.getByLabel(/Message \(optional\)/i)).toBeVisible()

    let requestCount = 0
    await page.route('**/api/demo', async route => {
      requestCount += 1
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Demo request received' }),
      })
    })

    const nameField = page.getByLabel(/Full Name/i)
    await nameField.focus()
    await nameField.blur()
    const nameError = page.getByText('Full name is required')
    await expect(nameError).toBeVisible()
    await expect(nameField).toHaveAttribute('aria-describedby', 'demo-name-error')
    await expect(page.getByRole('button', { name: /Request Demo/i })).toBeDisabled()

    await demoForm.evaluate(form => {
      if (form instanceof HTMLFormElement) form.requestSubmit()
    })
    expect(requestCount).toBe(0)

    await page.unroute('**/api/demo')
    const demoRequest = captureDemoRequest(page)
    await demoRequest.install()

    await fillRequiredDemoFields(page)
    await page.getByLabel(/Phone \(optional\)/i).fill('+1 305 555 0100')
    await page
      .getByLabel(/Message \(optional\)/i)
      .fill('We need help reconciling commissions.')
    await page.getByRole('button', { name: /Request Demo/i }).click()

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
    await expect(confirmation).toContainText('Request received!')
    await expect(confirmation).toContainText('Our team will reach out within 1 business day.')
    await expect(page.getByRole('form', { name: /Request a Demo/i })).toHaveCount(0)
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
    await fillRequiredDemoFields(page)
    await page.getByRole('button', { name: /Request Demo/i }).click()

    await expect(page.getByRole('alert')).toContainText('Something went wrong. Please try again.')
    await expect(page.getByLabel(/Full Name/i)).toHaveValue('Jane Smith')
    await expect(page.getByRole('button', { name: /Request Demo/i })).toBeEnabled()
  })

  test('submits the active pt-BR locale and renders localized confirmation', async ({ page }) => {
    const demoRequest = captureDemoRequest(page)
    await demoRequest.install()

    await page.goto('/', { waitUntil: 'networkidle' })
    await page.getByRole('group', { name: /select language/i }).getByRole('button', { name: /pt-br/i }).click()

    await page.getByLabel(/Nome Completo/i).fill('Ana Silva')
    await page.getByLabel(/E-mail Corporativo/i).fill('ana@agencia.com.br')
    await page.getByLabel(/Empresa/i).fill('Agencia Exemplo')
    await page.getByLabel(/Seu Cargo/i).selectOption('Owner')
    await page.getByLabel(/GDS Principal/i).selectOption('Sabre')
    await page.getByRole('button', { name: /Solicitar Demo/i }).click()

    await expect(page.getByRole('button', { name: /Enviando/i })).toBeDisabled()
    expect(demoRequest.payload?.locale).toBe('pt-BR')

    demoRequest.releaseResponse()
    const confirmation = page.getByRole('status')
    await expect(confirmation).toContainText('Solicitação recebida!')
    await expect(confirmation).toContainText('Nossa equipe entrará em contato em até 1 dia útil.')
  })
})
