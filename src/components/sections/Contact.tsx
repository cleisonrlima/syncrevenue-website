import { useTranslation } from 'react-i18next'
import { type ReactNode } from 'react'
import MotionSection from './MotionSection'
import ContactForm from './ContactForm'

type ChannelKind = 'email' | 'phone' | 'address'

type Channel = {
  label: string
  value: string
  kind: ChannelKind
}

const ICON_BOX_CLASS =
  'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[9px] text-[var(--accent-soft)] bg-[var(--accent-dim)]'

const ChannelIcon = ({ kind }: { kind: ChannelKind }) => {
  const stroke = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    width: 16,
    height: 16,
  }
  if (kind === 'email') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...stroke}>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    )
  }
  if (kind === 'phone') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...stroke}>
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...stroke}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

const ClockIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    width={18}
    height={18}
  >
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22,4 12,14.01 9,11.01" />
  </svg>
)

function ChannelRow({ channel }: { channel: Channel }) {
  const labelNode = (
    <div>
      <div className="text-[12px] font-semibold uppercase tracking-[0.04em] text-white/55">
        {channel.label}
      </div>
      <div className="mt-[2px] text-[14px] leading-[1.5] text-[var(--accent-soft)]">
        {channel.value}
      </div>
    </div>
  )

  const wrapClass =
    'channel flex items-center gap-[14px] rounded-[10px] px-[12px] py-[10px] no-underline transition-colors duration-150 hover:bg-white/[0.025]'

  const icon = (
    <div className={ICON_BOX_CLASS}>
      <ChannelIcon kind={channel.kind} />
    </div>
  )

  let valueWrap: ReactNode = labelNode
  let row: ReactNode

  if (channel.kind === 'email') {
    row = (
      <a className={wrapClass} href={`mailto:${channel.value}`}>
        {icon}
        {valueWrap}
      </a>
    )
  } else if (channel.kind === 'phone') {
    const telHref = `tel:${channel.value.replace(/[^+\d]/g, '')}`
    row = (
      <a className={wrapClass} href={telHref}>
        {icon}
        {valueWrap}
      </a>
    )
  } else {
    valueWrap = (
      <div>
        <div className="text-[12px] font-semibold uppercase tracking-[0.04em] text-white/55">
          {channel.label}
        </div>
        <span className="mt-[2px] block text-[14px] leading-[1.5] text-white/80">
          {channel.value}
        </span>
      </div>
    )
    row = (
      <div className={wrapClass}>
        {icon}
        {valueWrap}
      </div>
    )
  }

  return row
}

export default function Contact() {
  const { t } = useTranslation()

  const channels: Channel[] = [0, 1, 2].map(i => ({
    label: t(`contact.channels.${i}.label`),
    value: t(`contact.channels.${i}.value`),
    kind: t(`contact.channels.${i}.kind`) as ChannelKind,
  }))

  return (
    <MotionSection
      id="contato"
      role="region"
      aria-labelledby="contact-heading"
      className="sec relative bg-[var(--bg)] text-white"
    >
      <div className="sec-inner mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <header className="sec-head mb-[40px] max-w-[720px]">
          <span className="sec-eyebrow text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--accent-soft)]">
            {t('contact.eyebrow', { defaultValue: 'Contact' })}
          </span>
          <h2
            id="contact-heading"
            className="sec-h mt-[10px] text-[clamp(28px,3.4vw,40px)] font-bold leading-[1.15] text-white"
          >
            {t('contact.heading.text', { defaultValue: 'Talk to' })}{' '}
            <span className="accent text-[var(--accent-soft)]">
              {t('contact.heading.accent', { defaultValue: 'SyncSirius' })}
            </span>
          </h2>
          <p className="sec-sub mt-[14px] text-[15px] leading-[1.6] text-white/65">
            {t('contact.subhead', {
              defaultValue:
                'For commercial questions, support, partnerships, or press — your message reaches the right team.',
            })}
          </p>
        </header>

        <div className="form-grid grid max-w-[1180px] grid-cols-1 items-start gap-[40px] min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
          <aside className="form-info">
            <div className="channels flex flex-col gap-[18px]">
              {channels.map((channel, idx) => (
                <ChannelRow key={idx} channel={channel} />
              ))}
            </div>

            <div className="info-card mt-[24px] flex items-start gap-[14px] rounded-[12px] border border-[var(--line-strong)] bg-white/[0.025] p-[16px]">
              <div className="info-card-ico flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[var(--accent-dim)] text-[var(--accent-soft)]">
                <ClockIcon />
              </div>
              <div>
                <div className="info-card-t text-[13px] font-semibold text-white">
                  {t('contact.infoCard.title', { defaultValue: 'Average response time' })}
                </div>
                <div className="info-card-s mt-[3px] text-[13px] text-white/60">
                  {t('contact.infoCard.subtitle', {
                    defaultValue: 'Under 4 hours on business days.',
                  })}
                </div>
              </div>
            </div>
          </aside>

          <div>
            <ContactForm />
          </div>
        </div>
      </div>

    </MotionSection>
  )
}
