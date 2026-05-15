import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import {
  useDemo,
  createDemoSchema,
  GDS_OPTIONS,
  ROLE_OPTIONS,
  type DemoFormValues,
} from '@/hooks/useDemo'
import { useLocaleStore } from '@/store/useLocaleStore'
import GradientButton from '@/components/ui/GradientButton'
import Toast from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

type FieldName = keyof Pick<DemoFormValues, 'name' | 'email' | 'company' | 'role' | 'gds'>
type FieldErrors = Partial<Record<FieldName, string>>
const FIELD_NAMES: FieldName[] = ['name', 'email', 'company', 'role', 'gds']

const initialValues: DemoFormValues = {
  name: '',
  email: '',
  company: '',
  phone: '',
  role: '',
  gds: '',
  message: '',
  locale: 'en',
}

function textInputClasses(hasError: boolean) {
  return cn(
    'mt-2 w-full rounded-lg border bg-white px-4 py-3 text-base text-brand-navy shadow-sm',
    'placeholder:text-brand-slate/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-electric-blue',
    hasError ? 'border-destructive' : 'border-brand-slate/25'
  )
}

export type DemoFormHandle = {
  focusFirstField: () => void
}

const DemoForm = forwardRef<DemoFormHandle>(function DemoForm(_props, ref) {
  const { t } = useTranslation()
  const locale = useLocaleStore(state => state.locale)
  const { status, error, isSubmitting, submitDemo } = useDemo()
  const [values, setValues] = useState<DemoFormValues>({ ...initialValues, locale })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [toast, setToast] = useState<string | null>(null)
  const nameInputRef = useRef<HTMLInputElement | null>(null)
  const successRef = useRef<HTMLDivElement | null>(null)
  const demoSchema = useMemo(() => createDemoSchema(t), [t])

  useImperativeHandle(
    ref,
    () => ({
      focusFirstField: () => {
        nameInputRef.current?.focus()
      },
    }),
    []
  )

  useEffect(() => {
    setValues(current => ({ ...current, locale }))
  }, [locale])

  useEffect(() => {
    if (status === 'success') {
      successRef.current?.focus()
    }
  }, [status])

  useEffect(() => {
    if (status === 'error' && error?.status !== 429) {
      setToast(t('forms.demo.errorGeneric'))
    }
  }, [error, status, t])

  const validateAll = useCallback(
    (nextValues: DemoFormValues): FieldErrors => {
      const result = demoSchema.safeParse(nextValues)
      if (result.success) {
        return {}
      }

      return result.error.issues.reduce<FieldErrors>((nextErrors, issue) => {
        const field = issue.path[0]
        if (typeof field === 'string' && FIELD_NAMES.includes(field as FieldName)) {
          nextErrors[field as FieldName] ??= issue.message
        }
        return nextErrors
      }, {})
    },
    [demoSchema]
  )

  useEffect(() => {
    setErrors(current => {
      const visibleFields = FIELD_NAMES.filter(field => current[field])
      if (visibleFields.length === 0) {
        return current
      }

      const nextErrors = validateAll(values)
      return visibleFields.reduce<FieldErrors>((updatedErrors, field) => {
        updatedErrors[field] = nextErrors[field]
        return updatedErrors
      }, {})
    })
  }, [validateAll, values])

  function validateField(name: FieldName, nextValues = values): string | undefined {
    return validateAll(nextValues)[name]
  }

  function hasErrors(nextErrors: FieldErrors) {
    return FIELD_NAMES.some(field => Boolean(nextErrors[field]))
  }

  function handleBlur(field: FieldName) {
    setErrors(current => {
      const nextError = validateField(field)
      if (current[field] === nextError) {
        return current
      }
      return {
        ...current,
        [field]: nextError,
      }
    })
  }

  function setField(name: keyof DemoFormValues, value: string) {
    setValues(current => {
      const nextValues = { ...current, [name]: value }

      if (FIELD_NAMES.includes(name as FieldName)) {
        const fieldName = name as FieldName
        setErrors(currentErrors =>
          currentErrors[fieldName] === undefined
            ? currentErrors
            : { ...currentErrors, [fieldName]: validateField(fieldName, nextValues) }
        )
      }

      return nextValues
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextValues = { ...values, locale: useLocaleStore.getState().locale }
    const nextErrors = validateAll(nextValues)
    setErrors(nextErrors)

    if (hasErrors(nextErrors)) {
      return
    }

    setToast(null)
    await submitDemo(nextValues)
  }

  const canSubmit = demoSchema.safeParse(values).success && !isSubmitting

  if (status === 'success') {
    return (
      <div
        id="demo-form"
        ref={successRef}
        role="status"
        aria-live="polite"
        tabIndex={-1}
        className="rounded-lg border border-brand-electric-blue/20 bg-white p-8 text-center shadow-sm"
      >
        <h3 className="text-2xl font-bold text-brand-navy">{t('forms.demo.successTitle')}</h3>
        <p className="mt-3 text-base leading-7 text-brand-slate">{t('forms.demo.successBody')}</p>
      </div>
    )
  }

  return (
    <div id="demo-form">
      <form
        aria-label={t('forms.demo.title')}
        className="grid gap-5 rounded-lg border border-brand-slate/20 bg-white p-6 shadow-sm sm:p-8"
        onSubmit={handleSubmit}
        noValidate
      >
        <h3 className="text-2xl font-bold text-brand-navy">{t('forms.demo.title')}</h3>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            id="demo-name"
            label={t('forms.demo.name')}
            required
            error={errors.name}
          >
            <input
              id="demo-name"
              ref={nameInputRef}
              name="name"
              value={values.name}
              onChange={event => setField('name', event.target.value)}
              onBlur={() => handleBlur('name')}
              aria-required="true"
              aria-invalid={errors.name ? 'true' : undefined}
              aria-describedby={errors.name ? 'demo-name-error' : undefined}
              className={textInputClasses(Boolean(errors.name))}
              placeholder={t('forms.demo.namePlaceholder')}
              autoComplete="name"
            />
          </Field>

          <Field
            id="demo-email"
            label={t('forms.demo.email')}
            required
            error={errors.email}
          >
            <input
              id="demo-email"
              name="email"
              type="email"
              value={values.email}
              onChange={event => setField('email', event.target.value)}
              onBlur={() => handleBlur('email')}
              aria-required="true"
              aria-invalid={errors.email ? 'true' : undefined}
              aria-describedby={errors.email ? 'demo-email-error' : undefined}
              className={textInputClasses(Boolean(errors.email))}
              placeholder={t('forms.demo.emailPlaceholder')}
              autoComplete="email"
            />
          </Field>

          <Field
            id="demo-company"
            label={t('forms.demo.company')}
            required
            error={errors.company}
          >
            <input
              id="demo-company"
              name="company"
              value={values.company}
              onChange={event => setField('company', event.target.value)}
              onBlur={() => handleBlur('company')}
              aria-required="true"
              aria-invalid={errors.company ? 'true' : undefined}
              aria-describedby={errors.company ? 'demo-company-error' : undefined}
              className={textInputClasses(Boolean(errors.company))}
              placeholder={t('forms.demo.companyPlaceholder')}
              autoComplete="organization"
            />
          </Field>

          <Field id="demo-phone" label={t('forms.demo.phone')}>
            <input
              id="demo-phone"
              name="phone"
              value={values.phone}
              onChange={event => setField('phone', event.target.value)}
              className={textInputClasses(false)}
              placeholder={t('forms.demo.phonePlaceholder')}
              autoComplete="tel"
            />
          </Field>

          <Field
            id="demo-role"
            label={t('forms.demo.role')}
            required
            error={errors.role}
          >
            <select
              id="demo-role"
              name="role"
              value={values.role}
              onChange={event => setField('role', event.target.value)}
              onBlur={() => handleBlur('role')}
              aria-required="true"
              aria-invalid={errors.role ? 'true' : undefined}
              aria-describedby={errors.role ? 'demo-role-error' : undefined}
              className={textInputClasses(Boolean(errors.role))}
            >
              <option value="">{t('forms.demo.rolePlaceholder')}</option>
              {ROLE_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {t(`forms.demo.roleOptions.${option}`)}
                </option>
              ))}
            </select>
          </Field>

          <Field id="demo-gds" label={t('forms.demo.gds')} required error={errors.gds}>
            <select
              id="demo-gds"
              name="gds"
              value={values.gds}
              onChange={event => setField('gds', event.target.value)}
              onBlur={() => handleBlur('gds')}
              aria-required="true"
              aria-invalid={errors.gds ? 'true' : undefined}
              aria-describedby={errors.gds ? 'demo-gds-error' : undefined}
              className={textInputClasses(Boolean(errors.gds))}
            >
              <option value="">{t('forms.demo.gdsPlaceholder')}</option>
              {GDS_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {t(`forms.demo.gdsOptions.${option}`)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field id="demo-message" label={t('forms.demo.message')}>
          <textarea
            id="demo-message"
            name="message"
            value={values.message}
            onChange={event => setField('message', event.target.value)}
            className={cn(textInputClasses(false), 'min-h-32 resize-y')}
            placeholder={t('forms.demo.messagePlaceholder')}
          />
        </Field>

        <input type="hidden" name="locale" value={values.locale} readOnly />

        <GradientButton type="submit" size="lg" disabled={!canSubmit} className="justify-self-start">
          {isSubmitting && (
            <span
              aria-hidden="true"
              className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white align-[-2px]"
            />
          )}
          {isSubmitting ? t('forms.demo.submitting') : t('forms.demo.submit')}
        </GradientButton>
      </form>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
})

export default DemoForm

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-brand-navy">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-destructive">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
