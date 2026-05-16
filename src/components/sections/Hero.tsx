import { useTranslation } from 'react-i18next'
import GradientButton from '@/components/ui/GradientButton'
import StatRow from './StatRow'
import TrustBar from './TrustBar'

export default function Hero() {
  const { t } = useTranslation()

  const handleDemoCta = () => {
    try {
      const demoSection = document.getElementById('demo-scheduler')
      if (demoSection) {
        demoSection.scrollIntoView({ behavior: 'smooth' })
      } else if (typeof window !== 'undefined' && window.top !== window) {
        window.parent.location.href = '/#demo-scheduler'
      } else {
        window.location.href = '/#demo-scheduler'
      }
    } catch (e) {
      console.warn('Failed to scroll to demo-scheduler', e)
    }
  }

  return (
    <section
      id="hero"
      role="region"
      className="relative min-h-[70vh] md:min-h-[80vh] bg-gradient-to-b from-[#0D0D3A] to-[#080820] overflow-hidden text-white"
      suppressHydrationWarning
    >
      {/* Radial glow top-right */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(0, 165, 240, 0.2), transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        {/* Badge */}
        <div className="mb-6 inline-block bg-brand-slate/20 text-brand-offwhite px-3 py-1 rounded-full text-sm">
          {t('hero.badge', { defaultValue: '' })}
        </div>

        {/* H1 — responsive scaling (mobile 32-36px per UX spec) */}
        <h1 className="text-[2rem] leading-tight sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 max-w-2xl">
          {t('hero.headline', { defaultValue: '' })}
        </h1>

        {/* Subheadline */}
        <p className="text-lg text-brand-offwhite mb-8 max-w-2xl">
          {t('hero.subheadline', { defaultValue: '' })}
        </p>

        {/* CTA + Tertiary Link */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <GradientButton
            size="lg"
            onClick={handleDemoCta}
            className="w-full min-h-[44px] sm:w-auto"
          >
            {t('hero.cta', { defaultValue: '' })}
          </GradientButton>
          <a
            href="#"
            className="text-brand-electric-blue hover:underline py-4 px-8 text-center sm:self-center"
          >
            {t('hero.tertiaryLink', { defaultValue: '' })}
          </a>
        </div>

        {/* StatRow */}
        <StatRow />

        {/* TrustBar */}
        <TrustBar />
      </div>
    </section>
  )
}
