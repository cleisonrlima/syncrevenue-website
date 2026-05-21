import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import MotionSection from './MotionSection'
import { getPublicTeam, type PublicTeamMemberRow } from '@/lib/api'
import { useLocaleStore } from '@/store/useLocaleStore'

/**
 * Team — Story 6.7 sober refresh.
 *
 * Source: Hero.html `.team` / `.tm` / `.tm-photo` / `.tm-status` / `.tm-body` /
 * `.tm-foot` (lines 381–447, 804–857).
 *
 * Preserves the existing API-backed data flow (Story 4.4 — `/api/team`) and the
 * Story 1.8 LinkedIn aria-label contract. Visual layer rebuilt: dark-bg section,
 * 2-col horizontal cards (photo 200px / body), status pill overlaid on photo
 * (static green dot — pulsing keyframes explicitly removed per chat line 510),
 * LinkedIn icon-button in the footer (34×34, hover swaps to LinkedIn blue).
 *
 * Section id renamed `team` → `equipe` to match the Epic 6 PT-BR-first id
 * vocabulary. The Story 6.2 navbar doesn't link to it yet (no `#equipe` anchor
 * in the nav list), so the rename has no external consumers beyond
 * `Hero.story-1-8.e2e.test.tsx` and `Home.test.tsx` which both follow.
 */

type DisplayMember = {
  id: number
  name: string
  role: string
  bio: string
  experience: string
  photo: string
  linkedinUrl: string
}

function pickLocaleFields(row: PublicTeamMemberRow, locale: string) {
  switch (locale) {
    case 'pt-BR':
      return { role: row.role_pt, bio: row.bio_pt, experience: row.experience_pt }
    case 'es':
      return { role: row.role_es, bio: row.bio_es, experience: row.experience_es }
    default:
      return { role: row.role_en, bio: row.bio_en, experience: row.experience_en }
  }
}

function toDisplayMember(row: PublicTeamMemberRow, locale: string): DisplayMember {
  const { role, bio, experience } = pickLocaleFields(row, locale)
  return {
    id: row.id,
    name: row.name,
    role,
    bio,
    experience,
    photo: row.photo_url ?? '',
    linkedinUrl: row.linkedin ?? '',
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export default function Team() {
  const { t } = useTranslation()
  const locale = useLocaleStore(state => state.locale)
  const [rows, setRows] = useState<PublicTeamMemberRow[]>([])

  useEffect(() => {
    let cancelled = false
    void getPublicTeam()
      .then(data => {
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
    .map(row => toDisplayMember(row, locale))
    .filter(m => m.name.length > 0 && m.role.length > 0 && m.bio.length > 0)

  return (
    <MotionSection
      id="equipe"
      role="region"
      aria-label={t('team.ariaLabel', { defaultValue: 'Sync Sirius team specialists' })}
      className="sec bg-[var(--ink)] text-white scroll-mt-24"
    >
      <div className="sec-inner mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-14 py-24 lg:py-[100px]">
        <header className="sec-head mx-auto mb-14 max-w-[760px] text-center">
          <div className="sec-eyebrow inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/50">
            <span aria-hidden="true" className="inline-block h-px w-6 bg-white/30" />
            {t('team.eyebrow', { defaultValue: 'Our Team' })}
          </div>
          <h2 className="sec-h mt-4 text-[clamp(1.9rem,3.4vw,2.8rem)] font-bold leading-tight text-white scroll-mt-24">
            {t('team.headline', { defaultValue: 'Specialists in' })}{' '}
            <span className="accent text-[var(--accent-soft)]" data-testid="team-headline-accent">
              {t('team.headlineAccent', { defaultValue: 'airline distribution' })}
            </span>
          </h2>
          <p className="sec-sub mt-5 mx-auto max-w-[62ch] text-[15px] leading-[1.65] text-white/[0.65]">
            {t('team.subtext', { defaultValue: '' })}
          </p>
        </header>

        {members.length > 0 && (
          <div
            data-team-grid="true"
            className="team grid grid-cols-1 min-[760px]:grid-cols-2 gap-6 max-w-[1080px] mx-auto"
          >
            {members.map(member => {
              const headingId = `team-member-${member.id}`
              return (
                <article
                  key={member.id}
                  aria-labelledby={headingId}
                  data-testid={`team-card-${member.id}`}
                  className="tm grid grid-cols-1 min-[560px]:grid-cols-[200px_1fr] overflow-hidden rounded-[14px] border border-[var(--line)] bg-white/[0.03] motion-safe:transition-colors motion-safe:duration-150 hover:border-[var(--line-strong)] hover:bg-white/[0.045]"
                >
                  <div className="tm-photo relative aspect-square min-h-[200px] overflow-hidden bg-[#0A0B22]">
                    {isUsablePhoto(member.photo) ? (
                      <img
                        src={member.photo}
                        alt={`${member.name}, ${member.role}`}
                        width="200"
                        height="200"
                        loading="lazy"
                        className="h-full w-full object-cover"
                        style={{ filter: 'saturate(0.92)' }}
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        data-team-photo-placeholder="true"
                        className="tm-photo-fallback flex h-full w-full items-center justify-center bg-[var(--accent)] text-[60px] font-bold text-white"
                      >
                        {getInitials(member.name)}
                      </div>
                    )}
                    <span
                      data-testid={`team-status-${member.id}`}
                      className="tm-status absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-[rgba(8,8,28,0.75)] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.04em] text-white before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#5BC98C] before:content-['']"
                    >
                      {t('team.statusLabel', { defaultValue: 'available' })}
                    </span>
                  </div>

                  <div className="tm-body flex flex-col px-[26px] pt-[26px] pb-[22px]">
                    <h3
                      id={headingId}
                      className="tm-name mb-2 text-[20px] font-bold tracking-[-0.02em] leading-tight text-white"
                    >
                      {member.name}
                    </h3>
                    <p className="tm-role mb-4 text-[11.5px] font-semibold uppercase tracking-[0.04em] text-white/55">
                      {member.role}
                    </p>
                    <p className="tm-bio mb-[18px] flex-1 text-[13.5px] leading-[1.65] text-white/70">
                      {member.bio}
                    </p>
                    <div className="tm-foot mt-auto flex items-center gap-2.5 border-t border-[var(--line)] pt-3.5">
                      {isNonEmptyString(member.linkedinUrl) && (
                        <a
                          href={member.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid={`team-linkedin-${member.id}`}
                          aria-label={t('team.linkedinAriaLabel', {
                            name: member.name,
                            defaultValue: 'View {{name}} on LinkedIn',
                          })}
                          className="icon-btn linkedin inline-flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-[var(--line-strong)] text-white/75 motion-safe:transition-colors motion-safe:duration-150 hover:border-[#0A66C2] hover:bg-[#0A66C2] hover:text-white"
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 11.01-4.13 2.07 2.07 0 010 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45C23.21 24 24 23.23 24 22.28V1.72C24 .77 23.21 0 22.22 0z" />
                          </svg>
                        </a>
                      )}
                      <span className="tm-foot-meta ml-auto text-[11px] text-white/40">
                        {member.experience}
                      </span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </MotionSection>
  )
}
