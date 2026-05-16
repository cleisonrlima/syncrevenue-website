import { useTranslation } from 'react-i18next'

export default function TrustBar() {
  const { t } = useTranslation()

  const renderTrustItem = (index: number) => (
    <div
      key={index}
      className="bg-brand-navy/30 text-brand-offwhite px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap"
    >
      <svg
        className="w-4 h-4 flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        role="img"
        aria-label="verified"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>{t(`hero.trustBar.items.${index}`, { defaultValue: '' })}</span>
    </div>
  )

  return (
    <div className="mt-16 w-full" data-testid="trust-bar" suppressHydrationWarning>
      {/* < 640px (Tailwind sm): horizontal scroll */}
      <div className="sm:hidden flex gap-2 overflow-x-auto pb-2" data-testid="trust-bar-scroll">
        {Array.from({ length: 4 }).map((_, i) => renderTrustItem(i))}
      </div>

      {/* 640–767px (Tailwind sm to md): 2×2 grid */}
      <div className="hidden sm:grid md:hidden grid-cols-2 gap-4" data-testid="trust-bar-grid">
        {Array.from({ length: 4 }).map((_, i) => renderTrustItem(i))}
      </div>

      {/* >= 768px (Tailwind md+): single row */}
      <div className="hidden md:flex gap-6 justify-center flex-wrap" data-testid="trust-bar-row">
        {Array.from({ length: 4 }).map((_, i) => renderTrustItem(i))}
      </div>
    </div>
  )
}
