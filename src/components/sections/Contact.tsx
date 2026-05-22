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
  'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[9px] text-[var(--accent-brand-soft)] bg-[var(--accent-brand-dim)]'

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
      <div className="text-[11.5px] font-medium text-white/50 leading-tight">
        {channel.label}
      </div>
      <div className="mt-[3px] text-[14px] font-semibold leading-tight text-white">
        {channel.value}
      </div>
    </div>
  )

  const wrapClass =
    'channel flex items-center gap-[14px] rounded-[10px] border border-[var(--line)] bg-white/[0.03] px-4 py-[14px] no-underline transition-colors duration-150 hover:border-[var(--line-strong)] hover:bg-white/[0.05]'

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
        <div className="text-[11.5px] font-medium text-white/50 leading-tight">
          {channel.label}
        </div>
        <span className="mt-[3px] block text-[14px] font-semibold leading-tight text-white">
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
      className="sec relative bg-[var(--ink)] text-white"
    >
      <div className="sec-inner mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-14 py-24 lg:py-[100px]">
        <header className="sec-head mx-auto mb-14 max-w-[760px] text-center">
          <div className="sec-eyebrow inline-flex items-center justify-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/50">
            <span aria-hidden="true" className="inline-block h-px w-6 bg-white/30" />
            {t('contact.eyebrow', { defaultValue: 'Contact' })}
          </div>
          <h2
            id="contact-heading"
            className="sec-h mt-[18px] text-[clamp(1.9rem,3.4vw,2.8rem)] font-bold leading-tight tracking-[-0.025em] text-white"
          >
            {t('contact.heading.text', { defaultValue: 'Talk to' })}{' '}
            <span className="accent text-[var(--accent-brand-soft)]">
              {t('contact.heading.accent', { defaultValue: 'SyncSirius' })}
            </span>
          </h2>
          <p className="sec-sub mt-5 mx-auto max-w-[62ch] text-[15px] leading-[1.65] text-white/[0.65]">
            {t('contact.subhead', {
              defaultValue:
                'For commercial questions, support, partnerships, or press — your message reaches the right team.',
            })}
          </p>
        </header>

        <div className="form-grid grid mx-auto max-w-[1180px] grid-cols-1 items-start gap-[40px] min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
          <aside className="form-info">
            <div className="channels flex flex-col gap-[10px]">
              {channels.map((channel, idx) => (
                <ChannelRow key={idx} channel={channel} />
              ))}
            </div>

            <div className="info-card mt-6 flex items-center gap-[14px] rounded-[10px] border border-[var(--line)] bg-white/[0.03] px-5 py-[18px]">
              <div className="info-card-ico flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[9px] bg-[var(--accent-brand-dim)] text-[var(--accent-brand-soft)]">
                <ClockIcon />
              </div>
              <div>
                <div className="info-card-t text-[13.5px] font-semibold text-white leading-tight">
                  {t('contact.infoCard.title', { defaultValue: 'Average response time' })}
                </div>
                <div className="info-card-s mt-[3px] text-[12px] text-white/55 leading-snug">
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
