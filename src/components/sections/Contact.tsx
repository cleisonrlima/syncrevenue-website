import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CONTACT_SUBJECT_OPTIONS,
  createContactSchema,
  useContact,
  type ContactFormValues,
} from '@/hooks/useContact'
import { useLocaleStore } from '@/store/useLocaleStore'
import MotionSection from './MotionSection'
import GradientButton from '@/components/ui/GradientButton'
import SectionHeader from '@/components/ui/SectionHeader'
import { cn } from '@/lib/utils'

type FieldName = keyof Pick<ContactFormValues, 'name' | 'email' | 'subject' | 'message'>
type FieldErrors = Partial<Record<FieldName, string>>
const FIELD_NAMES: FieldName[] = ['name', 'email', 'subject', 'message']

const initialValues: ContactFormValues = {
  name: '',
  email: '',
  subject: '',
  message: '',
  locale: 'en',
}

function textInputClasses(hasError: boolean) {
  return cn(
    'mt-2 w-full rounded-lg border bg-white px-4 py-3 text-base text-brand-navy shadow-sm',
    'min-h-11 placeholder:text-brand-slate/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-electric-blue',
    hasError ? 'border-destructive' : 'border-brand-slate/25'
  )
}

export default function Contact() {
  const { t } = useTranslation()
  const locale = useLocaleStore(state => state.locale)
  const { status, error, isSubmitting, submitContact } = useContact()
  const [values, setValues] = useState<ContactFormValues>({ ...initialValues, locale })
  const [errors, setErrors] = useState<FieldErrors>({})
  const successRef = useRef<HTMLDivElement | null>(null)
  const contactSchema = useMemo(() => createContactSchema(t), [t])

  useEffect(() => {
    setValues(current => ({ ...current, locale }))
  }, [locale])

  useEffect(() => {
    if (status === 'success') {
      successRef.current?.focus()
    }
  }, [status])

  const validateAll = useCallback(
    (nextValues: ContactFormValues): FieldErrors => {
      const result = contactSchema.safeParse(nextValues)
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
    [contactSchema]
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

  function setField(name: keyof ContactFormValues, value: string) {
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

    await submitContact(nextValues)
  }

  const canSubmit = contactSchema.safeParse(values).success && !isSubmitting
  const formError =
    status === 'error'
      ? error?.status === 429
        ? t('forms.contact.errorRateLimit', { defaultValue: 'Too many contact requests. Please wait a minute and try again.' })
        : t('forms.contact.errorGeneric', { defaultValue: 'Something went wrong. Please try again.' })
      : null

  return (
    <MotionSection id="contact" aria-labelledby="contact-heading" className="bg-brand-mist py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={t('forms.contact.eyebrow', { defaultValue: 'General Inquiries' })}
          heading={t('forms.contact.heading', { defaultValue: 'Contact Sync Sirius' })}
          subtext={t('forms.contact.subtext', { defaultValue: 'Send your question to the right Sync Sirius service team.' })}
          headingId="contact-heading"
          className="mb-10"
        />

        {status === 'success' ? (
          <div
            ref={successRef}
            role="status"
            aria-live="polite"
            tabIndex={-1}
            className="mx-auto max-w-2xl rounded-lg border border-brand-electric-blue/20 bg-white p-8 text-center shadow-sm"
          >
            <h3 className="text-2xl font-bold text-brand-navy">{t('forms.contact.successTitle', { defaultValue: 'Message sent!' })}</h3>
            <p className="mt-3 text-base leading-7 text-brand-slate">{t('forms.contact.successBody', { defaultValue: 'We received your inquiry and will route it to the right team.' })}</p>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl">
            <form
              aria-label={t('forms.contact.title', { defaultValue: 'Contact Us' })}
              className="grid gap-5 rounded-lg border border-brand-slate/20 bg-white p-6 shadow-sm sm:p-8"
              onSubmit={handleSubmit}
              noValidate
            >
              <h3 className="text-2xl font-bold text-brand-navy">{t('forms.contact.title', { defaultValue: 'Contact Us' })}</h3>

              <Field id="contact-name" label={t('forms.contact.name', { defaultValue: 'Full Name' })} required error={errors.name}>
                <input
                  id="contact-name"
                  name="name"
                  value={values.name}
                  onChange={event => setField('name', event.target.value)}
                  onBlur={() => handleBlur('name')}
                  aria-required="true"
                  aria-invalid={errors.name ? 'true' : undefined}
                  aria-describedby={errors.name ? 'contact-name-error' : undefined}
                  className={textInputClasses(Boolean(errors.name))}
                  autoComplete="name"
                  required
                />
              </Field>

              <Field id="contact-email" label={t('forms.contact.email', { defaultValue: 'Email Address' })} required error={errors.email}>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={event => setField('email', event.target.value)}
                  onBlur={() => handleBlur('email')}
                  aria-required="true"
                  aria-invalid={errors.email ? 'true' : undefined}
                  aria-describedby={errors.email ? 'contact-email-error' : undefined}
                  className={textInputClasses(Boolean(errors.email))}
                  autoComplete="email"
                  required
                />
              </Field>

              <Field id="contact-subject" label={t('forms.contact.subject', { defaultValue: 'Subject / Service' })} required error={errors.subject}>
                <select
                  id="contact-subject"
                  name="subject"
                  value={values.subject}
                  onChange={event => setField('subject', event.target.value)}
                  onBlur={() => handleBlur('subject')}
                  aria-required="true"
                  aria-invalid={errors.subject ? 'true' : undefined}
                  aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
                  className={textInputClasses(Boolean(errors.subject))}
                  required
                >
                  <option value="">{t('forms.contact.subjectPlaceholder', { defaultValue: 'Select a service area' })}</option>
                  {CONTACT_SUBJECT_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {t(`forms.contact.subjectOptions.${option}`)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field id="contact-message" label={t('forms.contact.message', { defaultValue: 'Message' })} required error={errors.message}>
                <textarea
                  id="contact-message"
                  name="message"
                  value={values.message}
                  onChange={event => setField('message', event.target.value)}
                  onBlur={() => handleBlur('message')}
                  aria-required="true"
                  aria-invalid={errors.message ? 'true' : undefined}
                  aria-describedby={errors.message ? 'contact-message-error' : undefined}
                  className={cn(textInputClasses(Boolean(errors.message)), 'min-h-36 resize-y')}
                  placeholder={t('forms.contact.messagePlaceholder', { defaultValue: 'Tell us what you need help with' })}
                  required
                />
              </Field>

              <input type="hidden" name="locale" value={values.locale} readOnly />

              <GradientButton type="submit" size="lg" disabled={!canSubmit} className="w-full min-h-[44px] sm:w-auto sm:justify-self-start whitespace-nowrap">
                {isSubmitting && (
                  <span
                    aria-hidden="true"
                    className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white align-[-2px]"
                  />
                )}
                {isSubmitting ? t('forms.contact.submitting', { defaultValue: 'Sending...' }) : t('forms.contact.submit', { defaultValue: 'Send Message' })}
              </GradientButton>
            </form>

            {formError && (
              <p className="mt-4 text-sm font-medium text-destructive" aria-live="polite">
                {formError}
              </p>
            )}
          </div>
        )}
      </div>
    </MotionSection>
  )
}

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
