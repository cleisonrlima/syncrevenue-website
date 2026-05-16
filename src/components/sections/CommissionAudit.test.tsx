import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18next from 'i18next'
import '@/i18n'
import { useLocaleStore } from '@/store/useLocaleStore'
import { postAudit } from '@/lib/api'
import CommissionAudit from './CommissionAudit'

vi.mock('@/lib/api', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    postAudit: vi.fn(),
  }
})

const postAuditMock = vi.mocked(postAudit)

async function setLocale(locale: 'en' | 'pt-BR' | 'es') {
  await i18next.changeLanguage(locale)
  useLocaleStore.setState({ locale })
}

beforeEach(async () => {
  postAuditMock.mockReset()
  postAuditMock.mockResolvedValue({ success: true, message: 'Audit request received' })
  await setLocale('en')
})

afterEach(async () => {
  await setLocale('en')
})

describe('CommissionAudit', () => {
  it('renders section heading, value bullets, and CTA', async () => {
    render(<CommissionAudit />)
    expect(await screen.findByTestId('commission-audit-section')).toBeInTheDocument()
    expect(screen.getAllByText(/free commission leakage audit/i).length).toBeGreaterThan(0)
    expect(screen.getByTestId('commission-audit-cta')).toBeInTheDocument()
    // 3 bullets
    const bullets = screen.getAllByText(/(30 days|written|no commitment)/i)
    expect(bullets.length).toBeGreaterThanOrEqual(3)
  })

  it('renders all required + optional form fields with asterisks on required', () => {
    render(<CommissionAudit />)
    const form = screen.getByTestId('commission-audit-form')
    expect(within(form).getByLabelText(/full name/i)).toBeInTheDocument()
    expect(within(form).getByLabelText(/work email/i)).toBeInTheDocument()
    expect(within(form).getByLabelText(/company/i)).toBeInTheDocument()
    expect(within(form).getByLabelText(/your role/i)).toBeInTheDocument()
    expect(within(form).getByLabelText(/primary gds/i)).toBeInTheDocument()
    expect(within(form).getByLabelText(/notes/i)).toBeInTheDocument()
  })

  it('keeps submit disabled while invalid; shows blur validation errors with aria-describedby', async () => {
    const user = userEvent.setup()
    render(<CommissionAudit />)
    const submit = screen.getByTestId('commission-audit-submit')
    expect(submit).toBeDisabled()

    const email = screen.getByLabelText(/work email/i) as HTMLInputElement
    await user.click(email)
    await user.tab()

    const error = await screen.findByText(/email is required|enter a valid email/i)
    expect(error).toBeInTheDocument()
    expect(email).toHaveAttribute('aria-describedby', expect.stringContaining('audit-email-error'))
  })

  it('submit button uses mobile full-width classes (AC4 + AC6)', () => {
    render(<CommissionAudit />)
    const submit = screen.getByTestId('commission-audit-submit')
    expect(submit).toHaveClass('w-full')
    expect(submit).toHaveClass('sm:w-auto')
    expect(submit).toHaveClass('min-h-[44px]')
    expect(submit).toHaveClass('whitespace-nowrap')
  })

  it('submits valid PT-BR data and renders in-place aria-live confirmation', async () => {
    await setLocale('pt-BR')
    const user = userEvent.setup()
    render(<CommissionAudit />)

    await user.type(screen.getByLabelText(/nome completo/i), 'Marcos Pereira')
    await user.type(screen.getByLabelText(/email corporativo/i), 'marcos@example.com')
    await user.type(screen.getByLabelText(/empresa/i), 'Agencia Sirius')
    await user.selectOptions(screen.getByLabelText(/seu cargo/i), 'Operations')
    await user.selectOptions(screen.getByLabelText(/gds principal/i), 'Amadeus')

    const submit = screen.getByTestId('commission-audit-submit')
    await waitFor(() => expect(submit).not.toBeDisabled())
    await user.click(submit)

    await waitFor(() => expect(postAuditMock).toHaveBeenCalledTimes(1))
    expect(postAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Marcos Pereira',
        email: 'marcos@example.com',
        company: 'Agencia Sirius',
        role: 'Operations',
        gds: 'Amadeus',
        locale: 'pt-BR',
      })
    )

    const success = await screen.findByRole('status')
    expect(success).toHaveAttribute('aria-live', 'polite')
    expect(success).toHaveTextContent(/solicita[cç][aã]o recebida/i)
  })
})
