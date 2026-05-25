import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { ImageWithFallback } from '@/components/figma/ImageWithFallback'
import { useDocumentMeta } from '@/components/SEO'

const LOGO_SRC = '/logos/syncsirius-logo.png'

export default function LandingV2() {
  useDocumentMeta({
    titleKey: 'seo.landing.title',
    descriptionKey: 'seo.landing.description',
    ogTitleKey: 'seo.landing.ogTitle',
    ogDescriptionKey: 'seo.landing.ogDescription',
    path: '/v2',
  })

  return (
    <div className="min-h-screen bg-[#020204] text-slate-50 font-sans selection:bg-indigo-500/30">
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-[#020204]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2" aria-label="Sync Sirius home">
            <ImageWithFallback
              src={LOGO_SRC}
              alt="Sync Sirius logo"
              className="h-8 w-auto object-contain"
            />
          </Link>
          <Link
            to="/demo"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_28px_rgba(99,102,241,0.35)] transition-colors hover:from-indigo-400 hover:to-purple-500"
          >
            Schedule a Demo
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </nav>

      <main className="relative flex min-h-screen items-center overflow-hidden pt-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-1/4 h-[520px] w-[520px] rounded-full bg-indigo-900/20 blur-[120px]" />
          <div className="absolute right-1/5 top-1/3 h-[420px] w-[420px] rounded-full bg-purple-900/20 blur-[110px]" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <section aria-labelledby="v2-hero-heading">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-sm text-indigo-300">
              <span className="h-2 w-2 rounded-full bg-indigo-400" aria-hidden="true" />
              SyncRevenue 2.0 is now live
            </div>

            <h1
              id="v2-hero-heading"
              className="mb-6 max-w-[12ch] text-5xl font-extrabold leading-[1.08] tracking-tight text-white md:text-7xl"
            >
              Recover lost revenue.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                Instantly.
              </span>
            </h1>

            <p className="mb-10 max-w-xl text-lg leading-relaxed text-slate-400 md:text-xl">
              The automated commission auditing platform that finds missing agency revenue before it hits your bottom line.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                to="/demo"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-[0_0_28px_rgba(99,102,241,0.35)] transition-colors hover:from-indigo-400 hover:to-purple-500"
              >
                Schedule a Demo
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-400">
              {['Commission recovery', 'Payout accuracy', 'Forecasting insights'].map(item => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400" aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
          </section>

          <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-2xl lg:block">
            <img
              src="/hero/airplane.jpg"
              alt="Analytics dashboard preview"
              className="h-[450px] w-full rounded-xl object-cover opacity-85"
            />
          </div>
        </div>
      </main>
    </div>
  )
}
