import { useTranslation } from 'react-i18next'
import MotionSection from './MotionSection'
import SectionHeader from '@/components/ui/SectionHeader'

type TeamMember = {
  name: string
  role: string
  bio: string
  photo: string
  linkedinUrl: string
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function normalizeTeamMember(value: unknown): TeamMember | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Partial<Record<keyof TeamMember, unknown>>

  if (
    !isNonEmptyString(candidate.name) ||
    !isNonEmptyString(candidate.role) ||
    !isNonEmptyString(candidate.bio)
  ) {
    return null
  }

  return {
    name: candidate.name,
    role: candidate.role,
    bio: candidate.bio,
    photo: typeof candidate.photo === 'string' ? candidate.photo.trim() : '',
    linkedinUrl: typeof candidate.linkedinUrl === 'string' ? candidate.linkedinUrl.trim() : '',
  }
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('')
}

function isUsablePhoto(photo: string) {
  return photo.trim().length > 0
}

export default function Team() {
  const { t } = useTranslation()
  const rawMembers = t('team.members', { returnObjects: true }) as unknown
  const members = Array.isArray(rawMembers)
    ? rawMembers.map(normalizeTeamMember).filter((member): member is TeamMember => Boolean(member))
    : []

  return (
    <MotionSection
      id="team"
      role="region"
      aria-label={t('team.ariaLabel', { defaultValue: 'Sync Sirius team specialists' })}
      className="bg-[#F4F6FA]"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <SectionHeader
          variant="light"
          eyebrow={t('team.eyebrow', { defaultValue: 'Our Team' })}
          heading={t('team.headline', { defaultValue: 'Specialists in Airline Distribution' })}
          subtext={t('team.subtext', {
            defaultValue:
              'Our team brings decades of GDS, BSP, and travel agency operations experience.',
          })}
          className="section-intro-emphasis [&_h2]:scroll-mt-24"
        />

        {members.length > 0 && (
          <div
            data-team-grid="true"
            className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {members.map((member, index) => {
              const headingId = `team-member-${index}`

              return (
                <article
                  key={`${member.name}-${index}`}
                  aria-labelledby={headingId}
                  className="rounded-lg border border-brand-slate/20 bg-white p-6 shadow-sm"
                >
                  {isUsablePhoto(member.photo) ? (
                    <img
                      src={member.photo}
                      alt={`${member.name}, ${member.role}`}
                      width="320"
                      height="320"
                      loading="lazy"
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      data-team-photo-placeholder="true"
                      className="flex aspect-square w-full items-center justify-center rounded-lg bg-brand-navy/10 text-3xl font-bold text-brand-navy"
                    >
                      {getInitials(member.name)}
                    </div>
                  )}

                  <h3 id={headingId} className="mt-6 text-xl font-bold text-brand-navy">
                    {member.name}
                  </h3>
                  <p className="mt-2 text-sm font-semibold uppercase text-brand-deep">
                    {member.role}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-brand-slate">{member.bio}</p>
                  {isNonEmptyString(member.linkedinUrl) && (
                    <a
                      href={member.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('team.linkedinAriaLabel', {
                        name: member.name,
                        defaultValue: 'View {{name}} on LinkedIn',
                      })}
                      className="mt-4 inline-block text-sm font-semibold text-brand-deep underline underline-offset-2"
                    >
                      LinkedIn
                    </a>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </MotionSection>
  )
}
