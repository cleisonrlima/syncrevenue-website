import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { useTranslation } from 'react-i18next'
import {
  AdminApiError,
  getAdminTeam,
  postAdminTeam,
  putAdminTeam,
  type AdminTeamMemberRow,
} from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAdminStore } from '@/store/useAdminStore'
import {
  createAdminTeamSchema,
  initialFormValues,
  type AdminTeamFormValues,
} from '@/lib/team-schema'

type Mode = { kind: 'list' } | { kind: 'create' } | { kind: 'edit'; id: number }
type FieldErrors = Partial<Record<keyof AdminTeamFormValues, string>>

const INPUT_CLASS =
  'mt-2 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
const TEXTAREA_CLASS = `${INPUT_CLASS} min-h-[6rem]`

function rowToFormValues(row: AdminTeamMemberRow): AdminTeamFormValues {
  return {
    name: row.name,
    role_en: row.role_en,
    role_pt: row.role_pt,
    role_es: row.role_es,
    bio_en: row.bio_en,
    bio_pt: row.bio_pt,
    bio_es: row.bio_es,
    experience_en: row.experience_en,
    experience_pt: row.experience_pt,
    experience_es: row.experience_es,
    linkedin: row.linkedin ?? '',
    photo_url: row.photo_url ?? '',
    order_index: String(row.order_index),
  }
}

interface TeamMemberFormProps {
  initialValues: AdminTeamFormValues
  submitLabel: string
  isSubmitting: boolean
  formError: string | null
  onSubmit: (values: AdminTeamFormValues) => Promise<FieldErrors | null>
  onCancel: () => void
}

function TeamMemberForm({
  initialValues,
  submitLabel,
  isSubmitting,
  formError,
  onSubmit,
  onCancel,
}: TeamMemberFormProps) {
  const { t } = useTranslation()
  const schema = useMemo(() => createAdminTeamSchema(t), [t])
  const [values, setValues] = useState<AdminTeamFormValues>(initialValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const fieldRefs = useRef<Partial<Record<keyof AdminTeamFormValues, HTMLInputElement | HTMLTextAreaElement | null>>>({})

  const setField = useCallback(
    (field: keyof AdminTeamFormValues) =>
      (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = event.target.value
        setValues((current) => ({ ...current, [field]: value }))
        if (errors[field]) {
          setErrors((current) => {
            const next = { ...current }
            delete next[field]
            return next
          })
        }
      },
    [errors]
  )

  const handleBlur = useCallback(
    (field: keyof AdminTeamFormValues) => () => {
      const result = schema.safeParse(values)
      if (result.success) {
        if (errors[field]) {
          setErrors((current) => {
            const next = { ...current }
            delete next[field]
            return next
          })
        }
        return
      }
      const issue = result.error.issues.find((i) => i.path[0] === field)
      setErrors((current) => ({
        ...current,
        [field]: issue ? issue.message : current[field],
      }))
    },
    [schema, values, errors]
  )

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const result = schema.safeParse(values)
      if (!result.success) {
        const nextErrors: FieldErrors = {}
        for (const issue of result.error.issues) {
          const field = issue.path[0] as keyof AdminTeamFormValues
          if (!nextErrors[field]) {
            nextErrors[field] = issue.message
          }
        }
        setErrors(nextErrors)
        const firstField = result.error.issues[0]?.path[0] as keyof AdminTeamFormValues | undefined
        if (firstField) fieldRefs.current[firstField]?.focus()
        return
      }
      const remoteErrors = await onSubmit(values)
      if (remoteErrors) {
        setErrors((current) => ({ ...current, ...remoteErrors }))
        const firstRemoteField = Object.keys(remoteErrors)[0] as
          | keyof AdminTeamFormValues
          | undefined
        if (firstRemoteField) fieldRefs.current[firstRemoteField]?.focus()
      }
    },
    [schema, values, onSubmit]
  )

  const renderInput = (
    field: keyof AdminTeamFormValues,
    options: { type?: string; required?: boolean; placeholderKey?: string } = {}
  ) => {
    const errorKey = errors[field]
    const labelKey = `admin.team.form.labels.${field}` as const
    const placeholder = options.placeholderKey ? t(options.placeholderKey) : undefined
    return (
      <div>
        <Label htmlFor={`team-form-${field}`} className="text-white/80">
          {t(labelKey)}
          {options.required ? (
            <span aria-hidden="true" className="ml-1 text-red-300">
              *
            </span>
          ) : null}
        </Label>
        <input
          id={`team-form-${field}`}
          ref={(node) => {
            fieldRefs.current[field] = node
          }}
          type={options.type ?? 'text'}
          value={values[field]}
          onChange={setField(field)}
          onBlur={handleBlur(field)}
          placeholder={placeholder}
          aria-invalid={Boolean(errorKey) || undefined}
          aria-describedby={errorKey ? `team-form-${field}-error` : undefined}
          className={INPUT_CLASS}
          data-testid={`team-form-${field}`}
        />
        {errorKey ? (
          <p
            id={`team-form-${field}-error`}
            data-testid={`team-form-${field}-error`}
            role="alert"
            className="mt-1 text-xs text-red-200"
          >
            {t(errorKey, { defaultValue: errorKey })}
          </p>
        ) : null}
      </div>
    )
  }

  const renderTextarea = (field: keyof AdminTeamFormValues) => {
    const errorKey = errors[field]
    return (
      <div>
        <Label htmlFor={`team-form-${field}`} className="text-white/80">
          {t(`admin.team.form.labels.${field}` as const)}
          <span aria-hidden="true" className="ml-1 text-red-300">
            *
          </span>
        </Label>
        <textarea
          id={`team-form-${field}`}
          ref={(node) => {
            fieldRefs.current[field] = node
          }}
          value={values[field]}
          onChange={setField(field)}
          onBlur={handleBlur(field)}
          aria-invalid={Boolean(errorKey) || undefined}
          aria-describedby={errorKey ? `team-form-${field}-error` : undefined}
          className={TEXTAREA_CLASS}
          data-testid={`team-form-${field}`}
        />
        {errorKey ? (
          <p
            id={`team-form-${field}-error`}
            data-testid={`team-form-${field}-error`}
            role="alert"
            className="mt-1 text-xs text-red-200"
          >
            {t(errorKey, { defaultValue: errorKey })}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mt-6 space-y-4 rounded-lg border border-white/10 bg-white/5 p-6"
      data-testid="team-form"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {renderInput('name', { required: true })}
        {renderInput('order_index', { required: true, type: 'number' })}
        {renderInput('role_en', { required: true })}
        {renderInput('role_pt', { required: true })}
        {renderInput('role_es', { required: true })}
        {renderInput('experience_en', { required: true })}
        {renderInput('experience_pt', { required: true })}
        {renderInput('experience_es', { required: true })}
        {renderInput('linkedin', { placeholderKey: 'admin.team.form.placeholders.linkedin' })}
        {renderInput('photo_url', { placeholderKey: 'admin.team.form.placeholders.photo_url' })}
      </div>
      <div className="grid grid-cols-1 gap-4">
        {renderTextarea('bio_en')}
        {renderTextarea('bio_pt')}
        {renderTextarea('bio_es')}
      </div>
      {formError ? (
        <p role="alert" data-testid="team-form-error" className="text-sm text-red-200">
          {formError}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-white text-brand-navy hover:opacity-90"
          data-testid="team-form-submit"
        >
          {submitLabel}
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="bg-white/10 text-white hover:bg-white/20"
          data-testid="team-form-cancel"
        >
          {t('admin.team.form.cancel')}
        </Button>
      </div>
    </form>
  )
}

export default function Team() {
  const { t } = useTranslation()
  const clearSession = useAdminStore((state) => state.clearSession)
  const [rows, setRows] = useState<AdminTeamMemberRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [refetchToken, setRefetchToken] = useState(0)
  const [mode, setMode] = useState<Mode>({ kind: 'list' })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    setLoading(true)
    setErrorKey(null)

    const run = async () => {
      try {
        const data = await getAdminTeam({ signal: controller.signal })
        if (cancelled || controller.signal.aborted) return
        setRows(data)
      } catch (err) {
        if (cancelled || controller.signal.aborted) return
        if (err instanceof AdminApiError && err.status === 401) {
          setRows(null)
          clearSession()
          return
        }
        setRows(null)
        setErrorKey('admin.team.errors.load')
      } finally {
        if (!cancelled && !controller.signal.aborted) {
          setLoading(false)
        }
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

  const handleAddClick = useCallback(() => {
    setFormError(null)
    setMode({ kind: 'create' })
  }, [])

  const handleEditClick = useCallback((id: number) => {
    setFormError(null)
    setMode({ kind: 'edit', id })
  }, [])

  const handleCancel = useCallback(() => {
    setFormError(null)
    setMode({ kind: 'list' })
  }, [])

  const handleApiError = useCallback(
    (err: unknown): FieldErrors | null => {
      if (err instanceof AdminApiError && err.status === 401) {
        clearSession()
        return null
      }
      if (err instanceof AdminApiError && err.status === 400 && err.field) {
        const key = err.field as keyof AdminTeamFormValues
        let message: string
        if (key === 'linkedin' || key === 'photo_url') {
          message = 'admin.team.form.errors.url'
        } else if (key === 'order_index') {
          message = 'admin.team.form.errors.orderIndex'
        } else {
          message = 'admin.team.form.errors.required'
        }
        return { [key]: message } as FieldErrors
      }
      setFormError('admin.team.form.errors.generic')
      return null
    },
    [clearSession]
  )

  const handleCreate = useCallback(
    async (values: AdminTeamFormValues): Promise<FieldErrors | null> => {
      setSubmitting(true)
      setFormError(null)
      try {
        const schema = createAdminTeamSchema(t)
        const parsed = schema.safeParse(values)
        if (!parsed.success) return null
        const created = await postAdminTeam(parsed.data)
        setRows((prev) => (prev ? [created, ...prev] : [created]))
        setMode({ kind: 'list' })
        return null
      } catch (err) {
        return handleApiError(err)
      } finally {
        setSubmitting(false)
      }
    },
    [t, handleApiError]
  )

  const handleEdit = useCallback(
    (id: number) =>
      async (values: AdminTeamFormValues): Promise<FieldErrors | null> => {
        setSubmitting(true)
        setFormError(null)
        try {
          const schema = createAdminTeamSchema(t)
          const parsed = schema.safeParse(values)
          if (!parsed.success) return null
          const updated = await putAdminTeam(id, parsed.data)
          setRows((prev) => (prev ? prev.map((r) => (r.id === id ? updated : r)) : prev))
          setMode({ kind: 'list' })
          return null
        } catch (err) {
          return handleApiError(err)
        } finally {
          setSubmitting(false)
        }
      },
    [t, handleApiError]
  )

  const tableBody = useMemo(() => {
    if (!rows) return null
    return rows.map((row) => (
      <tr
        key={row.id}
        data-testid={`team-row-${row.id}`}
        className="border-t border-white/10"
      >
        <td className="px-3 py-2 align-top">{row.name}</td>
        <td className="px-3 py-2 align-top">{row.role_en}</td>
        <td className="px-3 py-2 align-top">
          <span
            data-testid={`team-active-${row.id}`}
            className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
              row.active === 1
                ? 'bg-green-100 text-green-800'
                : 'bg-white/10 text-white/60'
            }`}
          >
            {t(row.active === 1 ? 'admin.team.active.yes' : 'admin.team.active.no')}
          </span>
        </td>
        <td className="px-3 py-2 align-top">{row.order_index}</td>
        <td className="px-3 py-2 align-top">
          <Button
            type="button"
            onClick={() => handleEditClick(row.id)}
            data-testid={`team-edit-${row.id}`}
            className="bg-white/10 text-white hover:bg-white/20"
          >
            {t('admin.team.actions.edit')}
          </Button>
        </td>
      </tr>
    ))
  }, [rows, t, handleEditClick])

  const editingRow =
    mode.kind === 'edit' && rows ? rows.find((row) => row.id === mode.id) : undefined

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold">{t('admin.team.title')}</h1>
          {mode.kind === 'list' && !loading && !errorKey ? (
            <Button
              type="button"
              onClick={handleAddClick}
              data-testid="team-add"
              className="bg-white text-brand-navy hover:opacity-90"
            >
              {t('admin.team.add')}
            </Button>
          ) : null}
        </div>

        <div className="mt-8">
          {errorKey ? (
            <div
              role="alert"
              data-testid="admin-team-error"
              className="rounded-lg border border-red-300/40 bg-red-500/10 p-4 text-sm text-red-100"
            >
              <p>{t(errorKey)}</p>
              <Button
                type="button"
                data-testid="admin-team-retry"
                onClick={handleRetry}
                className="mt-3 bg-white text-brand-navy hover:opacity-90"
              >
                {t('admin.team.errors.retry')}
              </Button>
            </div>
          ) : loading ? (
            <div
              role="status"
              aria-busy="true"
              aria-label="Loading team members"
              data-testid="admin-team-loading"
              className="space-y-3"
            >
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : mode.kind === 'create' ? (
            <>
              <h2 className="text-xl font-semibold">{t('admin.team.form.title.create')}</h2>
              <TeamMemberForm
                initialValues={initialFormValues}
                submitLabel={t('admin.team.form.submit.create')}
                isSubmitting={submitting}
                formError={formError ? t(formError) : null}
                onSubmit={handleCreate}
                onCancel={handleCancel}
              />
            </>
          ) : mode.kind === 'edit' && editingRow ? (
            <>
              <h2 className="text-xl font-semibold">{t('admin.team.form.title.edit')}</h2>
              <TeamMemberForm
                initialValues={rowToFormValues(editingRow)}
                submitLabel={t('admin.team.form.submit.edit')}
                isSubmitting={submitting}
                formError={formError ? t(formError) : null}
                onSubmit={handleEdit(editingRow.id)}
                onCancel={handleCancel}
              />
            </>
          ) : rows && rows.length === 0 ? (
            <div
              data-testid="admin-team-empty"
              className="rounded-lg border border-white/10 bg-white/5 p-6 text-sm text-white/80"
            >
              <p>{t('admin.team.empty')}</p>
            </div>
          ) : rows ? (
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table
                data-testid="admin-team-table"
                className="min-w-full text-left text-sm text-white"
              >
                <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/70">
                  <tr>
                    <th scope="col" className="px-3 py-2">
                      {t('admin.team.columns.name')}
                    </th>
                    <th scope="col" className="px-3 py-2">
                      {t('admin.team.columns.role')}
                    </th>
                    <th scope="col" className="px-3 py-2">
                      {t('admin.team.columns.active')}
                    </th>
                    <th scope="col" className="px-3 py-2">
                      {t('admin.team.columns.order')}
                    </th>
                    <th scope="col" className="px-3 py-2">
                      {t('admin.team.columns.actions')}
                    </th>
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
