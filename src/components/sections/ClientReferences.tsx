import { useTranslation } from 'react-i18next'
import MotionSection from './MotionSection'
import SectionHeader from '@/components/ui/SectionHeader'

type ClientReference = {
  agencyName: string
  location: string
  relationship: string
  testimonial?: string
  referenceDetail?: string
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function normalizeClientReference(value: unknown): ClientReference | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Partial<Record<keyof ClientReference, unknown>>
  const referenceCopy = isNonEmptyString(candidate.testimonial)
    ? { testimonial: candidate.testimonial }
    : isNonEmptyString(candidate.referenceDetail)
      ? { referenceDetail: candidate.referenceDetail }
      : null

  if (
    !isNonEmptyString(candidate.agencyName) ||
    !isNonEmptyString(candidate.location) ||
    !isNonEmptyString(candidate.relationship) ||
    !referenceCopy
  ) {
    return null
  }

  return {
    agencyName: candidate.agencyName,
    location: candidate.location,
    relationship: candidate.relationship,
    ...referenceCopy,
  }
}

export default function ClientReferences() {
  const { t } = useTranslation()
  const rawReferences = t('references.items', { returnObjects: true }) as unknown
  const references = Array.isArray(rawReferences)
    ? rawReferences
        .map(normalizeClientReference)
        .filter((reference): reference is ClientReference => Boolean(reference))
    : []

  return (
    <MotionSection
      id="client-references"
      role="region"
      aria-label={t('references.ariaLabel', {
        defaultValue: 'Verified US travel agency references',
      })}
      className="bg-[#F4F6FA]"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <SectionHeader
          variant="light"
          eyebrow={t('references.eyebrow', { defaultValue: 'Client References' })}
          heading={t('references.headline', { defaultValue: 'Trusted by US Travel Agencies' })}
          subtext={t('references.subtext', {
            defaultValue:
              'Named references are shared with approval so security-minded agencies can verify real operating experience.',
          })}
          className="section-intro-emphasis"
        />

        {references.length > 0 && (
          <div
            data-reference-grid="true"
            className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2"
          >
            {references.map((reference, index) => {
              const headingId = `client-reference-${index}`
              const detail = reference.testimonial ?? reference.referenceDetail

              return (
                <article
                  key={`${reference.agencyName}-${index}`}
                  aria-labelledby={headingId}
                  className="rounded-lg border border-brand-slate/20 bg-white p-6 shadow-sm"
                >
                  <p className="text-sm font-semibold uppercase text-brand-deep">
                    {reference.relationship}
                  </p>
                  <h3 id={headingId} className="mt-3 text-xl font-bold text-brand-navy">
                    {reference.agencyName}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-brand-slate">
                    {reference.location}
                  </p>
                  <p className="mt-5 text-base leading-7 text-brand-slate">{detail}</p>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </MotionSection>
  )
}
