import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/i18n/LanguageSwitcher'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="bg-brand-navy text-brand-muted">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <address className="not-italic">
            <p className="text-white font-semibold mb-1">Sync Sirius, Inc.</p>
            <p className="text-sm">123 Revenue Drive, Suite 400</p>
            <p className="text-sm">Miami, FL 33101, USA</p>
          </address>

          <nav aria-label="Footer navigation" className="flex flex-col gap-2">
            <a href="/#hero" className="text-sm hover:text-white transition-colors">{t('nav.home', { defaultValue: 'Home' })}</a>
            <a href="/#contact" className="text-sm hover:text-white transition-colors">{t('nav.contact', { defaultValue: 'Contact' })}</a>
            <Link to="/privacy" className="text-sm hover:text-white transition-colors">{t('nav.privacy', { defaultValue: 'Privacy Policy' })}</Link>
          </nav>

          <div>
            <LanguageSwitcher />
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-brand-slate text-sm">
          <p>© {new Date().getFullYear()} Sync Sirius, Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
