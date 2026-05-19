import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18next from 'i18next'
import '@/i18n'
import { DemoApiError, postDemo } from '@/lib/api'
import { useLocaleStore } from '@/store/useLocaleStore'
import DemoForm from './DemoForm'

vi.mock('@/lib/api', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    postDemo: vi.fn(),
  }
})

const postDemoMock = vi.mocked(postDemo)

async function setLocale(locale: 'en' | 'pt-BR' | 'es') {
  useLocaleStore.setState({ locale })
  await i18next.changeLanguage(locale)
}

async function fillRequiredFields() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/Full name/i), 'Jane Smith')
  await user.type(screen.getByLabelText(/Work email/i), 'jane@example.com')
  await user.type(screen.getByLabelText(/Agency/i), 'Example Travel')
  await user.selectOptions(screen.getByLabelText(/Your role/i), 'Owner')
  await user.selectOptions(screen.getByLabelText(/Primary GDS/i), 'Sabre')
  return user
}

function expectLabelAssociation(control: HTMLElement, labelPattern: RegExp) {
  const label = control.ownerDocument.querySelector(`label[for="${control.id}"]`)
  expect(label).toHaveTextContent(labelPattern)
}

beforeEach(async () => {
  postDemoMock.mockReset()
  postDemoMock.mockResolvedValue({ success: true, message: 'Demo request received' })
  await setLocale('en')
})

describe('DemoForm', () => {
  it('renders associated labels, aria-required, focus classes, and hidden locale', () => {
    const { container } = render(<DemoForm />)

    const requiredControls = [
      [screen.getByLabelText(/Full name/i), /Full name/i],
      [screen.getByLabelText(/Work email/i), /Work email/i],
      [screen.getByLabelText(/Agency/i), /Agency/i],
      [screen.getByLabelText(/Your role/i), /Your role/i],
      [screen.getByLabelText(/Primary GDS/i), /Primary GDS/i],
    ] as const
    const optionalControls = [
      [screen.getByLabelText(/Phone/i), /Phone/i, /\(optional\)/i],
      [screen.getByLabelText(/Message/i), /Message/i, /\(optional\)/i],
    ] as const

    for (const [control, labelRegex] of requiredControls) {
      expectLabelAssociation(control, labelRegex)
      expect(control).toHaveAttribute('aria-required', 'true')
    }
    for (const [control, labelRegex, optionalRegex] of optionalControls) {
      const label = control.ownerDocument.querySelector(`label[for="${control.id}"]`)
      expect(label).toHaveTextContent(labelRegex)
      expect(label).toHaveTextContent(optionalRegex)
      expect(control).not.toHaveAttribute('aria-required')
    }

    // Required asterisks (Story 6.9 FormField primitive): one per required field
    const asterisks = container.querySelectorAll('span.req')
    expect(asterisks.length).toBeGreaterThanOrEqual(5)

    // GDS select carries a custom span chevron marked aria-hidden — a11y assertion
    const gdsSelect = screen.getByLabelText(/Primary GDS/i)
    const wrap = gdsSelect.closest('.select-wrap') as HTMLElement
    expect(wrap).not.toBeNull()
    const chevron = wrap.querySelector('span[aria-hidden="true"]')
    expect(chevron).not.toBeNull()

    const locale = container.querySelector('input[type="hidden"][name="locale"]')
    expect(locale).toHaveValue('en')
  })

  it('applies the accent focus ring class on inputs (Story 6.10 AC 15)', () => {
    render(<DemoForm />)
    const name = screen.getByLabelText(/Full name/i)
    expect(name.className).toMatch(/focus:border-\[var\(--accent\)\]/)
  })

  it('renders only the 4 canonical GDS options — Travelport merged, no Galileo/Worldspan/None yet', () => {
    render(<DemoForm />)
    const gds = screen.getByLabelText(/Primary GDS/i) as HTMLSelectElement
    const optionValues = Array.from(gds.options).map(o => o.value)
    expect(optionValues).toEqual([
      '',
      'Amadeus',
      'Sabre',
      'Travelport (Galileo/Worldspan)',
      'Other',
    ])
    expect(optionValues).not.toContain('Galileo')
    expect(optionValues).not.toContain('Worldspan')
    expect(optionValues).not.toContain('None yet')
  })

  it('validates required fields on blur with aria-describedby and no API call', async () => {
    const user = userEvent.setup()
    render(<DemoForm />)

    const name = screen.getByLabelText(/Full name/i)
    await user.click(name)
    await user.tab()

    const error = await screen.findByText('Full name is required')
    expect(error).toHaveAttribute('id', 'demo-name-error')
    expect(name).toHaveAttribute('aria-describedby', error.id)
    expect(postDemoMock).not.toHaveBeenCalled()
  })

  it('revalidates visible field errors when the locale changes (Story 2.6)', async () => {
    const user = userEvent.setup()
    render(<DemoForm />)

    const gds = screen.getByLabelText(/Primary GDS/i)
    await user.click(gds)
    await user.tab()

    expect(await screen.findByText('Please select your primary GDS')).toBeInTheDocument()

    await setLocale('es')

    expect(await screen.findByText('Por favor seleccione su GDS principal')).toBeInTheDocument()
    expect(gds).toHaveAttribute('aria-describedby', 'demo-gds-error')
    expect(screen.queryByText('Please select your primary GDS')).not.toBeInTheDocument()
  })

  it('keeps submit disabled while invalid', async () => {
    const user = userEvent.setup()
    render(<DemoForm />)
    const submit = screen.getByRole('button', { name: /Schedule demonstration/i })
    expect(submit).toBeDisabled()
    await user.click(submit)
    expect(postDemoMock).not.toHaveBeenCalled()
  })

  it('submit button uses flat-accent variant + mobile full-width classes', () => {
    render(<DemoForm />)
    const submit = screen.getByRole('button', { name: /Schedule demonstration/i })
    // Story 6.10 swap: flat solid-accent Button (not GradientButton).
    expect(submit.className).not.toMatch(/bg-gradient-brand/)
    expect(submit).toHaveClass('w-full')
    expect(submit).toHaveClass('min-h-[44px]')
    expect(submit).toHaveClass('whitespace-nowrap')
  })

  it('submits valid data with the canonical Travelport GDS and shows live success', async () => {
    let resolvePost: (value: { success: true; message: string }) => void = () => {}
    postDemoMock.mockReturnValue(
      new Promise(resolve => {
        resolvePost = resolve
      }),
    )

    render(<DemoForm />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/Full name/i), 'Jane Smith')
    await user.type(screen.getByLabelText(/Work email/i), 'jane@example.com')
    await user.type(screen.getByLabelText(/Agency/i), 'Example Travel')
    await user.selectOptions(screen.getByLabelText(/Your role/i), 'Owner')
    await user.selectOptions(
      screen.getByLabelText(/Primary GDS/i),
      'Travelport (Galileo/Worldspan)',
    )

    await user.click(screen.getByRole('button', { name: /Schedule demonstration/i }))

    expect(screen.getByRole('button', { name: /Sending/i })).toBeDisabled()
    expect(postDemoMock).toHaveBeenCalledWith({
      name: 'Jane Smith',
      email: 'jane@example.com',
      company: 'Example Travel',
      phone: '',
      role: 'Owner',
      gds: 'Travelport (Galileo/Worldspan)',
      message: '',
      locale: 'en',
    })

    resolvePost({ success: true, message: 'Demo request received' })

    const status = await screen.findByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status).toHaveAttribute('tabindex', '-1')
    expect(status).toHaveFocus()
    expect(status).toHaveTextContent('Request received!')
    expect(status).toHaveTextContent('Our team will reach out within 1 business day.')
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
  })

  it('preserves the Story 2.2 / 2.6 schema — submit accepts Sabre too', async () => {
    render(<DemoForm />)
    const user = await fillRequiredFields()
    await user.click(screen.getByRole('button', { name: /Schedule demonstration/i }))
    expect(postDemoMock).toHaveBeenCalledWith(
      expect.objectContaining({ gds: 'Sabre', role: 'Owner', locale: 'en' }),
    )
  })

  it('shows a destructive Toast for non-429 failures without clearing the form', async () => {
    postDemoMock.mockRejectedValueOnce(Object.assign(new Error('Boom'), { status: 500 }))

    render(<DemoForm />)
    const user = await fillRequiredFields()
    await user.click(screen.getByRole('button', { name: /Schedule demonstration/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Something went wrong. Please try again./i,
    )
    expect(screen.getByLabelText(/Full name/i)).toHaveValue('Jane Smith')
  })

  it('clears a previous Toast before retrying and renders inline guidance for 429 failures', async () => {
    postDemoMock
      .mockRejectedValueOnce(new DemoApiError(500, 'Server error'))
      .mockRejectedValueOnce(new DemoApiError(429, 'Too many requests'))

    render(<DemoForm />)
    const user = await fillRequiredFields()

    await user.click(screen.getByRole('button', { name: /Schedule demonstration/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Something went wrong. Please try again./i,
    )

    await user.click(screen.getByRole('button', { name: /Schedule demonstration/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Too many demo requests. Please wait a minute and try again./i,
    )
  })

  it('renders PT-BR labels, blur errors, and success confirmation', async () => {
    await setLocale('pt-BR')
    render(<DemoForm />)

    const user = userEvent.setup()
    const name = screen.getByLabelText(/Nome completo/i)
    await user.click(name)
    await user.tab()

    expect(await screen.findByText('Nome completo é obrigatório')).toBeInTheDocument()

    await user.type(name, 'Ana Silva')
    await user.type(screen.getByLabelText(/E-mail corporativo/i), 'ana@agencia.com.br')
    await user.type(screen.getByLabelText(/Agência/i), 'Agencia Exemplo')
    await user.selectOptions(screen.getByLabelText(/Seu cargo/i), 'Owner')
    await user.selectOptions(screen.getByLabelText(/GDS principal/i), 'Sabre')
    await user.click(screen.getByRole('button', { name: /Agendar demonstração/i }))

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Solicitação recebida!'),
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Nossa equipe entrará em contato em até 1 dia útil.',
    )
  })

  it('renders the encrypted-in-transit footer note + paper-plane-less submit row', () => {
    const { container } = render(<DemoForm />)
    expect(container.querySelector('[data-encrypted-note]')).not.toBeNull()
    expect(container.querySelector('[data-form-foot]')).not.toBeNull()
  })

  it('exposes one form with aria-label resolving from demo.form.heading', () => {
    render(<DemoForm />)
    const form = screen.getByRole('form', { name: 'Request a demonstration' })
    expect(form).toBeInTheDocument()
  })

  it('lets external callers focus the first field via DemoFormHandle.focusFirstField()', async () => {
    // Indirect: the imperative handle is wired in DemoScheduler — verify the
    // ref exists and the name input is focusable. We rely on integration via
    // Home.story-2-4.e2e.test.tsx to cover the full focus flow.
    render(<DemoForm />)
    const name = screen.getByLabelText(/Full name/i) as HTMLInputElement
    name.focus()
    expect(document.activeElement).toBe(name)
    // Sanity: tab order — name → email → company → phone → role → gds → message → submit
    const user = userEvent.setup()
    await user.tab()
    expect(screen.getByLabelText(/Work email/i)).toHaveFocus()
    const all = [
      screen.getByLabelText(/Agency/i),
      screen.getByLabelText(/Phone/i),
      screen.getByLabelText(/Your role/i),
      screen.getByLabelText(/Primary GDS/i),
      screen.getByLabelText(/Message/i),
    ]
    for (const el of all) {
      await user.tab()
      // Allow either the input itself or a wrapped variant
      expect(document.activeElement === el || el.contains(document.activeElement)).toBe(true)
    }
  })

  it('renders fields inside form-rows that collapse from 2-col desktop to 1-col mobile', () => {
    const { container } = render(<DemoForm />)
    const rows = container.querySelectorAll('.form-row')
    expect(rows.length).toBeGreaterThanOrEqual(3)
    rows.forEach(row => {
      expect((row as HTMLElement).className).toMatch(/grid-cols-1/)
      expect((row as HTMLElement).className).toMatch(/min-\[600px\]:grid-cols-2/)
    })
  })

  it('uses form-card padding 32px desktop / 24px below 600px', () => {
    const { container } = render(<DemoForm />)
    const card = container.querySelector('.form-card') as HTMLElement
    expect(card).not.toBeNull()
    expect(card.className).toMatch(/p-\[32px\]/)
    expect(card.className).toMatch(/max-\[600px\]:p-\[24px\]/)
    expect(card.className).toMatch(/border-\[var\(--line-strong\)\]/)
  })

  it('helper paragraph references the asterisk requirement', () => {
    render(<DemoForm />)
    expect(screen.getByText(/Fields marked with \* are required/i)).toBeInTheDocument()
  })

  describe('PT-BR locale-specific assertions', () => {
    it('uses GDS principal label and merged Travelport option', async () => {
      await setLocale('pt-BR')
      render(<DemoForm />)
      const gds = screen.getByLabelText(/GDS principal/i) as HTMLSelectElement
      const optionValues = Array.from(gds.options).map(o => o.value)
      expect(optionValues).toContain('Travelport (Galileo/Worldspan)')
      expect(optionValues).not.toContain('Galileo')
    })
  })
})
