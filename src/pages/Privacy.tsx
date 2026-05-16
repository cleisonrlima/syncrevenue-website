import { useTranslation } from 'react-i18next'
import { useDocumentMeta } from '@/components/SEO'

const policySections = [
  'dataCollection',
  'dataUse',
  'storageAccess',
  'dataRetention',
  'cookies',
  'gdsData',
  'lgpdRights',
  'ccpaRights',
  'contact',
] as const

type PolicySectionKey = (typeof policySections)[number]

type PolicySection = {
  title?: unknown
  body?: unknown
  email?: unknown
}

function normalizeBody(body: unknown) {
  if (Array.isArray(body)) {
    return body.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  }

  return typeof body === 'string' && body.trim().length > 0 ? [body] : []
}

export default function Privacy() {
  useDocumentMeta({
    titleKey: 'seo.privacy.title',
    descriptionKey: 'seo.privacy.description',
    ogTitleKey: 'seo.privacy.ogTitle',
    ogDescriptionKey: 'seo.privacy.ogDescription',
    path: '/privacy',
  })

  const { t } = useTranslation()
  const sections = t('privacy.sections', { returnObjects: true }) as Partial<Record<PolicySectionKey, PolicySection>>
  const title = t('privacy.title')

  return (
    <div className="min-h-screen bg-brand-navy text-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <article aria-label={title} className="max-w-4xl">
          <header className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">{title}</h1>
            <p className="text-brand-muted text-sm mb-6">{t('privacy.lastUpdated')}</p>
            <p className="text-brand-offwhite leading-relaxed text-base sm:text-lg">{t('privacy.intro')}</p>
          </header>

          <div className="space-y-8">
            {policySections.map((sectionKey) => {
              const section = sections[sectionKey]
              const bodyItems = normalizeBody(section?.body)
              const email = typeof section?.email === 'string' ? section.email : undefined

              return (
                <section key={sectionKey} aria-labelledby={`privacy-${sectionKey}`}>
                  <h2 id={`privacy-${sectionKey}`} className="text-xl font-semibold mb-3">
                    {typeof section?.title === 'string' ? section.title : t(`privacy.sections.${sectionKey}.title`)}
                  </h2>
                  {bodyItems.length > 1 ? (
                    <ul className="list-disc pl-5 space-y-2 text-brand-offwhite leading-relaxed">
                      {bodyItems.map((item, index) => (
                        <li key={`${sectionKey}-body-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    bodyItems.map((item, index) => (
                      <p key={`${sectionKey}-body-${index}`} className="text-brand-offwhite leading-relaxed">
                        {item}
                      </p>
                    ))
                  )}
                  {email && (
                    <a
                      href={`mailto:${email}`}
                      className="mt-3 inline-block text-brand-electric-blue underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
                    >
                      {email}
                    </a>
                  )}
                </section>
              )
            })}
          </div>
        </article>
      </div>
    </div>
  )
}
