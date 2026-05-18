import { useTranslation } from 'react-i18next'
import MotionSection from './MotionSection'

/**
 * ClientReferences — Story 6.6 sober refresh.
 *
 * Source: Hero.html `.sec.sec-deep` block (lines 278–379, 730–802).
 *
 * Visual rebuild only — the agency allowlist (Story 1.9 R-B1) is preserved
 * verbatim. The component reads from the existing `references.*` i18n
 * namespace (NOT `clientReferences.*` as the spec wording suggests) because
 * `ClientReferences.allowlist.test.tsx` walks `data.references.items` — a
 * rename would break the R-B1 lock. Documented as a spec-vs-code reconciliation.
 *
 * Per-brand monogram gradients (chat line 510) were intentionally removed in
 * the sober palette pass — all three monograms use a neutral fill.
 *
 * Section id renamed from `client-references` → `clientes` to match the
 * navbar deep-link target wired by Story 6.2. The existing
 * `ClientReferences.test.tsx` assertion that expected `client-references`
 * is updated alongside this change.
 */

type ClientReference = {
  agencyName: string
  location: string
  relationship: string
  pillVariant?: 'default' | 'muted'
  testimonial?: string
  referenceDetail?: string
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function normalizeClientReference(value: unknown): ClientReference | null {
  if (!value || typeof value !== 'object') return null
  const c = value as Partial<Record<keyof ClientReference, unknown>>
  const body = isNonEmptyString(c.testimonial)
    ? { testimonial: c.testimonial }
    : isNonEmptyString(c.referenceDetail)
      ? { referenceDetail: c.referenceDetail }
      : null
  if (
    !isNonEmptyString(c.agencyName) ||
    !isNonEmptyString(c.location) ||
    !isNonEmptyString(c.relationship) ||
    !body
  ) {
    return null
  }
  const pillVariant: ClientReference['pillVariant'] =
    c.pillVariant === 'muted' ? 'muted' : 'default'
  return {
    agencyName: c.agencyName,
    location: c.location,
    relationship: c.relationship,
    pillVariant,
    ...body,
  }
}

function monogram(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]!.toUpperCase())
    .join('')
}

export default function ClientReferences() {
  const { t } = useTranslation()
  const raw = t('references.items', { returnObjects: true, defaultValue: [] }) as unknown
  const references = Array.isArray(raw)
    ? raw.map(normalizeClientReference).filter((r): r is ClientReference => Boolean(r))
    : []

  return (
    <MotionSection
      id="clientes"
      role="region"
      aria-label={t('references.ariaLabel', {
        defaultValue: 'Verified US travel agency references',
      })}
      className="bg-[#0A0B22] text-white scroll-mt-24"
    >
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-14 py-24 lg:py-[100px]">
        <div className="mx-auto mb-14 max-w-[760px] text-center">
          <div className="inline-flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.12em] text-white/50">
            <span aria-hidden="true" className="inline-block h-px w-6 bg-white/30" />
            {t('references.eyebrow', { defaultValue: 'Client References' })}
          </div>
          <h2 className="mt-4 text-[clamp(1.9rem,3.4vw,2.8rem)] font-bold leading-tight text-white">
            {t('references.headline', { defaultValue: 'Trusted by real' })}{' '}
            <span className="text-[var(--accent-soft)]" data-testid="references-accent">
              {t('references.headlineAccent', { defaultValue: 'agencies' })}
            </span>
          </h2>
          <p className="mt-5 mx-auto max-w-[62ch] text-[15px] leading-[1.65] text-white/[0.65]">
            {t('references.subtext', {
              defaultValue: 'Named references are shared with approval.',
            })}
          </p>
        </div>

        {references.length > 0 && (
          <div
            data-reference-grid="true"
            data-testid="quotes-grid"
            className="grid grid-cols-1 min-[640px]:grid-cols-2 min-[960px]:grid-cols-3 gap-[18px]"
          >
            {references.map((reference, index) => {
              const headingId = `client-reference-${index}`
              const body = reference.testimonial ?? reference.referenceDetail
              const isMuted = reference.pillVariant === 'muted'
              return (
                <article
                  key={`${reference.agencyName}-${index}`}
                  aria-labelledby={headingId}
                  data-testid={`quote-card-${index}`}
                  className="relative flex flex-col rounded-[14px] border border-[var(--line)] bg-white/[0.03] px-7 pt-[30px] pb-6 motion-safe:transition-colors motion-safe:duration-150 hover:border-[var(--line-strong)] hover:bg-white/[0.05]"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-5 top-3 select-none font-serif text-[64px] leading-none text-white/[0.08]"
                  >
                    “
                  </span>

                  <span
                    data-testid={`quote-pill-${index}`}
                    className={
                      'inline-flex w-fit items-center rounded-full border border-[var(--line)] bg-white/[0.04] px-[11px] py-[5px] text-[11px] uppercase tracking-[0.04em] ' +
                      (isMuted ? 'text-white/55' : 'text-white/70')
                    }
                  >
                    {reference.relationship}
                  </span>

                  <p
                    data-testid={`quote-body-${index}`}
                    className={
                      'mt-5 text-[15px] leading-[1.65] ' +
                      (isMuted ? 'italic text-white/[0.65]' : 'text-white/[0.85]')
                    }
                  >
                    {body}
                  </p>

                  <div className="mt-auto flex items-center gap-3 pt-5 border-t border-[var(--line)]">
                    <div
                      aria-hidden="true"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[var(--line-strong)] bg-white/[0.06] text-white font-bold text-[13px]"
                    >
                      {monogram(reference.agencyName)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3
                        id={headingId}
                        className="text-[14.5px] font-semibold text-white leading-tight"
                      >
                        {reference.agencyName}
                      </h3>
                      <div className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-white/50">
                        <svg
                          className="h-[11px] w-[11px] shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M12 22s-7-7-7-12a7 7 0 0114 0c0 5-7 12-7 12z" />
                          <circle cx="12" cy="10" r="2.5" />
                        </svg>
                        <span className="truncate">{reference.location}</span>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        <div className="mt-14 flex justify-center" data-testid="ref-cta">
          <a
            href="#contato"
            className="group inline-flex items-center gap-2 rounded-[10px] border border-[var(--line-strong)] bg-transparent px-[22px] py-3 text-[14px] font-semibold text-white motion-safe:transition-colors motion-safe:duration-150 hover:bg-white/[0.04]"
          >
            {t('references.cta', { defaultValue: 'Request References' })}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-[3px]"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </MotionSection>
  )
}
