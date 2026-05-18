import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export type EncryptedTransitNoteProps = {
  className?: string
  /** Override the i18n key (defaults to `forms.encryptedNote`). */
  i18nKey?: string
  /** Fallback copy if the i18n key fails to resolve. */
  fallback?: string
}

const SHIELD_PATH = 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'

/**
 * Story 6.9 — Shared encrypted-in-transit footer note for Demo + Contact forms.
 * Matches design-handoff `.form-note` (shield SVG + small muted copy).
 */
export default function EncryptedTransitNote({
  className,
  i18nKey = 'forms.encryptedNote',
  fallback = 'Encrypted in transit. Your data is protected.',
}: EncryptedTransitNoteProps) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'form-note inline-flex items-center gap-[7px] text-[11.5px] font-medium text-white/45',
        className,
      )}
      data-encrypted-note
    >
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        width="13"
        height="13"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0"
      >
        <path d={SHIELD_PATH} />
      </svg>
      <span>{t(i18nKey, { defaultValue: fallback })}</span>
    </span>
  )
}
