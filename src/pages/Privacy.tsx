import { useTranslation } from 'react-i18next'

export default function Privacy() {
  const { t } = useTranslation()

  return (
    <div className="bg-brand-navy text-white min-h-screen">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-3xl font-bold mb-2">{t('privacy.title', { defaultValue: 'Privacy Policy' })}</h1>
        <p className="text-brand-muted text-sm mb-8">{t('privacy.lastUpdated', { defaultValue: 'Last updated' })}</p>
        <p className="mb-10 text-brand-offwhite">{t('privacy.intro', { defaultValue: 'This Privacy Policy explains how we collect, use, and protect your personal information.' })}</p>
        {(['dataCollection', 'dataUse', 'dataRetention', 'gdsData', 'contact'] as const).map((section) => (
          <div key={section} className="mb-8">
            <h2 className="text-xl font-semibold mb-3">{t(`privacy.${section}.title`, { defaultValue: section.charAt(0).toUpperCase() + section.slice(1).replace(/([A-Z])/g, ' $1') })}</h2>
            <p className="text-brand-offwhite leading-relaxed">{t(`privacy.${section}.body`, { defaultValue: 'Information not available in this language.' })}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
