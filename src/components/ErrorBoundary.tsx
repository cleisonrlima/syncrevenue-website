import { Component, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

function FallbackUI({ onReset }: { onReset: () => void }) {
  const { t } = useTranslation()
  return (
    <div
      role="alert"
      className="min-h-[300px] flex flex-col items-center justify-center gap-4 text-brand-muted text-sm"
    >
      <p>{t('errors.sectionLoad', { defaultValue: 'Failed to load section.' })}</p>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center px-4 py-2 rounded-md text-sm font-semibold bg-brand-deep text-white transition-[filter] duration-150 ease-out hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-deep focus-visible:ring-offset-2"
      >
        {t('errors.retry', { defaultValue: 'Retry' })}
      </button>
    </div>
  )
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo.componentStack)
  }

  reset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <FallbackUI onReset={this.reset} />
    }
    return this.props.children
  }
}
