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
  useAudit,
  createAuditSchema,
  AUDIT_GDS_OPTIONS,
  ROLE_OPTIONS,
  type AuditFormValues,
} from '@/hooks/useAudit'
import { useLocaleStore } from '@/store/useLocaleStore'
import { Button } from '@/components/ui/Button'
import Toast from '@/components/ui/Toast'
import MotionSection from './MotionSection'
import SectionHeader from '@/components/ui/SectionHeader'
import { cn } from '@/lib/utils'

type FieldName = keyof Pick<AuditFormValues, 'name' | 'email' | 'company' | 'role' | 'gds'>
type FieldErrors = Partial<Record<FieldName, string>>
const FIELD_NAMES: FieldName[] = ['name', 'email', 'company', 'role', 'gds']

const initialValues: AuditFormValues = {
  name: '',
  email: '',
  company: '',
  role: '',
  gds: '',
  notes: '',
  locale: 'en',
}

function textInputClasses(hasError: boolean) {
  return cn(
    'mt-2 w-full rounded-[9px] border bg-white/[0.04] px-[13px] py-[11px] text-[14px] leading-[1.4] text-white',
    'placeholder:text-white/[0.32]',
    'transition-colors duration-150',
    'hover:border-white/[0.22]',
    'focus:outline-none focus:bg-white/[0.06]',
    'focus:border-[var(--accent)] focus:[box-shadow:0_0_0_3px_rgba(61,111,224,0.12)]',
    'appearance-none',
    hasError ? 'border-[#FF6B6B]' : 'border-[var(--line-strong)]',
  )
}

export type AuditFormHandle = {
  focusFirstField: () => void
}

const AuditForm = forwardRef<AuditFormHandle>(function AuditForm(_props, ref) {
  const { t } = useTranslation()
  const locale = useLocaleStore(state => state.locale)
  const { status, error, isSubmitting, submitAudit } = useAudit()
  const [values, setValues] = useState<AuditFormValues>({ ...initialValues, locale })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [toast, setToast] = useState<string | null>(null)
  const nameInputRef = useRef<HTMLInputElement | null>(null)
  const successRef = useRef<HTMLDivElement | null>(null)
  const auditSchema = useMemo(() => createAuditSchema(t), [t])

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
    if (status === 'error') {
      if (error?.status === 429) {
        setToast(t('forms.audit.errorRateLimit', { defaultValue: 'Too many requests. Please try again in a few minutes.' }))
      } else {
        setToast(t('forms.audit.errorGeneric', { defaultValue: 'Something went wrong. Please try again.' }))
      }
    }
  }, [error, status, t])

  const validateAll = useCallback(
    (nextValues: AuditFormValues): FieldErrors => {
      const result = auditSchema.safeParse(nextValues)
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
    [auditSchema]
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
      return { ...current, [field]: nextError }
    })
  }

  function setField(name: keyof AuditFormValues, value: string) {
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
    await submitAudit(nextValues)
  }

  const canSubmit = auditSchema.safeParse(values).success && !isSubmitting

  if (status === 'success') {
    return (
      <div
        id="audit-form"
        ref={successRef}
        role="status"
        aria-live="polite"
        tabIndex={-1}
        className="rounded-[14px] border border-[var(--line-strong)] bg-white/[0.035] p-8 text-center"
      >
        <h3 className="text-[20px] font-bold tracking-[-0.015em] text-white">
          {t('forms.audit.successTitle', { defaultValue: 'Request received!' })}
        </h3>
        <p className="mt-3 text-[14px] leading-[1.6] text-white/[0.65]">
          {t('forms.audit.successBody', { defaultValue: 'Our team will reach out shortly.' })}
        </p>
      </div>
    )
  }

  return (
    <div id="audit-form" data-testid="commission-audit-form">
      <form
        aria-label={t('forms.audit.title', { defaultValue: 'Commission Audit Request' })}
        className="grid gap-5 rounded-[14px] border border-[var(--line-strong)] bg-white/[0.035] p-6 sm:p-8"
        onSubmit={handleSubmit}
        noValidate
      >
        <h3 className="text-[20px] font-bold tracking-[-0.015em] text-white">
          {t('forms.audit.title', { defaultValue: 'Commission Audit Request' })}
        </h3>

        <div className="grid gap-5 md:grid-cols-2">
          <Field id="audit-name" label={t('forms.audit.name', { defaultValue: 'Full Name' })} required error={errors.name}>
            <input
              id="audit-name"
              ref={nameInputRef}
              name="name"
              value={values.name}
              onChange={event => setField('name', event.target.value)}
              onBlur={() => handleBlur('name')}
              aria-required="true"
              aria-invalid={errors.name ? 'true' : undefined}
              aria-describedby={errors.name ? 'audit-name-error' : undefined}
              className={textInputClasses(Boolean(errors.name))}
              placeholder={t('forms.audit.namePlaceholder', { defaultValue: 'Your name' })}
              autoComplete="name"
            />
          </Field>

          <Field id="audit-email" label={t('forms.audit.email', { defaultValue: 'Work Email' })} required error={errors.email}>
            <input
              id="audit-email"
              name="email"
              type="email"
              value={values.email}
              onChange={event => setField('email', event.target.value)}
              onBlur={() => handleBlur('email')}
              aria-required="true"
              aria-invalid={errors.email ? 'true' : undefined}
              aria-describedby={errors.email ? 'audit-email-error' : undefined}
              className={textInputClasses(Boolean(errors.email))}
              placeholder={t('forms.audit.emailPlaceholder', { defaultValue: 'you@agency.com' })}
              autoComplete="email"
            />
          </Field>

          <Field id="audit-company" label={t('forms.audit.company', { defaultValue: 'Company' })} required error={errors.company}>
            <input
              id="audit-company"
              name="company"
              value={values.company}
              onChange={event => setField('company', event.target.value)}
              onBlur={() => handleBlur('company')}
              aria-required="true"
              aria-invalid={errors.company ? 'true' : undefined}
              aria-describedby={errors.company ? 'audit-company-error' : undefined}
              className={textInputClasses(Boolean(errors.company))}
              placeholder={t('forms.audit.companyPlaceholder', { defaultValue: 'Travel Agency Name' })}
              autoComplete="organization"
            />
          </Field>

          <Field id="audit-role" label={t('forms.audit.role', { defaultValue: 'Your Role' })} required error={errors.role}>
            <select
              id="audit-role"
              name="role"
              value={values.role}
              onChange={event => setField('role', event.target.value)}
              onBlur={() => handleBlur('role')}
              aria-required="true"
              aria-invalid={errors.role ? 'true' : undefined}
              aria-describedby={errors.role ? 'audit-role-error' : undefined}
              className={textInputClasses(Boolean(errors.role))}
            >
              <option value="">{t('forms.audit.rolePlaceholder', { defaultValue: 'Select your role' })}</option>
              {ROLE_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {t(`demo.form.fields.role.options.${option}`, { defaultValue: option })}
                </option>
              ))}
            </select>
          </Field>

          <Field id="audit-gds" label={t('forms.audit.gds', { defaultValue: 'Primary GDS' })} required error={errors.gds}>
            <select
              id="audit-gds"
              name="gds"
              value={values.gds}
              onChange={event => setField('gds', event.target.value)}
              onBlur={() => handleBlur('gds')}
              aria-required="true"
              aria-invalid={errors.gds ? 'true' : undefined}
              aria-describedby={errors.gds ? 'audit-gds-error' : undefined}
              className={textInputClasses(Boolean(errors.gds))}
            >
              <option value="">{t('forms.audit.gdsPlaceholder', { defaultValue: 'Select your GDS' })}</option>
              {/* Story 6.13 (AC 2 — option b): GDS list trimmed to the 4-value
                  canonical set shared with DemoForm. Story 6.10's design-handoff
                  intentionally collapsed Galileo + Worldspan + "None yet" into
                  Travelport (Galileo/Worldspan) + Other. Audit funnel inherits
                  that same combination for visual and behavioral consistency;
                  zod still accepts the 3 legacy values on the wire for back-compat
                  with pre-rename submissions. */}
              {AUDIT_GDS_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {t(`demo.form.fields.gds.options.${option}`, { defaultValue: option })}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field id="audit-notes" label={t('forms.audit.notes', { defaultValue: 'Notes (optional)' })}>
          <textarea
            id="audit-notes"
            name="notes"
            value={values.notes}
            onChange={event => setField('notes', event.target.value)}
            className={cn(textInputClasses(false), 'min-h-32 resize-y')}
            placeholder={t('forms.audit.notesPlaceholder', { defaultValue: 'Share anything relevant about your BSP setup.' })}
          />
        </Field>

        <input type="hidden" name="locale" value={values.locale} readOnly />

        <Button
          type="submit"
          variant="solid-accent"
          size="lg"
          disabled={!canSubmit}
          className="w-full min-h-[44px] sm:w-auto sm:justify-self-start whitespace-nowrap"
          data-testid="commission-audit-submit"
        >
          {isSubmitting && (
            <span
              aria-hidden="true"
              className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white align-[-2px]"
            />
          )}
          {isSubmitting
            ? t('forms.audit.submitting', { defaultValue: 'Sending...' })
            : t('forms.audit.submit', { defaultValue: 'Request Audit' })}
        </Button>
      </form>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
})

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
      <label
        htmlFor={id}
        className="block text-[12px] font-semibold text-white/70"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-[var(--accent-soft)] font-bold">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-[12px] text-[#FF6B6B]">
          {error}
        </p>
      )}
    </div>
  )
}

export default function CommissionAudit() {
  const { t } = useTranslation()
  const formRef = useRef<AuditFormHandle | null>(null)

  const scrollToForm = () => {
    const formEl = document.getElementById('audit-form')
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' })
    }
    formRef.current?.focusFirstField()
  }

  return (
    <MotionSection
      id="commission-audit"
      role="region"
      aria-labelledby="commission-audit-heading"
      className="sec relative bg-[var(--ink)] text-white scroll-mt-24"
      data-testid="commission-audit-section"
    >
      <div className="sec-inner mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-14 py-24 lg:py-[100px]">
        <SectionHeader
          variant="sober"
          eyebrow={t('sections.commissionAudit.heading', { defaultValue: 'Free Commission Audit' })}
          heading={t('sections.commissionAudit.heading', { defaultValue: 'Free Commission Leakage Audit' })}
          subtext={t('sections.commissionAudit.subheading', {
            defaultValue:
              'Send us 30 days of BSP data and we will return a written report on how much commission your agency is leaving on the table.',
          })}
        />
        <h2 id="commission-audit-heading" className="sr-only">
          {t('sections.commissionAudit.heading', { defaultValue: 'Free Commission Leakage Audit' })}
        </h2>

        <ul className="grid gap-4 md:grid-cols-3">
          {['bullet1', 'bullet2', 'bullet3'].map(key => (
            <li
              key={key}
              className="rounded-[14px] border border-[var(--line)] bg-white/[0.03] px-5 py-4 text-[13.5px] leading-[1.6] text-white/[0.7] motion-safe:transition-colors motion-safe:duration-150 hover:border-[var(--line-strong)] hover:bg-white/[0.045]"
            >
              {t(`sections.commissionAudit.${key}`, { defaultValue: '' })}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex justify-center">
          <Button
            type="button"
            variant="solid-accent"
            size="lg"
            onClick={scrollToForm}
            className="w-full min-h-[44px] sm:w-auto whitespace-nowrap"
            data-testid="commission-audit-cta"
          >
            {t('sections.commissionAudit.ctaLabel', { defaultValue: 'Request my free audit' })}
          </Button>
        </div>

        <div className="mt-10 mx-auto max-w-[920px]">
          <AuditForm ref={formRef} />
        </div>
      </div>
    </MotionSection>
  )
}
