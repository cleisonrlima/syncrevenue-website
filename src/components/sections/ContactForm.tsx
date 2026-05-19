import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { useTranslation } from 'react-i18next'
import {
  CONTACT_SUBJECT_OPTIONS,
  createContactSchema,
  useContact,
  type ContactFormValues,
} from '@/hooks/useContact'
import { useLocaleStore } from '@/store/useLocaleStore'
import FormField from '@/components/forms/FormField'
import FormSelect from '@/components/forms/FormSelect'
import FormTextarea from '@/components/forms/FormTextarea'
import FormFoot from '@/components/forms/FormFoot'
import EncryptedTransitNote from '@/components/forms/EncryptedTransitNote'
import { Button } from '@/components/ui/Button'
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

const baseInputClasses = cn(
  'w-full rounded-[9px] border bg-white/[0.04] px-[13px] py-[11px]',
  'text-[14px] leading-[1.4] text-white',
  'placeholder:text-white/[0.32]',
  'transition-colors duration-150',
  'hover:border-white/[0.22]',
  'focus:outline-none focus:bg-white/[0.06]',
  'focus:border-[var(--accent)] focus:[box-shadow:0_0_0_3px_rgba(61,111,224,0.12)]',
)

function inputBorder(hasError: boolean) {
  return hasError ? 'border-[var(--form-error,#FF6B6B)]' : 'border-[var(--line-strong)]'
}

const PaperPlaneIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="mr-[7px] inline-block flex-shrink-0"
  >
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
)

export default function ContactForm() {
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
    [contactSchema],
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

  function setField(name: keyof ContactFormValues, value: string) {
    setValues(current => {
      const nextValues = { ...current, [name]: value }
      if (FIELD_NAMES.includes(name as FieldName)) {
        const fieldName = name as FieldName
        setErrors(currentErrors =>
          currentErrors[fieldName] === undefined
            ? currentErrors
            : { ...currentErrors, [fieldName]: validateField(fieldName, nextValues) },
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
        ? t('contact.form.errors.rateLimit', {
            defaultValue: 'Too many contact requests. Please wait a minute and try again.',
          })
        : t('contact.form.errors.generic', {
            defaultValue: 'Something went wrong. Please try again.',
          })
      : null

  if (status === 'success') {
    return (
      <div
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
          {t('contact.form.success.title', { defaultValue: 'Message sent!' })}
        </h3>
        <p className="mt-[10px] text-[14px] leading-[1.6] text-white/70">
          {t('contact.form.success.body', {
            defaultValue: 'We received your inquiry and will route it to the right team.',
          })}
        </p>
      </div>
    )
  }

  return (
    <div>
      <form
        aria-label={t('contact.form.heading', { defaultValue: 'Send a message' })}
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
            {t('contact.form.heading', { defaultValue: 'Send a message' })}
          </h3>
          <p className="mt-[6px] text-[13px] text-white/60">
            {t('contact.form.helper', { defaultValue: 'We route the message based on the subject.' })}
          </p>
        </div>

        <div className="form-row grid grid-cols-1 gap-[16px] min-[600px]:grid-cols-2 mb-[16px]">
          <FormField
            label={t('contact.form.fields.name.label', { defaultValue: 'Full name' })}
            htmlFor="contact-name"
            required
            error={errors.name}
          >
            <input
              id="contact-name"
              name="name"
              value={values.name}
              onChange={event => setField('name', event.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder={t('contact.form.fields.name.placeholder', { defaultValue: 'Your name' })}
              aria-required="true"
              aria-invalid={errors.name ? 'true' : undefined}
              aria-describedby={errors.name ? 'contact-name-error' : undefined}
              autoComplete="name"
              required
              className={cn(baseInputClasses, inputBorder(Boolean(errors.name)))}
            />
          </FormField>

          <FormField
            label={t('contact.form.fields.email.label', { defaultValue: 'Email' })}
            htmlFor="contact-email"
            required
            error={errors.email}
          >
            <input
              id="contact-email"
              name="email"
              type="email"
              value={values.email}
              onChange={event => setField('email', event.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder={t('contact.form.fields.email.placeholder', { defaultValue: 'you@email.com' })}
              aria-required="true"
              aria-invalid={errors.email ? 'true' : undefined}
              aria-describedby={errors.email ? 'contact-email-error' : undefined}
              autoComplete="email"
              required
              className={cn(baseInputClasses, inputBorder(Boolean(errors.email)))}
            />
          </FormField>
        </div>

        <div className="mb-[16px]">
          <FormField
            label={t('contact.form.fields.subject.label', { defaultValue: 'Subject' })}
            htmlFor="contact-subject"
            required
            error={errors.subject}
          >
            <FormSelect
              id="contact-subject"
              name="subject"
              value={values.subject}
              onChange={event => setField('subject', event.target.value)}
              onBlur={() => handleBlur('subject')}
              aria-required="true"
              aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
              invalid={Boolean(errors.subject)}
              required
            >
              <option value="" style={{ background: '#0A0B2E' }}>
                {t('contact.form.fields.subject.placeholder', { defaultValue: 'Select a subject' })}
              </option>
              {CONTACT_SUBJECT_OPTIONS.map(option => (
                <option key={option} value={option} style={{ background: '#0A0B2E' }}>
                  {t(`contact.form.fields.subject.options.${option}`)}
                </option>
              ))}
            </FormSelect>
          </FormField>
        </div>

        <div>
          <FormField
            label={t('contact.form.fields.message.label', { defaultValue: 'Message' })}
            htmlFor="contact-message"
            required
            error={errors.message}
          >
            <FormTextarea
              id="contact-message"
              name="message"
              value={values.message}
              onChange={event => setField('message', event.target.value)}
              onBlur={() => handleBlur('message')}
              placeholder={t('contact.form.fields.message.placeholder', { defaultValue: 'How can we help?' })}
              aria-required="true"
              aria-describedby={errors.message ? 'contact-message-error' : undefined}
              invalid={Boolean(errors.message)}
              required
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
              className="btn-lg min-h-[44px] w-full whitespace-nowrap min-[600px]:w-auto"
            >
              {isSubmitting && (
                <span
                  aria-hidden="true"
                  className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white align-[-2px]"
                />
              )}
              {!isSubmitting && <PaperPlaneIcon />}
              {isSubmitting
                ? t('contact.form.submitting', { defaultValue: 'Sending...' })
                : t('contact.form.submit', { defaultValue: 'Send message' })}
            </Button>
          }
        />
      </form>

      {formError && (
        <p
          className="mt-[14px] text-[13px] font-medium"
          style={{ color: 'var(--form-error, #FF6B6B)' }}
          aria-live="polite"
        >
          {formError}
        </p>
      )}
    </div>
  )
}
