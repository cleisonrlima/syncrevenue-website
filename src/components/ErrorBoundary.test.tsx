import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import i18n from '@/i18n'
import ErrorBoundary from './ErrorBoundary'

function Boom({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('boom')
  }
  return <div data-testid="recovered">recovered</div>
}

const sectionLoadMessage = () => i18n.t('errors.sectionLoad')

describe('ErrorBoundary', () => {
  // React logs caught errors to console.error; suppress in this test file only.
  const originalError = console.error
  beforeAll(() => {
    console.error = () => {}
  })
  afterAll(() => {
    console.error = originalError
  })

  afterEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div data-testid="ok">ok</div>
      </ErrorBoundary>,
    )
    expect(screen.getByTestId('ok')).toBeInTheDocument()
  })

  it('renders localized fallback in EN by default', () => {
    render(
      <ErrorBoundary>
        <Boom shouldThrow />
      </ErrorBoundary>,
    )
    expect(screen.getByText(sectionLoadMessage())).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('renders localized fallback in PT-BR after changeLanguage', async () => {
    await i18n.changeLanguage('pt-BR')
    render(
      <ErrorBoundary>
        <Boom shouldThrow />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Falha ao carregar a seção.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
  })

  it('renders localized fallback in ES after changeLanguage', async () => {
    await i18n.changeLanguage('es')
    render(
      <ErrorBoundary>
        <Boom shouldThrow />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Error al cargar la sección.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('Retry button re-mounts children and clears the error', async () => {
    const user = userEvent.setup()

    function Harness() {
      const [shouldThrow, setShouldThrow] = useState(true)
      return (
        <>
          <button type="button" onClick={() => setShouldThrow(false)}>flip</button>
          <ErrorBoundary>
            <Boom shouldThrow={shouldThrow} />
          </ErrorBoundary>
        </>
      )
    }

    render(<Harness />)

    expect(screen.getByText(sectionLoadMessage())).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'flip' }))
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(screen.getByTestId('recovered')).toBeInTheDocument()
    expect(screen.queryByText(sectionLoadMessage())).not.toBeInTheDocument()
  })

  it('renders caller-supplied fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div data-testid="custom">custom</div>}>
        <Boom shouldThrow />
      </ErrorBoundary>,
    )
    expect(screen.getByTestId('custom')).toBeInTheDocument()
    expect(screen.queryByText(sectionLoadMessage())).not.toBeInTheDocument()
  })
})
