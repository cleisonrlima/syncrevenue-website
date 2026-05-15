import { useTranslation } from 'react-i18next'

export default function StatRow() {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-12">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="text-center">
          <div className="text-sm text-brand-offwhite mb-2">
            {t(`hero.stats.${i}.label`, { defaultValue: '' })}
          </div>
          <div className="bg-gradient-brand bg-clip-text text-transparent text-2xl font-bold">
            {t(`hero.stats.${i}.value`, { defaultValue: '' })}
          </div>
        </div>
      ))}
    </div>
  )
}
