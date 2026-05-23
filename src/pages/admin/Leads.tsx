import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AdminApiError,
  getAdminLeads,
  patchAdminLeadStatus,
  type AdminLeadRow,
  type AdminLeadLocale,
  type AdminLeadStatus,
} from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAdminStore } from '@/store/useAdminStore'

type LocaleSelection = AdminLeadLocale | 'all'
type StatusSelection = AdminLeadStatus | 'all'

const LOCALE_OPTIONS: ReadonlyArray<AdminLeadLocale> = ['en', 'pt-BR', 'es']
const STATUS_OPTIONS: ReadonlyArray<AdminLeadStatus> = ['pending', 'contacted', 'qualified']
const MESSAGE_PREVIEW_LIMIT = 80

const STATUS_BADGE_CLASS: Record<AdminLeadStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  contacted: 'bg-blue-100 text-blue-800',
  qualified: 'bg-green-100 text-green-800',
}

function selectionToValue<T extends string>(value: T | 'all'): T | undefined {
  return value === 'all' ? undefined : value
}

function formatCreated(value: string, language: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  try {
    return new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
  } catch {
    return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
  }
}

function MessageCell({ value }: { value: string | null }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  if (!value) return <span aria-hidden="true">{t('admin.leads.messagePreview.none', { defaultValue: '—' })}</span>
  const needsToggle = value.length > MESSAGE_PREVIEW_LIMIT
  if (!needsToggle) return <span>{value}</span>
  const preview = value.slice(0, MESSAGE_PREVIEW_LIMIT)
  return (
    <span>
      <span>{expanded ? value : `${preview}…`}</span>{' '}
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="text-xs font-medium text-brand-electric-blue underline underline-offset-2 hover:opacity-80"
      >
        {expanded ? t('admin.leads.messagePreview.less', { defaultValue: 'Show less' }) : t('admin.leads.messagePreview.more', { defaultValue: 'Show more' })}
      </button>
    </span>
  )
}

type StatusErrorKey =
  | 'admin.leads.statusUpdate.errors.invalidStatus'
  | 'admin.leads.statusUpdate.errors.notFound'
  | 'admin.leads.statusUpdate.errors.generic'

function mapStatusError(err: AdminApiError): StatusErrorKey {
  if (err.status === 400 && err.field === 'status') {
    return 'admin.leads.statusUpdate.errors.invalidStatus'
  }
  if (err.status === 404) {
    return 'admin.leads.statusUpdate.errors.notFound'
  }
  return 'admin.leads.statusUpdate.errors.generic'
}

export default function Leads() {
  const { t, i18n } = useTranslation()
  const clearSession = useAdminStore(state => state.clearSession)

  const [localeFilter, setLocaleFilter] = useState<LocaleSelection>('all')
  const [statusFilter, setStatusFilter] = useState<StatusSelection>('all')
  const [rows, setRows] = useState<AdminLeadRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)
  const [pendingRowIds, setPendingRowIds] = useState<ReadonlySet<number>>(() => new Set())
  const [rowErrorKeys, setRowErrorKeys] = useState<ReadonlyMap<number, StatusErrorKey>>(
    () => new Map()
  )

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    setLoading(true)
    setErrorKey(null)

    const fetchLeads = async () => {
      try {
        const filter: { locale?: AdminLeadLocale; status?: AdminLeadStatus } = {}
        const localeArg = selectionToValue(localeFilter)
        const statusArg = selectionToValue(statusFilter)
        if (localeArg) filter.locale = localeArg
        if (statusArg) filter.status = statusArg
        const data = await getAdminLeads(filter, { signal: controller.signal })
        if (cancelled || controller.signal.aborted) return
        setRows(data)
        setLoading(false)
      } catch (err) {
        if (cancelled || controller.signal.aborted) return
        if (err instanceof AdminApiError && err.status === 401) {
          setLoading(false)
          setRows(null)
          clearSession()
          return
        }
        setRows(null)
        setErrorKey('admin.leads.errors.load')
        setLoading(false)
      }
    }

    void fetchLeads()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [localeFilter, statusFilter, refetchToken, clearSession])

  const filtersActive = localeFilter !== 'all' || statusFilter !== 'all'

  const handleClearFilters = useCallback(() => {
    setLocaleFilter('all')
    setStatusFilter('all')
  }, [])

  const handleRetry = useCallback(() => {
    setRefetchToken(token => token + 1)
  }, [])

  const markPending = useCallback((id: number, isPending: boolean) => {
    setPendingRowIds(prev => {
      const next = new Set(prev)
      if (isPending) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const setRowError = useCallback((id: number, key: StatusErrorKey | null) => {
    setRowErrorKeys(prev => {
      const next = new Map(prev)
      if (key === null) next.delete(id)
      else next.set(id, key)
      return next
    })
  }, [])

  const handleStatusChange = useCallback(
    async (rowId: number, previousStatus: AdminLeadStatus, nextStatus: AdminLeadStatus) => {
      if (nextStatus === previousStatus) return
      setRows(prev =>
        prev
          ? prev.map(r => (r.id === rowId ? { ...r, status: nextStatus } : r))
          : prev
      )
      markPending(rowId, true)
      setRowError(rowId, null)

      try {
        const updated = await patchAdminLeadStatus(rowId, nextStatus)
        setRows(prev => {
          if (!prev) return prev
          const localeMatches = localeFilter === 'all' || updated.locale === localeFilter
          const statusMatches = statusFilter === 'all' || updated.status === statusFilter
          if (!localeMatches || !statusMatches) {
            return prev.filter(r => r.id !== rowId)
          }
          return prev.map(r => (r.id === rowId ? updated : r))
        })
      } catch (err) {
        if (err instanceof AdminApiError && err.status === 401) {
          clearSession()
          return
        }
        setRows(prev =>
          prev
            ? prev.map(r => (r.id === rowId ? { ...r, status: previousStatus } : r))
            : prev
        )
        const errorKeyForRow =
          err instanceof AdminApiError
            ? mapStatusError(err)
            : 'admin.leads.statusUpdate.errors.generic'
        setRowError(rowId, errorKeyForRow)
      } finally {
        markPending(rowId, false)
      }
    },
    [clearSession, localeFilter, markPending, setRowError, statusFilter]
  )

  const language = i18n.language || 'en'

  const tableBody = useMemo(() => {
    if (!rows) return null
    return rows.map(row => {
      const isPending = pendingRowIds.has(row.id)
      const rowErrorKey = rowErrorKeys.get(row.id) ?? null
      return (
        <tr
          key={row.id}
          aria-busy={isPending || undefined}
          data-testid={`lead-row-${row.id}`}
          className="border-t border-white/10"
        >
          <td className="px-3 py-2 align-top">{row.name}</td>
          <td className="px-3 py-2 align-top">{row.company}</td>
          <td className="px-3 py-2 align-top">{row.email}</td>
          <td className="px-3 py-2 align-top">{row.gds}</td>
          <td className="px-3 py-2 align-top">{row.role}</td>
          <td className="px-3 py-2 align-top">{t(`admin.leads.locale.${row.locale}`)}</td>
          <td className="px-3 py-2 align-top">
            <div className="flex flex-col gap-2">
              <span
                data-testid={`lead-status-${row.id}`}
                className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE_CLASS[row.status]}`}
              >
                {t(`admin.leads.status.${row.status}`)}
              </span>
              <select
                data-testid={`lead-status-select-${row.id}`}
                aria-label={t('admin.leads.statusUpdate.label', { defaultValue: 'Update status' })}
                aria-busy={isPending || undefined}
                disabled={isPending}
                value={row.status}
                onChange={e =>
                  void handleStatusChange(
                    row.id,
                    row.status,
                    e.target.value as AdminLeadStatus
                  )
                }
                className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option} value={option}>
                    {t(`admin.leads.status.${option}`)}
                  </option>
                ))}
              </select>
              {rowErrorKey ? (
                <p
                  role="alert"
                  data-testid={`lead-status-error-${row.id}`}
                  className="text-xs text-red-200"
                >
                  {t(rowErrorKey)}
                </p>
              ) : null}
            </div>
          </td>
          <td className="px-3 py-2 align-top">{formatCreated(row.created_at, language)}</td>
          <td className="px-3 py-2 align-top max-w-md">
            <MessageCell value={row.message} />
          </td>
        </tr>
      )
    })
  }, [rows, t, language, pendingRowIds, rowErrorKeys, handleStatusChange])

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold">{t('admin.leads.title', { defaultValue: 'Leads' })}</h1>

        <div className="mt-6 flex flex-wrap items-end gap-4">
          <div>
            <Label htmlFor="admin-leads-locale-filter" className="text-white/70">
              {t('admin.leads.filters.locale', { defaultValue: 'Locale' })}
            </Label>
            <select
              id="admin-leads-locale-filter"
              data-testid="admin-leads-locale-filter"
              value={localeFilter}
              onChange={e => setLocaleFilter(e.target.value as LocaleSelection)}
              className="mt-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
            >
              <option value="all">{t('admin.leads.filters.localeAll', { defaultValue: 'All locales' })}</option>
              {LOCALE_OPTIONS.map(loc => (
                <option key={loc} value={loc}>
                  {t(`admin.leads.locale.${loc}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="admin-leads-status-filter" className="text-white/70">
              {t('admin.leads.filters.status', { defaultValue: 'Status' })}
            </Label>
            <select
              id="admin-leads-status-filter"
              data-testid="admin-leads-status-filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as StatusSelection)}
              className="mt-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
            >
              <option value="all">{t('admin.leads.filters.statusAll', { defaultValue: 'All statuses' })}</option>
              {STATUS_OPTIONS.map(st => (
                <option key={st} value={st}>
                  {t(`admin.leads.status.${st}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-8">
          {errorKey ? (
            <div
              role="alert"
              data-testid="admin-leads-error"
              className="rounded-lg border border-red-300/40 bg-red-500/10 p-4 text-sm text-red-100"
            >
              <p>{t(errorKey)}</p>
              <Button
                type="button"
                data-testid="admin-leads-retry"
                onClick={handleRetry}
                className="mt-3 bg-white text-brand-navy hover:opacity-90"
              >
                {t('admin.leads.errors.retry', { defaultValue: 'Retry' })}
              </Button>
            </div>
          ) : loading ? (
            <div
              role="status"
              aria-busy="true"
              aria-label="Loading leads"
              data-testid="admin-leads-loading"
              className="space-y-3"
            >
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : rows && rows.length === 0 ? (
            <div data-testid="admin-leads-empty" className="rounded-lg border border-white/10 bg-white/5 p-6 text-sm text-white/80">
              <p>{filtersActive ? t('admin.leads.empty.filtered', { defaultValue: 'No leads match this filter.' }) : t('admin.leads.empty.title', { defaultValue: 'No leads yet. Demo requests will appear here.' })}</p>
              {filtersActive ? (
                <Button
                  type="button"
                  data-testid="admin-leads-clear-filters"
                  onClick={handleClearFilters}
                  className="mt-4 bg-white text-brand-navy hover:opacity-90"
                >
                  {t('admin.leads.filters.clear', { defaultValue: 'Clear filters' })}
                </Button>
              ) : null}
            </div>
          ) : rows ? (
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table data-testid="admin-leads-table" className="min-w-full text-left text-sm text-white">
                <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/70">
                  <tr>
                    <th scope="col" className="px-3 py-2">{t('admin.leads.columns.name', { defaultValue: 'Name' })}</th>
                    <th scope="col" className="px-3 py-2">{t('admin.leads.columns.company', { defaultValue: 'Company' })}</th>
                    <th scope="col" className="px-3 py-2">{t('admin.leads.columns.email', { defaultValue: 'Email' })}</th>
                    <th scope="col" className="px-3 py-2">{t('admin.leads.columns.gds', { defaultValue: 'GDS' })}</th>
                    <th scope="col" className="px-3 py-2">{t('admin.leads.columns.role', { defaultValue: 'Role' })}</th>
                    <th scope="col" className="px-3 py-2">{t('admin.leads.columns.locale', { defaultValue: 'Locale' })}</th>
                    <th scope="col" className="px-3 py-2">{t('admin.leads.columns.status', { defaultValue: 'Status' })}</th>
                    <th scope="col" className="px-3 py-2">{t('admin.leads.columns.created', { defaultValue: 'Created' })}</th>
                    <th scope="col" className="px-3 py-2">{t('admin.leads.columns.message', { defaultValue: 'Message' })}</th>
                  </tr>
                </thead>
                <tbody>{tableBody}</tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  )
}
