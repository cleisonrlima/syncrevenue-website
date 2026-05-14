import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export default function NotFound() {
  const { t } = useTranslation()

  return (
    <div className="bg-brand-navy text-white min-h-screen flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold mb-4">{t('errors.notFound', { defaultValue: 'Page not found' })}</h1>
        <p className="text-brand-muted mb-8">{t('errors.notFoundBody', { defaultValue: "The page you're looking for doesn't exist." })}</p>
        <Link to="/" className="text-brand-electric-blue hover:underline">
          {t('nav.home', { defaultValue: 'Home' })}
        </Link>
      </div>
    </div>
  )
}
