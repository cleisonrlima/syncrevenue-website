import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { useTranslation } from 'react-i18next'
import {
  useDemo,
  createDemoSchema,
  DEMO_GDS_OPTIONS,
  ROLE_OPTIONS,
  type DemoFormValues,
} from '@/hooks/useDemo'
import { useLocaleStore } from '@/store/useLocaleStore'
import FormField from '@/components/forms/FormField'
import FormSelect from '@/components/forms/FormSelect'
import FormTextarea from '@/components/forms/FormTextarea'
import FormFoot from '@/components/forms/FormFoot'
import EncryptedTransitNote from '@/components/forms/EncryptedTransitNote'
import { Button } from '@/components/ui/Button'
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

const baseInputClasses = cn(
  'w-full rounded-[9px] border bg-white/[0.04] px-[13px] py-[11px]',
  'text-[14px] leading-[1.4] text-white',
  'placeholder:text-white/[0.32]',
  'transition-colors duration-150',
  'hover:border-white/[0.22]',
  'focus:outline-none focus:bg-white/[0.06]',
  'focus-visible:ring-2 focus-visible:ring-brand-electric-blue',
  'focus:border-[var(--accent)] focus:[box-shadow:0_0_0_3px_rgba(61,111,224,0.12)]',
)

function inputBorder(hasError: boolean) {
  return hasError ? 'border-[var(--form-error,#FF6B6B)]' : 'border-[var(--line-strong)]'
}

const OPTION_BG_STYLE: React.CSSProperties = { background: '#0A0B2E' }

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
      setToast(t('demo.form.errors.generic', { defaultValue: 'Something went wrong. Please try again.' }))
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
        className={cn(
          'form-card rounded-[14px] border p-[32px] text-center',
          'border-[var(--line-strong)] bg-white/[0.035]',
          'max-[600px]:p-[24px]',
        )}
      >
        <h3 className="text-[20px] font-bold text-white">
          {t('demo.form.success.title', { defaultValue: 'Request received!' })}
        </h3>
        <p className="mt-[10px] text-[14px] leading-[1.6] text-white/70">
          {t('demo.form.success.body', { defaultValue: 'Our team will reach out within 1 business day.' })}
        </p>
      </div>
    )
  }

  return (
    <div id="demo-form">
      <form
        aria-label={t('demo.form.heading', { defaultValue: 'Request a demonstration' })}
        className={cn(
          'form-card rounded-[14px] border p-[32px]',
          'border-[var(--line-strong)] bg-white/[0.035]',
          'max-[600px]:p-[24px]',
        )}
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="form-head mb-[20px]">
          <h3 className="text-[18px] font-semibold text-white">
            {t('demo.form.heading', { defaultValue: 'Request a demonstration' })}
          </h3>
          <p className="mt-[6px] text-[13px] text-white/60">
            {t('demo.form.helper', { defaultValue: 'Fields marked with * are required.' })}
          </p>
        </div>

        <div className="form-row grid grid-cols-1 gap-[16px] min-[600px]:grid-cols-2 mb-[16px]">
          <FormField
            label={t('demo.form.fields.name.label', { defaultValue: 'Full name' })}
            htmlFor="demo-name"
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
              className={cn(baseInputClasses, inputBorder(Boolean(errors.name)))}
              placeholder={t('demo.form.fields.name.placeholder', { defaultValue: 'Maria Souza' })}
              autoComplete="name"
              required
            />
          </FormField>

          <FormField
            label={t('demo.form.fields.email.label', { defaultValue: 'Work email' })}
            htmlFor="demo-email"
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
              className={cn(baseInputClasses, inputBorder(Boolean(errors.email)))}
              placeholder={t('demo.form.fields.email.placeholder', { defaultValue: 'maria@youragency.com' })}
              autoComplete="email"
              required
            />
          </FormField>
        </div>

        <div className="form-row grid grid-cols-1 gap-[16px] min-[600px]:grid-cols-2 mb-[16px]">
          <FormField
            label={t('demo.form.fields.company.label', { defaultValue: 'Agency' })}
            htmlFor="demo-company"
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
              className={cn(baseInputClasses, inputBorder(Boolean(errors.company)))}
              placeholder={t('demo.form.fields.company.placeholder', { defaultValue: 'Agency name' })}
              autoComplete="organization"
              required
            />
          </FormField>

          <FormField
            label={t('demo.form.fields.phone.label', { defaultValue: 'Phone' })}
            htmlFor="demo-phone"
            optional
            optionalLabel={t('demo.form.fields.phone.optional', { defaultValue: '(optional)' })}
          >
            <input
              id="demo-phone"
              name="phone"
              value={values.phone}
              onChange={event => setField('phone', event.target.value)}
              className={cn(baseInputClasses, inputBorder(false))}
              placeholder={t('demo.form.fields.phone.placeholder', { defaultValue: '+1 305 555 0100' })}
              autoComplete="tel"
            />
          </FormField>
        </div>

        <div className="form-row grid grid-cols-1 gap-[16px] min-[600px]:grid-cols-2 mb-[16px]">
          <FormField
            label={t('demo.form.fields.role.label', { defaultValue: 'Your role' })}
            htmlFor="demo-role"
            required
            error={errors.role}
          >
            <FormSelect
              id="demo-role"
              name="role"
              value={values.role}
              onChange={event => setField('role', event.target.value)}
              onBlur={() => handleBlur('role')}
              aria-required="true"
              aria-describedby={errors.role ? 'demo-role-error' : undefined}
              invalid={Boolean(errors.role)}
              required
            >
              <option value="" style={OPTION_BG_STYLE}>
                {t('demo.form.fields.role.placeholder', { defaultValue: 'Select' })}
              </option>
              {ROLE_OPTIONS.map(option => (
                <option key={option} value={option} style={OPTION_BG_STYLE}>
                  {t(`demo.form.fields.role.options.${option}`, { defaultValue: option })}
                </option>
              ))}
            </FormSelect>
          </FormField>

          <FormField
            label={t('demo.form.fields.gds.label', { defaultValue: 'Primary GDS' })}
            htmlFor="demo-gds"
            required
            error={errors.gds}
          >
            <FormSelect
              id="demo-gds"
              name="gds"
              value={values.gds}
              onChange={event => setField('gds', event.target.value)}
              onBlur={() => handleBlur('gds')}
              aria-required="true"
              aria-describedby={errors.gds ? 'demo-gds-error' : undefined}
              invalid={Boolean(errors.gds)}
              required
            >
              <option value="" style={OPTION_BG_STYLE}>
                {t('demo.form.fields.gds.placeholder', { defaultValue: 'Select' })}
              </option>
              {DEMO_GDS_OPTIONS.map(option => (
                <option key={option} value={option} style={OPTION_BG_STYLE}>
                  {t(`demo.form.fields.gds.options.${option}`, { defaultValue: option })}
                </option>
              ))}
            </FormSelect>
          </FormField>
        </div>

        <div className="mb-[8px]">
          <FormField
            label={t('demo.form.fields.message.label', { defaultValue: 'Message' })}
            htmlFor="demo-message"
            optional
            optionalLabel={t('demo.form.fields.message.optional', { defaultValue: '(optional)' })}
          >
            <FormTextarea
              id="demo-message"
              name="message"
              value={values.message}
              onChange={event => setField('message', event.target.value)}
              placeholder={t('demo.form.fields.message.placeholder', {
                defaultValue: 'Tell us about your reconciliation and commission challenges',
              })}
            />
          </FormField>
        </div>

        <input type="hidden" name="locale" value={values.locale} readOnly />

        <FormFoot
          note={<EncryptedTransitNote />}
          submit={
            <Button
              type="submit"
              variant="solid-accent"
              size="lg"
              disabled={!canSubmit}
              className="btn-lg min-h-[44px] w-full whitespace-nowrap focus-visible:ring-brand-deep min-[600px]:w-auto sm:w-auto"
            >
              {isSubmitting && (
                <span
                  aria-hidden="true"
                  className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white align-[-2px]"
                />
              )}
              {isSubmitting
                ? t('demo.form.submitting', { defaultValue: 'Sending...' })
                : t('demo.form.submit', { defaultValue: 'Schedule demonstration' })}
            </Button>
          }
        />
      </form>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
})

export default DemoForm
