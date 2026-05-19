import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18next from 'i18next'
import '@/i18n'
import { ContactApiError, postContact } from '@/lib/api'
import { useLocaleStore } from '@/store/useLocaleStore'
import ContactForm from './ContactForm'

vi.mock('@/lib/api', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    postContact: vi.fn(),
  }
})

const postContactMock = vi.mocked(postContact)

async function setLocale(locale: 'en' | 'pt-BR' | 'es') {
  useLocaleStore.setState({ locale })
  await i18next.changeLanguage(locale)
}

async function fillRequiredFields() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/^Full name/i), 'Jane Smith')
  await user.type(screen.getByLabelText(/^Email/i), 'jane@example.com')
  await user.selectOptions(screen.getByLabelText(/^Subject/i), 'support')
  await user.type(screen.getByLabelText(/^Message/i), 'We need support help.')
  return user
}

beforeEach(async () => {
  postContactMock.mockReset()
  postContactMock.mockResolvedValue({ success: true, message: 'Contact message received' })
  await setLocale('en')
})

describe('ContactForm', () => {
  it('renders form-card with helper, required asterisks, and accent-coloured asterisk class', () => {
    const { container } = render(<ContactForm />)

    const form = screen.getByRole('form', { name: /Send a message/i })
    expect(form).toBeInTheDocument()
    expect(form.classList.contains('form-card')).toBe(true)

    expect(screen.getByText('Send a message')).toBeInTheDocument()
    expect(screen.getByText('We route the message based on the subject.')).toBeInTheDocument()

    // Four required fields → four `.req` asterisks
    const reqMarks = container.querySelectorAll('.req')
    expect(reqMarks.length).toBe(4)
    reqMarks.forEach(mark => {
      expect(mark.getAttribute('aria-hidden')).toBe('true')
      expect(mark.textContent).toBe('*')
    })

    // aria-required on every required input
    expect(screen.getByLabelText(/^Full name/i)).toHaveAttribute('aria-required', 'true')
    expect(screen.getByLabelText(/^Email/i)).toHaveAttribute('aria-required', 'true')
    expect(screen.getByLabelText(/^Subject/i)).toHaveAttribute('aria-required', 'true')
    expect(screen.getByLabelText(/^Message/i)).toHaveAttribute('aria-required', 'true')
  })

  it('renders the new routing subject enum (commercial/support/partnerships/press/other) with localized labels', () => {
    render(<ContactForm />)

    const subject = screen.getByLabelText(/^Subject/i) as HTMLSelectElement
    expect(subject).toHaveDisplayValue('Select a subject')

    const optionValues = Array.from(subject.options)
      .slice(1)
      .map(option => option.value)
    expect(optionValues).toEqual(['commercial', 'support', 'partnerships', 'press', 'other'])

    expect(within(subject).getByRole('option', { name: 'Commercial — SyncRevenue' })).toHaveValue('commercial')
    expect(within(subject).getByRole('option', { name: 'Customer support' })).toHaveValue('support')
    expect(within(subject).getByRole('option', { name: 'Partnerships & integrations' })).toHaveValue('partnerships')
    expect(within(subject).getByRole('option', { name: 'Press & media' })).toHaveValue('press')
    expect(within(subject).getByRole('option', { name: 'Other' })).toHaveValue('other')
  })

  it('renders a custom chevron aria-hidden on the subject select and the accent focus ring class', () => {
    const { container } = render(<ContactForm />)
    const subjectWrap = container.querySelector('.select-wrap')
    expect(subjectWrap).not.toBeNull()
    const chevron = subjectWrap?.querySelector('[aria-hidden="true"]')
    expect(chevron).not.toBeNull()

    const subject = screen.getByLabelText(/^Subject/i)
    expect(subject.className).toMatch(/focus:border-\[var\(--accent\)\]/)
  })

  it('renders the EncryptedTransitNote in the form-foot', () => {
    const { container } = render(<ContactForm />)
    const foot = container.querySelector('.form-foot')
    expect(foot).not.toBeNull()
    expect(foot?.querySelector('[data-encrypted-note]')).not.toBeNull()
  })

  it('renders the paper-plane SVG with aria-hidden on the submit button', () => {
    render(<ContactForm />)
    const submit = screen.getByRole('button', { name: /Send message/i })
    const svg = submit.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
  })

  it('validates fields on blur with aria-describedby and no Toast', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)

    const email = screen.getByLabelText(/^Email/i)
    await user.type(email, 'not-an-email')
    await user.tab()

    const error = await screen.findByText('Enter a valid email address')
    expect(error).toHaveAttribute('id', 'contact-email-error')
    expect(error).toHaveAttribute('role', 'alert')
    expect(email).toHaveAttribute('aria-describedby', 'contact-email-error')
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(postContactMock).not.toHaveBeenCalled()
  })

  it('revalidates visible field errors when the locale changes', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)

    const message = screen.getByLabelText(/^Message/i)
    await user.click(message)
    await user.tab()

    expect(await screen.findByText('Message is required')).toBeInTheDocument()

    await setLocale('pt-BR')

    expect(await screen.findByText('Mensagem é obrigatória')).toBeInTheDocument()
    expect(message).toHaveAttribute('aria-describedby', 'contact-message-error')
    expect(screen.queryByText('Message is required')).not.toBeInTheDocument()
  })

  it('keeps submit disabled while the form is invalid', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)
    const submit = screen.getByRole('button', { name: /Send message/i })
    expect(submit).toBeDisabled()
    await user.click(submit)
    expect(postContactMock).not.toHaveBeenCalled()
  })

  it('submit button uses mobile full-width classes and min-44px tap target (Story 3.4 AC4)', () => {
    render(<ContactForm />)
    const submit = screen.getByRole('button', { name: /Send message/i })
    expect(submit).toHaveClass('w-full')
    expect(submit).toHaveClass('min-[600px]:w-auto')
    expect(submit).toHaveClass('min-h-[44px]')
    expect(submit).toHaveClass('whitespace-nowrap')
  })

  it('submits valid data with store locale and replaces the form with the success status region', async () => {
    let resolvePost: (value: { success: true; message: string }) => void = () => {}
    postContactMock.mockReturnValue(
      new Promise(resolve => {
        resolvePost = resolve
      })
    )

    render(<ContactForm />)
    const user = await fillRequiredFields()

    useLocaleStore.setState({ locale: 'pt-BR' })
    await user.click(screen.getByRole('button', { name: /Send message/i }))

    expect(screen.getByRole('button', { name: /Sending/i })).toBeDisabled()
    expect(postContactMock).toHaveBeenCalledWith({
      name: 'Jane Smith',
      email: 'jane@example.com',
      subject: 'support',
      message: 'We need support help.',
      locale: 'pt-BR',
    })

    resolvePost({ success: true, message: 'Contact message received' })

    const status = await screen.findByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status).toHaveAttribute('tabindex', '-1')
    expect(status).toHaveFocus()
    expect(status).toHaveTextContent('Message sent!')
    expect(status).toHaveTextContent('We received your inquiry and will route it to the right team.')
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
  })

  it('renders HTTP 429 as an inline form error without Toast', async () => {
    postContactMock.mockRejectedValueOnce(new ContactApiError(429, 'Too many requests'))

    render(<ContactForm />)
    const user = await fillRequiredFields()
    await user.click(screen.getByRole('button', { name: /Send message/i }))

    expect(
      await screen.findByText('Too many contact requests. Please wait a minute and try again.')
    ).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders non-429 failures inline without clearing the form', async () => {
    postContactMock.mockRejectedValueOnce(new ContactApiError(500, 'Server error'))

    render(<ContactForm />)
    const user = await fillRequiredFields()
    await user.click(screen.getByRole('button', { name: /Send message/i }))

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Full name/i)).toHaveValue('Jane Smith')
  })

  it('renders PT-BR labels, blur errors, and success confirmation', async () => {
    await setLocale('pt-BR')
    render(<ContactForm />)

    const user = userEvent.setup()
    const name = screen.getByLabelText(/^Nome completo/i)
    await user.click(name)
    await user.tab()

    expect(await screen.findByText('Nome completo é obrigatório')).toBeInTheDocument()

    await user.type(name, 'Ana Silva')
    await user.type(screen.getByLabelText(/^E-mail/i), 'ana@agencia.com.br')
    await user.selectOptions(screen.getByLabelText(/^Assunto/i), 'commercial')
    await user.type(screen.getByLabelText(/^Mensagem/i), 'Preciso de ajuda com comissões.')
    await user.click(screen.getByRole('button', { name: /Enviar mensagem/i }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Mensagem enviada!'))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Recebemos sua mensagem e vamos encaminhá-la para a equipe certa.'
    )
  })
})
