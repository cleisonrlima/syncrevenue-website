import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CheckCircle2, Building2, Mail, User, Phone } from 'lucide-react'
import { motion } from 'motion/react'
import { ImageWithFallback } from '@/components/figma/ImageWithFallback'
import { useDocumentMeta } from '@/components/SEO'
import LanguageSwitcher from '@/i18n/LanguageSwitcher'

/**
 * Story 7.4 (AC 4, 5, 6): Verbatim port of the Figma 'teste' DemoForm page
 * (Figma Make file `66Wb2MAv5PLOBSJLoFM3E3`, source path
 * `src/app/pages/DemoForm.tsx`). Mounted at `/demo` per Story 7.2.
 *
 * Figma source was fetched via the `ReadMcpResourceTool` against
 * `file://figma/make/source/66Wb2MAv5PLOBSJLoFM3E3/src/app/pages/DemoForm.tsx`
 * on 2026-05-22 (Story 7.4 dev pass). Caveats from Story 7.2's port apply —
 * `get_design_context` only returns resource link descriptors for Figma Make
 * files; the resource content is fetched separately via `ReadMcpResourceTool`.
 *
 * Documented swaps from the verbatim source:
 *   - `react-router` import → `react-router-dom` (matches the rest of the
 *     repo and the route registration in `src/App.tsx`)
 *   - `../components/figma/ImageWithFallback` → `@/components/figma/ImageWithFallback`
 *   - `logo1` import from `../../imports/1351_rev_1.jpg` replaced by the
 *     canonical `/logos/syncsirius-logo.png` asset published under
 *     `public/logos/` by Story 7.2.
 *   - The `useDocumentMeta` call from the Story 7.2 placeholder is preserved
 *     so `/demo` continues to publish the i18n-scoped meta tags. Keys use
 *     `defaultValue` fallbacks inside the SEO helper until Story 7.5 extracts
 *     real translations.
 *   - Inputs gained `id`/`name` attributes and `<label>` elements gained
 *     `htmlFor` bindings (the Figma source left labels and inputs visually
 *     associated but not programmatically linked). This is a structural
 *     accessibility tightening; field copy, ordering, and visual layout
 *     are unchanged.
 *
 * Preserved verbatim (do NOT silently change — owned by other stories):
 *   - legacy Figma brand name occurrences — Story 7.6 owns the rewrite
 *     to "SyncRevenue"
 *   - All commission-audit / agency copy — Story 7.6 owns the travel-commission
 *     rewrite
 *   - The post-submit `<motion.div>` confirmation panel transition
 *     (`initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}}`)
 *
 * Form wiring: `handleSubmit` calls `setSubmitted(true)` only — there is NO
 * backend API call this story (AC 4). Real demo-request submission lives on
 * the `/` Home DemoForm via the Epic 2 `useDemo` hook; this `/demo` surface
 * is the visual port only. Wiring the form to the backend is out of scope
 * for Epic 7 entirely.
 */

const LOGO_SRC = '/logos/syncsirius-logo.png'

export default function Demo() {
  const { t } = useTranslation()

  useDocumentMeta({
    titleKey: 'seo.demo.title',
    descriptionKey: 'seo.demo.description',
    ogTitleKey: 'seo.demo.ogTitle',
    ogDescriptionKey: 'seo.demo.ogDescription',
    path: '/demo',
  })

  const [submitted, setSubmitted] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-50 font-sans flex flex-col selection:bg-indigo-500/30">
      <nav className="h-20 border-b border-white/10 flex items-center px-6 shrink-0 bg-[#0A0A0A]/80 backdrop-blur-lg fixed top-0 inset-x-0 z-50">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ImageWithFallback
              src={LOGO_SRC}
              alt={t('figmaDemo.nav.logoAlt', 'Sync Sirius logo')}
              className="h-8 w-auto rounded object-contain"
            />
            <span className="text-xl font-bold tracking-tight text-white">
              {t('figmaDemo.nav.brand', 'SyncRevenue')}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              to="/"
              className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('figmaDemo.nav.backToHome', 'Back to Home')}
            </Link>
          </div>
        </div>
      </nav>

      <section className="flex-1 flex items-center justify-center p-6 pt-28 pb-20 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-indigo-500/20 via-purple-500/10 to-pink-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 lg:gap-24 items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm mb-6">
              <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
              {t('figmaDemo.hero.badge', 'Live Demo')}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
              {t('figmaDemo.hero.heading', 'See SyncRevenue in action.')}
            </h1>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              {t(
                'figmaDemo.hero.description',
                'Discover how our automated commission auditing platform can recover lost revenue and streamline your payouts. Fill out the form, and our team will get in touch to schedule a personalized walkthrough.',
              )}
            </p>

            <div className="space-y-6">
              {[
                t('figmaDemo.hero.bullet1', 'Identify missing commission payments before close'),
                t('figmaDemo.hero.bullet2', 'Automate agent payouts with 100% accuracy'),
                t('figmaDemo.hero.bullet3', 'Visualize agency performance and global forecasting'),
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-indigo-400 shrink-0" />
                  <span className="text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#12121A] border border-white/10 p-8 rounded-2xl shadow-2xl relative">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {t('figmaDemo.success.heading', 'Request Received')}
                </h3>
                <p className="text-slate-400 mb-8">
                  {t(
                    'figmaDemo.success.body',
                    'Thanks for your interest! One of our product specialists will be in touch shortly to schedule your demo.',
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
                >
                  {t('figmaDemo.success.reset', 'Submit another request')}
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label
                      htmlFor="demo-first-name"
                      className="text-sm font-medium text-slate-300 block"
                    >
                      {t('figmaDemo.form.firstName', 'First Name')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="w-5 h-5 text-slate-500" />
                      </div>
                      <input
                        id="demo-first-name"
                        name="firstName"
                        required
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                        placeholder={t('figmaDemo.form.placeholders.firstName', 'John')}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="demo-last-name"
                      className="text-sm font-medium text-slate-300 block"
                    >
                      {t('figmaDemo.form.lastName', 'Last Name')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="w-5 h-5 text-slate-500" />
                      </div>
                      <input
                        id="demo-last-name"
                        name="lastName"
                        required
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                        placeholder={t('figmaDemo.form.placeholders.lastName', 'Smith')}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="demo-email" className="text-sm font-medium text-slate-300 block">
                    {t('figmaDemo.form.workEmail', 'Work Email')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-slate-500" />
                    </div>
                    <input
                      id="demo-email"
                      name="email"
                      required
                      type="email"
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      placeholder={t('figmaDemo.form.placeholders.email', 'john@agency.com')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="demo-company"
                    className="text-sm font-medium text-slate-300 block"
                  >
                    {t('figmaDemo.form.companyName', 'Company Name')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="w-5 h-5 text-slate-500" />
                    </div>
                    <input
                      id="demo-company"
                      name="company"
                      required
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      placeholder={t('figmaDemo.form.placeholders.company', 'Acme Agency')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="demo-phone" className="text-sm font-medium text-slate-300 block">
                    {t('figmaDemo.form.phoneNumber', 'Phone Number (Optional)')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="w-5 h-5 text-slate-500" />
                    </div>
                    <input
                      id="demo-phone"
                      name="phone"
                      type="tel"
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      placeholder={t('figmaDemo.form.placeholders.phone', '+1 (555) 000-0000')}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold py-3 rounded-lg transition-all mt-6 shadow-lg shadow-indigo-500/25"
                >
                  {t('figmaDemo.form.submit', 'Schedule a Demo')}
                </button>

                <p className="text-xs text-center text-slate-500 mt-4">
                  {t(
                    'figmaDemo.form.disclaimer',
                    'By submitting this form, you agree to our Terms of Service and Privacy Policy.',
                  )}
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
