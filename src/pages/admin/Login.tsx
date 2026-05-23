import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdmin } from '@/hooks/useAdmin'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

export default function Login() {
  const { t } = useTranslation()
  const { login, errorKey, isSubmitting, clearError } = useAdmin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

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
        <h1 className="text-2xl font-semibold">{t('admin.login.title', { defaultValue: 'Admin Sign In' })}</h1>

        <Label className="mt-6" htmlFor="admin-login-email">
          {t('admin.login.email', { defaultValue: 'Email' })}
        </Label>
        <Input
          id="admin-login-email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={e => handleFieldChange(setEmail)(e.target.value)}
          className="mt-2"
        />

        <Label className="mt-4" htmlFor="admin-login-password">
          {t('admin.login.password', { defaultValue: 'Password' })}
        </Label>
        <Input
          id="admin-login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={e => handleFieldChange(setPassword)(e.target.value)}
          className="mt-2"
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

        <Button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="mt-6 w-full rounded-lg bg-brand-electric-blue px-4 py-3 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t('admin.login.submit', { defaultValue: 'Sign In' })}
        </Button>
      </form>
    </main>
  )
}
