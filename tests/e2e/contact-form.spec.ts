import { expect, test, type Page, type Route } from '@playwright/test'

type ContactPayload = {
  name: string
  email: string
  subject: string
  message: string
  locale: string
}

async function fillRequiredContactFields(page: Page) {
  const contactForm = page.getByRole('form', { name: /Contact Us/i })
  await contactForm.getByLabel(/Full Name/i).fill('Jane Smith')
  await contactForm.getByLabel(/Email Address/i).fill('jane@example.com')
  await contactForm.getByLabel(/Subject \/ Service/i).selectOption('BI/Data Analytics')
  await contactForm.getByLabel(/^Message/i).fill('We need analytics support.')
}

function captureContactRequest(page: Page) {
  let capturedPayload: ContactPayload | undefined
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
      await page.route('**/api/contact', async (route: Route) => {
        capturedPayload = route.request().postDataJSON() as ContactPayload
        await responseGate
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Contact message received' }),
        })
      })
    },
  }
}

test.describe('@P1 Contact form', () => {
  test('keeps invalid submissions local and submits a valid inquiry with success confirmation', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const contactForm = page.getByRole('form', { name: /Contact Us/i })
    await expect(contactForm).toBeVisible()
    await expect(contactForm.getByLabel(/Full Name/i)).toBeVisible()
    await expect(contactForm.getByLabel(/Email Address/i)).toBeVisible()
    await expect(contactForm.getByLabel(/Subject \/ Service/i)).toBeVisible()
    await expect(contactForm.getByLabel(/^Message/i)).toBeVisible()

    const subject = contactForm.getByLabel(/Subject \/ Service/i)
    await expect(subject.getByRole('option', { name: 'SyncRevenue' })).toBeVisible()
    await expect(subject.getByRole('option', { name: 'BI/Data Analytics' })).toBeVisible()
    await expect(subject.getByRole('option', { name: 'OBTs' })).toBeVisible()
    await expect(subject.getByRole('option', { name: 'Custom Development' })).toBeVisible()
    await expect(subject.getByRole('option', { name: 'Other' })).toBeVisible()
    const subjectOptionValues = await subject.locator('option').evaluateAll(options =>
      options.slice(1).map(option => (option as HTMLOptionElement).value)
    )
    expect(subjectOptionValues).toEqual([
      'SyncRevenue',
      'BI/Data Analytics',
      'OBTs',
      'Custom Development',
      'Other',
    ])

    let requestCount = 0
    await page.route('**/api/contact', async route => {
      requestCount += 1
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Contact message received' }),
      })
    })

    const emailField = contactForm.getByLabel(/Email Address/i)
    await emailField.fill('not-an-email')
    await emailField.blur()
    const emailError = page.getByText('Enter a valid email address')
    await expect(emailError).toBeVisible()
    await expect(emailField).toHaveAttribute('aria-describedby', 'contact-email-error')
    await expect(contactForm.getByRole('button', { name: /Send Message/i })).toBeDisabled()

    await contactForm.evaluate(form => {
      if (form instanceof HTMLFormElement) form.requestSubmit()
    })
    expect(requestCount).toBe(0)

    await page.unroute('**/api/contact')
    const contactRequest = captureContactRequest(page)
    await contactRequest.install()

    await contactForm.getByLabel(/Full Name/i).fill('Jane Smith')
    await emailField.fill('jane@example.com')
    await subject.selectOption('BI/Data Analytics')
    await contactForm.getByLabel(/^Message/i).fill('We need analytics support.')
    await contactForm.getByRole('button', { name: /Send Message/i }).click()

    await expect(contactForm.getByRole('button', { name: /Sending/i })).toBeDisabled()
    expect(contactRequest.payload).toEqual({
      name: 'Jane Smith',
      email: 'jane@example.com',
      subject: 'BI/Data Analytics',
      message: 'We need analytics support.',
      locale: 'en',
    })

    contactRequest.releaseResponse()
    const confirmation = page.getByRole('status')
    await expect(confirmation).toHaveAttribute('aria-live', 'polite')
    await expect(confirmation).toHaveAttribute('tabindex', '-1')
    await expect(confirmation).toBeFocused()
    await expect(confirmation).toContainText('Message sent!')
    await expect(confirmation).toContainText(
      'We received your inquiry and will route it to the right team.'
    )
    await expect(page.getByRole('form', { name: /Contact Us/i })).toHaveCount(0)
  })

  test('supports keyboard tab order and confirmation focus', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Keyboard sequence covered in desktop Chromium')

    const contactRequest = captureContactRequest(page)
    await contactRequest.install()

    await page.goto('/', { waitUntil: 'networkidle' })

    const contactForm = page.getByRole('form', { name: /Contact Us/i })
    const name = contactForm.getByLabel(/Full Name/i)
    const email = contactForm.getByLabel(/Email Address/i)
    const subject = contactForm.getByLabel(/Subject \/ Service/i)
    const message = contactForm.getByLabel(/^Message/i)
    const submit = contactForm.getByRole('button', { name: /Send Message/i })

    await name.fill('Jane Smith')
    await email.fill('jane@example.com')
    await subject.selectOption('BI/Data Analytics')
    await message.fill('We need analytics support.')

    await name.focus()
    await expect(name).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(email).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(subject).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(message).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(submit).toBeFocused()

    await page.keyboard.press('Enter')
    contactRequest.releaseResponse()

    const confirmation = page.getByRole('status')
    await expect(confirmation).toHaveAttribute('aria-live', 'polite')
    await expect(confirmation).toBeFocused()
  })

  test('shows HTTP 429 as an inline form error without a toast', async ({ page }) => {
    await page.route('**/api/contact', async route => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Too many requests' }),
      })
    })

    await page.goto('/', { waitUntil: 'networkidle' })
    await fillRequiredContactFields(page)
    await page
      .getByRole('form', { name: /Contact Us/i })
      .getByRole('button', { name: /Send Message/i })
      .click()

    await expect(
      page.getByText('Too many contact requests. Please wait a minute and try again.')
    ).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(0)
    await expect(page.getByRole('form', { name: /Contact Us/i })).toBeVisible()
  })

  test('submits the active pt-BR locale and renders localized confirmation', async ({ page }) => {
    const contactRequest = captureContactRequest(page)
    await contactRequest.install()

    await page.goto('/', { waitUntil: 'networkidle' })
    await page
      .getByRole('group', { name: /select language/i })
      .getByRole('button', { name: /pt-br/i })
      .click()

    const contactForm = page.getByRole('form', { name: /Entre em Contato/i })
    await contactForm.getByLabel(/Nome Completo/i).fill('Ana Silva')
    await contactForm.getByLabel(/Endereço de E-mail/i).fill('ana@agencia.com.br')
    await contactForm.getByLabel(/Assunto \/ Serviço/i).selectOption('SyncRevenue')
    await contactForm.getByLabel(/^Mensagem/i).fill('Preciso de ajuda com comissoes.')
    await contactForm.getByRole('button', { name: /Enviar Mensagem/i }).click()

    await expect(contactForm.getByRole('button', { name: /Enviando/i })).toBeDisabled()
    expect(contactRequest.payload).toEqual({
      name: 'Ana Silva',
      email: 'ana@agencia.com.br',
      subject: 'SyncRevenue',
      message: 'Preciso de ajuda com comissoes.',
      locale: 'pt-BR',
    })

    contactRequest.releaseResponse()
    const confirmation = page.getByRole('status')
    await expect(confirmation).toContainText('Mensagem enviada!')
    await expect(confirmation).toContainText('Recebemos sua mensagem')
  })
})
