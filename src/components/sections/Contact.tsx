import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CONTACT_SUBJECT_OPTIONS,
  isContactFormValid,
  useContact,
  type ContactFormValues,
} from '@/hooks/useContact'
import { useLocaleStore } from '@/store/useLocaleStore'
import GradientButton from '@/components/ui/GradientButton'
import SectionHeader from '@/components/ui/SectionHeader'
import { cn } from '@/lib/utils'

type FieldName = keyof Pick<ContactFormValues, 'name' | 'email' | 'subject' | 'message'>
type FieldErrors = Partial<Record<FieldName, string>>

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

function isFieldName(name: keyof ContactFormValues): name is FieldName {
  return name === 'name' || name === 'email' || name === 'subject' || name === 'message'
}

export default function Contact() {
  const { t } = useTranslation()
  const locale = useLocaleStore(state => state.locale)
  const { status, error, isSubmitting, submitContact } = useContact()
  const [values, setValues] = useState<ContactFormValues>({ ...initialValues, locale })
  const [errors, setErrors] = useState<FieldErrors>({})

  useEffect(() => {
    setValues(current => ({ ...current, locale }))
  }, [locale])

  const validationMessages = useMemo(
    () => ({
      name: t('forms.contact.nameError'),
      email: t('forms.contact.emailError'),
      subject: t('forms.contact.subjectError'),
      message: t('forms.contact.messageError'),
    }),
    [t]
  )

  function validateField(name: FieldName, nextValues = values): string | undefined {
    const value = nextValues[name].trim()
    if (name === 'email') {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : validationMessages.email
    }
    if (name === 'subject') {
      return CONTACT_SUBJECT_OPTIONS.includes(value as (typeof CONTACT_SUBJECT_OPTIONS)[number])
        ? undefined
        : validationMessages.subject
    }
    return value ? undefined : validationMessages[name]
  }

  function validateAll(nextValues = values): FieldErrors {
    return {
      name: validateField('name', nextValues),
      email: validateField('email', nextValues),
      subject: validateField('subject', nextValues),
      message: validateField('message', nextValues),
    }
  }

  function handleBlur(field: FieldName) {
    setErrors(current => ({
      ...current,
      [field]: validateField(field),
    }))
  }

  function setField(name: keyof ContactFormValues, value: string) {
    setValues(current => {
      const nextValues = { ...current, [name]: value }

      if (isFieldName(name)) {
        setErrors(currentErrors =>
          currentErrors[name] === undefined
            ? currentErrors
            : { ...currentErrors, [name]: validateField(name, nextValues) }
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

    if (!isContactFormValid(nextValues)) {
      return
    }

    await submitContact(nextValues)
  }

  const canSubmit = isContactFormValid(values) && !isSubmitting
  const formError =
    status === 'error'
      ? error?.status === 429
        ? t('forms.contact.errorRateLimit')
        : t('forms.contact.errorGeneric')
      : null

  return (
    <section id="contact" aria-labelledby="contact-heading" className="bg-brand-mist py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={t('forms.contact.eyebrow')}
          heading={t('forms.contact.heading')}
          subtext={t('forms.contact.subtext')}
          headingId="contact-heading"
          className="mb-10"
        />

        {status === 'success' ? (
          <div
            role="status"
            aria-live="polite"
            className="mx-auto max-w-2xl rounded-lg border border-brand-electric-blue/20 bg-white p-8 text-center shadow-sm"
          >
            <h3 className="text-2xl font-bold text-brand-navy">{t('forms.contact.successTitle')}</h3>
            <p className="mt-3 text-base leading-7 text-brand-slate">{t('forms.contact.successBody')}</p>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl">
            <form
              aria-label={t('forms.contact.title')}
              className="grid gap-5 rounded-lg border border-brand-slate/20 bg-white p-6 shadow-sm sm:p-8"
              onSubmit={handleSubmit}
              noValidate
            >
              <h3 className="text-2xl font-bold text-brand-navy">{t('forms.contact.title')}</h3>

              <Field id="contact-name" label={t('forms.contact.name')} required error={errors.name}>
                <input
                  id="contact-name"
                  name="name"
                  value={values.name}
                  onChange={event => setField('name', event.target.value)}
                  onBlur={() => handleBlur('name')}
                  aria-invalid={errors.name ? 'true' : undefined}
                  aria-describedby={errors.name ? 'contact-name-error' : undefined}
                  className={textInputClasses(Boolean(errors.name))}
                  autoComplete="name"
                  required
                />
              </Field>

              <Field id="contact-email" label={t('forms.contact.email')} required error={errors.email}>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={event => setField('email', event.target.value)}
                  onBlur={() => handleBlur('email')}
                  aria-invalid={errors.email ? 'true' : undefined}
                  aria-describedby={errors.email ? 'contact-email-error' : undefined}
                  className={textInputClasses(Boolean(errors.email))}
                  autoComplete="email"
                  required
                />
              </Field>

              <Field id="contact-subject" label={t('forms.contact.subject')} required error={errors.subject}>
                <select
                  id="contact-subject"
                  name="subject"
                  value={values.subject}
                  onChange={event => setField('subject', event.target.value)}
                  onBlur={() => handleBlur('subject')}
                  aria-invalid={errors.subject ? 'true' : undefined}
                  aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
                  className={textInputClasses(Boolean(errors.subject))}
                  required
                >
                  <option value="">{t('forms.contact.subjectPlaceholder')}</option>
                  {CONTACT_SUBJECT_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {t(`forms.contact.subjectOptions.${option}`)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field id="contact-message" label={t('forms.contact.message')} required error={errors.message}>
                <textarea
                  id="contact-message"
                  name="message"
                  value={values.message}
                  onChange={event => setField('message', event.target.value)}
                  onBlur={() => handleBlur('message')}
                  aria-invalid={errors.message ? 'true' : undefined}
                  aria-describedby={errors.message ? 'contact-message-error' : undefined}
                  className={cn(textInputClasses(Boolean(errors.message)), 'min-h-36 resize-y')}
                  placeholder={t('forms.contact.messagePlaceholder')}
                  required
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
                {isSubmitting ? t('forms.contact.submitting') : t('forms.contact.submit')}
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
    </section>
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
