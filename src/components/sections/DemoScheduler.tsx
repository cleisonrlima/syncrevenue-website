import { useTranslation } from 'react-i18next'
import DemoForm from './DemoForm'

export default function DemoScheduler() {
  const { t } = useTranslation()

  return (
    <section
      id="demo-scheduler"
      role="region"
      aria-label={t('forms.demo.title')}
      className="bg-[#F4F6FA]"
    >
      <div className="mx-auto max-w-[960px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <DemoForm />
      </div>
    </section>
  )
}
