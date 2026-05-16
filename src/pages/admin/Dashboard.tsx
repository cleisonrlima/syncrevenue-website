import { useTranslation } from 'react-i18next'
import { useAdmin } from '@/hooks/useAdmin'

export default function Dashboard() {
  const { t } = useTranslation()
  const { logout, email } = useAdmin()

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold">{t('admin.dashboard.title')}</h1>
        {email ? (
          <p className="mt-2 text-sm text-white/70" data-testid="admin-dashboard-email">
            {email}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-8 rounded-lg border border-white/30 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
          data-testid="admin-logout"
        >
          {t('admin.logout')}
        </button>
      </div>
    </main>
  )
}
