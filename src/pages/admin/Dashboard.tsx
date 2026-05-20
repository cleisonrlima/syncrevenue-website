import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AdminApiError,
  getAdminDashboardStats,
  type AdminDashboardStats,
} from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAdminStore } from '@/store/useAdminStore'

export default function Dashboard() {
  const { t } = useTranslation()
  const clearSession = useAdminStore((state) => state.clearSession)
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    setLoading(true)
    setErrorKey(null)

    const run = async () => {
      try {
        const data = await getAdminDashboardStats({ signal: controller.signal })
        if (cancelled || controller.signal.aborted) return
        setStats(data)
        setLoading(false)
      } catch (err) {
        if (cancelled || controller.signal.aborted) return
        if (err instanceof AdminApiError && err.status === 401) {
          setLoading(false)
          setStats(null)
          clearSession()
          return
        }
        setStats(null)
        setErrorKey('admin.dashboard.errors.load')
        setLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [refetchToken, clearSession])

  const handleRetry = useCallback(() => {
    setRefetchToken((token) => token + 1)
  }, [])

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold">
          {t('admin.dashboard.title', { defaultValue: 'Admin Dashboard' })}
        </h1>

        {errorKey ? (
          <div
            role="alert"
            data-testid="admin-dashboard-error"
            className="mt-8 rounded-lg border border-red-300/40 bg-red-500/10 p-4 text-sm text-red-100"
          >
            <p>{t(errorKey)}</p>
            <Button
              type="button"
              data-testid="admin-dashboard-retry"
              onClick={handleRetry}
              className="mt-3 bg-white text-brand-navy hover:opacity-90"
            >
              {t('admin.dashboard.errors.retry', { defaultValue: 'Retry' })}
            </Button>
          </div>
        ) : loading ? (
          <div
            data-testid="admin-dashboard-loading"
            className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : stats ? (
          <div
            data-testid="admin-dashboard-stats"
            className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            <section
              data-testid="admin-dashboard-card-total"
              aria-label={`${t('admin.dashboard.stats.total', { defaultValue: 'Total leads' })}: ${stats.totalLeads}`}
              className="rounded-lg border border-white/10 bg-white/5 p-4"
            >
              <p className="text-xs uppercase tracking-wide text-white/60">
                {t('admin.dashboard.stats.total', { defaultValue: 'Total leads' })}
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">{stats.totalLeads}</p>
            </section>
            <section
              data-testid="admin-dashboard-card-pending"
              aria-label={`${t('admin.dashboard.stats.pending', { defaultValue: 'Pending leads' })}: ${stats.pendingLeads}`}
              className="rounded-lg border border-white/10 bg-white/5 p-4"
            >
              <p className="text-xs uppercase tracking-wide text-white/60">
                {t('admin.dashboard.stats.pending', { defaultValue: 'Pending leads' })}
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">{stats.pendingLeads}</p>
            </section>
            <section
              data-testid="admin-dashboard-card-thisweek"
              aria-label={`${t('admin.dashboard.stats.thisWeek', { defaultValue: 'New this week' })}: ${stats.leadsThisWeek}`}
              className="rounded-lg border border-white/10 bg-white/5 p-4"
            >
              <p className="text-xs uppercase tracking-wide text-white/60">
                {t('admin.dashboard.stats.thisWeek', { defaultValue: 'New this week' })}
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">{stats.leadsThisWeek}</p>
            </section>
            <section
              data-testid="admin-dashboard-card-bylocale"
              aria-label={`${t('admin.dashboard.stats.byLocale', { defaultValue: 'Leads by language' })}: ${t('admin.dashboard.stats.locale.en', { defaultValue: 'English' })}: ${stats.leadsByLocale.en}, ${t('admin.dashboard.stats.locale.pt-BR', { defaultValue: 'Portuguese (BR)' })}: ${stats.leadsByLocale['pt-BR']}, ${t('admin.dashboard.stats.locale.es', { defaultValue: 'Spanish' })}: ${stats.leadsByLocale.es}`}
              className="rounded-lg border border-white/10 bg-white/5 p-4"
            >
              <p className="text-xs uppercase tracking-wide text-white/60">
                {t('admin.dashboard.stats.byLocale', { defaultValue: 'Leads by language' })}
              </p>
              <dl className="mt-2 space-y-1 text-sm text-white">
                <div
                  data-testid="admin-dashboard-locale-en"
                  className="flex items-center justify-between"
                >
                  <dt className="text-white/70">
                    {t('admin.dashboard.stats.locale.en', { defaultValue: 'English' })}
                  </dt>
                  <dd className="font-semibold">{stats.leadsByLocale.en}</dd>
                </div>
                <div
                  data-testid="admin-dashboard-locale-pt-BR"
                  className="flex items-center justify-between"
                >
                  <dt className="text-white/70">
                    {t('admin.dashboard.stats.locale.pt-BR', { defaultValue: 'Portuguese (BR)' })}
                  </dt>
                  <dd className="font-semibold">{stats.leadsByLocale['pt-BR']}</dd>
                </div>
                <div
                  data-testid="admin-dashboard-locale-es"
                  className="flex items-center justify-between"
                >
                  <dt className="text-white/70">
                    {t('admin.dashboard.stats.locale.es', { defaultValue: 'Spanish' })}
                  </dt>
                  <dd className="font-semibold">{stats.leadsByLocale.es}</dd>
                </div>
              </dl>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  )
}
