import { render, screen, waitFor } from '@testing-library/react'
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
  await user.type(screen.getByLabelText(/Full Name/i), 'Jane Smith')
  await user.type(screen.getByLabelText(/Work Email/i), 'jane@example.com')
  await user.type(screen.getByLabelText(/Company/i), 'Example Travel')
  await user.selectOptions(screen.getByLabelText(/Your Role/i), 'Owner')
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
  it('renders associated labels, aria-required fields, focus classes, and hidden locale', () => {
    const { container } = render(<DemoForm />)

    const requiredControls = [
      [screen.getByLabelText(/Full Name/i), /Full Name/i],
      [screen.getByLabelText(/Work Email/i), /Work Email/i],
      [screen.getByLabelText(/Company/i), /Company/i],
      [screen.getByLabelText(/Your Role/i), /Your Role/i],
      [screen.getByLabelText(/Primary GDS/i), /Primary GDS/i],
    ] as const
    const optionalControls = [
      [screen.getByLabelText(/Phone \(optional\)/i), /Phone \(optional\)/i],
      [screen.getByLabelText(/Message \(optional\)/i), /Message \(optional\)/i],
    ] as const

    for (const [control, label] of requiredControls) {
      expectLabelAssociation(control, label)
      expect(control).toHaveAttribute('aria-required', 'true')
      expect(control).toHaveClass('focus-visible:ring-2')
      expect(control).toHaveClass('focus-visible:ring-brand-electric-blue')
    }
    for (const [control, label] of optionalControls) {
      expectLabelAssociation(control, label)
      expect(control).not.toHaveAttribute('aria-required')
      expect(control).toHaveClass('focus-visible:ring-2')
      expect(control).toHaveClass('focus-visible:ring-brand-electric-blue')
    }
    expect(screen.getAllByText('*').length).toBeGreaterThanOrEqual(5)
    expect(screen.getByRole('button', { name: /Request Demo/i })).toHaveClass('focus-visible:ring-white')

    const locale = container.querySelector('input[type="hidden"][name="locale"]')
    expect(locale).toHaveValue('en')
  })

  it('validates required fields on blur with aria-describedby and no API call', async () => {
    const user = userEvent.setup()
    render(<DemoForm />)

    const name = screen.getByLabelText(/Full Name/i)
    await user.click(name)
    await user.tab()

    const error = await screen.findByText('Full name is required')
    expect(error).toHaveClass('text-destructive')
    expect(error).toHaveAttribute('id', 'demo-name-error')
    expect(name).toHaveAttribute('aria-describedby', error.id)
    expect(postDemoMock).not.toHaveBeenCalled()
  })

  it('revalidates visible field errors when the locale changes', async () => {
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

  it('tabs through the demo form in visual order once submit is enabled', async () => {
    render(<DemoForm />)
    const user = await fillRequiredFields()

    const name = screen.getByLabelText(/Full Name/i)
    name.focus()
    expect(name).toHaveFocus()

    await user.tab()
    expect(screen.getByLabelText(/Work Email/i)).toHaveFocus()
    await user.tab()
    expect(screen.getByLabelText(/Company/i)).toHaveFocus()
    await user.tab()
    expect(screen.getByLabelText(/Phone \(optional\)/i)).toHaveFocus()
    await user.tab()
    expect(screen.getByLabelText(/Your Role/i)).toHaveFocus()
    await user.tab()
    expect(screen.getByLabelText(/Primary GDS/i)).toHaveFocus()
    await user.tab()
    expect(screen.getByLabelText(/Message \(optional\)/i)).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: /Request Demo/i })).toHaveFocus()
  })

  it('keeps submit disabled while invalid', async () => {
    const user = userEvent.setup()
    render(<DemoForm />)

    const submit = screen.getByRole('button', { name: /Request Demo/i })
    expect(submit).toBeDisabled()

    await user.click(submit)
    expect(postDemoMock).not.toHaveBeenCalled()
  })

  it('submit button uses mobile full-width classes (Story 3.4 AC4)', () => {
    render(<DemoForm />)
    const submit = screen.getByRole('button', { name: /Request Demo/i })
    // AC4: full-width on mobile, returns to compact at sm:; 44px tap target;
    // no-wrap to keep long PT-BR labels on a single line.
    expect(submit).toHaveClass('w-full')
    expect(submit).toHaveClass('sm:w-auto')
    expect(submit).toHaveClass('min-h-[44px]')
    expect(submit).toHaveClass('whitespace-nowrap')
  })

  it('submits valid data, shows submitting state, and replaces the form with live success copy', async () => {
    let resolvePost: (value: { success: true; message: string }) => void = () => {}
    postDemoMock.mockReturnValue(
      new Promise(resolve => {
        resolvePost = resolve
      })
    )

    render(<DemoForm />)
    const user = await fillRequiredFields()

    await user.click(screen.getByRole('button', { name: /Request Demo/i }))

    expect(screen.getByRole('button', { name: /Sending/i })).toBeDisabled()
    expect(postDemoMock).toHaveBeenCalledWith({
      name: 'Jane Smith',
      email: 'jane@example.com',
      company: 'Example Travel',
      phone: '',
      role: 'Owner',
      gds: 'Sabre',
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

  it('shows a destructive Toast for non-429 failures without clearing the form', async () => {
    postDemoMock.mockRejectedValueOnce(Object.assign(new Error('Something went wrong'), { status: 500 }))

    render(<DemoForm />)
    const user = await fillRequiredFields()
    await user.click(screen.getByRole('button', { name: /Request Demo/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong. Please try again.')
    expect(screen.getByLabelText(/Full Name/i)).toHaveValue('Jane Smith')
  })

  it('clears a previous Toast before retrying and does not Toast for 429 failures', async () => {
    postDemoMock
      .mockRejectedValueOnce(new DemoApiError(500, 'Server error'))
      .mockRejectedValueOnce(new DemoApiError(429, 'Too many requests'))

    render(<DemoForm />)
    const user = await fillRequiredFields()

    await user.click(screen.getByRole('button', { name: /Request Demo/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong. Please try again.')

    await user.click(screen.getByRole('button', { name: /Request Demo/i }))
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  it('renders PT-BR labels, blur errors, and success confirmation', async () => {
    await setLocale('pt-BR')
    render(<DemoForm />)

    const user = userEvent.setup()
    const name = screen.getByLabelText(/Nome Completo/i)
    await user.click(name)
    await user.tab()

    expect(await screen.findByText('Nome completo é obrigatório')).toBeInTheDocument()

    await user.type(name, 'Ana Silva')
    await user.type(screen.getByLabelText(/E-mail Corporativo/i), 'ana@agencia.com.br')
    await user.type(screen.getByLabelText(/Empresa/i), 'Agencia Exemplo')
    await user.selectOptions(screen.getByLabelText(/Seu Cargo/i), 'Owner')
    await user.selectOptions(screen.getByLabelText(/GDS Principal/i), 'Sabre')
    await user.click(screen.getByRole('button', { name: /Solicitar Demo/i }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Solicitação recebida!'))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Nossa equipe entrará em contato em até 1 dia útil.'
    )
  })
})
