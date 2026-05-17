import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import MotionSection from './MotionSection'
import SectionHeader from '@/components/ui/SectionHeader'
import { getPublicTeam, type PublicTeamMemberRow } from '@/lib/api'
import { useLocaleStore } from '@/store/useLocaleStore'

type DisplayMember = {
  id: number
  name: string
  role: string
  bio: string
  photo: string
  linkedinUrl: string
}

function pickLocaleFields(row: PublicTeamMemberRow, locale: string) {
  switch (locale) {
    case 'pt-BR':
      return { role: row.role_pt, bio: row.bio_pt }
    case 'es':
      return { role: row.role_es, bio: row.bio_es }
    default:
      return { role: row.role_en, bio: row.bio_en }
  }
}

function toDisplayMember(row: PublicTeamMemberRow, locale: string): DisplayMember {
  const { role, bio } = pickLocaleFields(row, locale)
  return {
    id: row.id,
    name: row.name,
    role,
    bio,
    photo: row.photo_url ?? '',
    linkedinUrl: row.linkedin ?? '',
  }
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function isUsablePhoto(photo: string) {
  return photo.trim().length > 0
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export default function Team() {
  const { t } = useTranslation()
  const locale = useLocaleStore((state) => state.locale)
  const [rows, setRows] = useState<PublicTeamMemberRow[]>([])

  useEffect(() => {
    let cancelled = false
    void getPublicTeam()
      .then((data) => {
        if (!cancelled) setRows(data)
      })
      .catch(() => {
        if (!cancelled) setRows([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const members: DisplayMember[] = rows
    .map((row) => toDisplayMember(row, locale))
    .filter((member) => member.name.length > 0 && member.role.length > 0 && member.bio.length > 0)

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
            {members.map((member) => {
              const headingId = `team-member-${member.id}`

              return (
                <article
                  key={member.id}
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
