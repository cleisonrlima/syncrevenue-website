import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18next from 'i18next'
import '@/i18n'
import { ContactApiError, postContact } from '@/lib/api'
import { useLocaleStore } from '@/store/useLocaleStore'
import Contact from './Contact'

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
  await user.type(screen.getByLabelText(/Full Name/i), 'Jane Smith')
  await user.type(screen.getByLabelText(/Email Address/i), 'jane@example.com')
  await user.selectOptions(screen.getByLabelText(/Subject \/ Service/i), 'BI/Data Analytics')
  await user.type(screen.getByLabelText(/^Message/i), 'We need analytics support.')
  return user
}

beforeEach(async () => {
  postContactMock.mockReset()
  postContactMock.mockResolvedValue({ success: true, message: 'Contact message received' })
  await setLocale('en')
})

describe('Contact', () => {
  it('renders SectionHeader, required fields, fixed subject options, and labels with asterisks', () => {
    render(<Contact />)

    expect(screen.getByRole('heading', { name: /Contact Sync Sirius/i })).toBeInTheDocument()
    expect(screen.getByText('General Inquiries')).toBeInTheDocument()
    expect(screen.getByLabelText(/Full Name/i)).toBeRequired()
    expect(screen.getByLabelText(/Email Address/i)).toBeRequired()
    expect(screen.getByLabelText(/Subject \/ Service/i)).toBeRequired()
    expect(screen.getByLabelText(/^Message/i)).toBeRequired()
    expect(screen.getAllByText('*')).toHaveLength(4)

    const subject = screen.getByLabelText(/Subject \/ Service/i)
    for (const option of ['SyncRevenue', 'BI/Data Analytics', 'OBTs', 'Custom Development', 'Other']) {
      expect(subject).toHaveDisplayValue('Select a service area')
      expect(screen.getByRole('option', { name: option })).toHaveValue(option)
    }
  })

  it('validates fields on blur with aria-describedby and no Toast', async () => {
    const user = userEvent.setup()
    render(<Contact />)

    const email = screen.getByLabelText(/Email Address/i)
    await user.type(email, 'not-an-email')
    await user.tab()

    const error = await screen.findByText('Enter a valid email address')
    expect(error).toHaveClass('text-destructive')
    expect(email).toHaveAttribute('aria-describedby', error.id)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(postContactMock).not.toHaveBeenCalled()
  })

  it('clears stale field errors while a corrected field changes', async () => {
    const user = userEvent.setup()
    render(<Contact />)

    const email = screen.getByLabelText(/Email Address/i)
    await user.type(email, 'not-an-email')
    await user.tab()

    const error = await screen.findByText('Enter a valid email address')
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(email).toHaveAttribute('aria-describedby', error.id)

    await user.clear(email)
    await user.type(email, 'jane@example.com')

    expect(screen.queryByText('Enter a valid email address')).not.toBeInTheDocument()
    expect(email).not.toHaveAttribute('aria-invalid')
    expect(email).not.toHaveAttribute('aria-describedby')
  })

  it('keeps submit disabled while invalid', async () => {
    const user = userEvent.setup()
    render(<Contact />)

    const submit = screen.getByRole('button', { name: /Send Message/i })
    expect(submit).toBeDisabled()

    await user.click(submit)
    expect(postContactMock).not.toHaveBeenCalled()
  })

  it('submits valid data with store locale and replaces the form with live success copy', async () => {
    let resolvePost: (value: { success: true; message: string }) => void = () => {}
    postContactMock.mockReturnValue(
      new Promise(resolve => {
        resolvePost = resolve
      })
    )

    render(<Contact />)
    const user = await fillRequiredFields()

    useLocaleStore.setState({ locale: 'pt-BR' })
    await user.click(screen.getByRole('button', { name: /Send Message/i }))

    expect(screen.getByRole('button', { name: /Sending/i })).toBeDisabled()
    expect(postContactMock).toHaveBeenCalledWith({
      name: 'Jane Smith',
      email: 'jane@example.com',
      subject: 'BI/Data Analytics',
      message: 'We need analytics support.',
      locale: 'pt-BR',
    })

    resolvePost({ success: true, message: 'Contact message received' })

    const status = await screen.findByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status).toHaveTextContent('Message sent!')
    expect(status).toHaveTextContent('We received your inquiry and will route it to the right team.')
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
  })

  it('renders HTTP 429 as an inline form error without Toast', async () => {
    postContactMock.mockRejectedValueOnce(new ContactApiError(429, 'Too many requests'))

    render(<Contact />)
    const user = await fillRequiredFields()
    await user.click(screen.getByRole('button', { name: /Send Message/i }))

    expect(await screen.findByText('Too many contact requests. Please wait a minute and try again.')).toHaveClass(
      'text-destructive'
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders non-429 failures inline without clearing the form', async () => {
    postContactMock.mockRejectedValueOnce(new ContactApiError(500, 'Server error'))

    render(<Contact />)
    const user = await fillRequiredFields()
    await user.click(screen.getByRole('button', { name: /Send Message/i }))

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument()
    expect(screen.getByLabelText(/Full Name/i)).toHaveValue('Jane Smith')
  })

  it('renders PT-BR labels, blur errors, and success confirmation', async () => {
    await setLocale('pt-BR')
    render(<Contact />)

    const user = userEvent.setup()
    const name = screen.getByLabelText(/Nome Completo/i)
    await user.click(name)
    await user.tab()

    expect(await screen.findByText('Nome completo é obrigatório')).toBeInTheDocument()

    await user.type(name, 'Ana Silva')
    await user.type(screen.getByLabelText(/Endereço de E-mail/i), 'ana@agencia.com.br')
    await user.selectOptions(screen.getByLabelText(/Assunto \/ Serviço/i), 'SyncRevenue')
    await user.type(screen.getByLabelText(/^Mensagem/i), 'Preciso de ajuda com comissões.')
    await user.click(screen.getByRole('button', { name: /Enviar Mensagem/i }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Mensagem enviada!'))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Recebemos sua mensagem e vamos encaminhá-la para a equipe certa.'
    )
  })
})
