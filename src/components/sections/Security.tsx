import { useTranslation } from 'react-i18next'
import MotionSection from './MotionSection'
import SectionHeader from '@/components/ui/SectionHeader'

const commitmentKeys = ['encryption', 'certification', 'insurance'] as const

const commitmentDefaults = {
  encryption: {
    title: 'Encrypted Transmission',
    description:
      'All website form submissions are encrypted in transit. SyncRevenue product connections use separately scoped, encrypted data handling outside this website.',
  },
  certification: {
    title: 'Certification Roadmap',
    description:
      'Sync Sirius is building toward formal security certification milestones including SOC 2 Type II, with the roadmap available during security review.',
  },
  insurance: {
    title: 'Contract Insurance',
    description:
      'Commercial agreements can include explicit data protection commitments and liability coverage requirements for commission recovery operations.',
  },
} as const

export default function Security() {
  const { t } = useTranslation()

  return (
    <MotionSection
      id="security"
      role="region"
      aria-labelledby="security-heading"
      className="bg-gradient-dark-section text-white"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <SectionHeader
          variant="dark"
          headingId="security-heading"
          eyebrow={t('security.eyebrow', { defaultValue: 'Security & Trust' })}
          heading={t('security.headline', { defaultValue: 'Your Data is Protected' })}
          subtext={t('security.subtext', {
            defaultValue:
              'Clear commitments for website inquiries and SyncRevenue product data handling.',
          })}
        />

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {commitmentKeys.map(key => (
            <article
              key={key}
              className="rounded-lg border border-white/15 bg-white/10 p-6 shadow-sm"
            >
              <h3 className="text-xl font-bold text-white">
                {t(`security.commitments.${key}.title`, {
                  defaultValue: commitmentDefaults[key].title,
                })}
              </h3>
              <p className="mt-4 text-sm leading-6 text-white/80">
                {t(`security.commitments.${key}.description`, {
                  defaultValue: commitmentDefaults[key].description,
                })}
              </p>
            </article>
          ))}
        </div>

        <article className="mt-6 rounded-lg border border-brand-highlight/40 bg-brand-navy/60 p-6">
          <h3 className="text-xl font-bold text-white">
            {t('security.separation.title', {
              defaultValue: 'Website and Product Data Stay Separate',
            })}
          </h3>
          <p className="mt-4 text-base leading-7 text-white/85">
            {t('security.separation.description', {
              defaultValue:
                'The website collects contact and demo inquiry fields only. SyncRevenue product data processing is separate, and GDS credentials never touch the website.',
            })}
          </p>
        </article>
      </div>
    </MotionSection>
  )
}
