import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdmin } from '@/hooks/useAdmin'

export default function Login() {
  const { t } = useTranslation()
  const { login, errorKey, isSubmitting, clearError } = useAdmin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const inputClasses =
    'mt-2 w-full rounded-lg border border-brand-slate/25 bg-white px-4 py-3 text-base text-brand-navy shadow-sm min-h-11 placeholder:text-brand-slate/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-electric-blue'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return
    await login(email, password)
  }

  function handleFieldChange(setter: (value: string) => void) {
    return (value: string) => {
      setter(value)
      if (errorKey) clearError()
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16 bg-brand-navy">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 text-brand-navy shadow-xl"
        noValidate
      >
        <h1 className="text-2xl font-semibold">{t('admin.login.title')}</h1>

        <label className="mt-6 block text-sm font-medium" htmlFor="admin-login-email">
          {t('admin.login.email')}
        </label>
        <input
          id="admin-login-email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={e => handleFieldChange(setEmail)(e.target.value)}
          className={inputClasses}
        />

        <label className="mt-4 block text-sm font-medium" htmlFor="admin-login-password">
          {t('admin.login.password')}
        </label>
        <input
          id="admin-login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={e => handleFieldChange(setPassword)(e.target.value)}
          className={inputClasses}
        />

        {errorKey ? (
          <p
            role="alert"
            aria-live="polite"
            className="mt-4 text-sm font-medium text-destructive"
            data-testid="admin-login-error"
          >
            {t(errorKey)}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="mt-6 w-full rounded-lg bg-brand-electric-blue px-4 py-3 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t('admin.login.submit')}
        </button>
      </form>
    </main>
  )
}
