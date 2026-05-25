import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/sections/Hero'
import SyncRevenue from '@/components/sections/SyncRevenue'
import CommissionAudit from '@/components/sections/CommissionAudit'
import Services from '@/components/sections/Services'
import Comparison from '@/components/sections/Comparison'
import Security from '@/components/sections/Security'
import ClientReferences from '@/components/sections/ClientReferences'
import Team from '@/components/sections/Team'
import DemoScheduler from '@/components/sections/DemoScheduler'
import Contact from '@/components/sections/Contact'
import { useDocumentMeta } from '@/components/SEO'

export default function Landing() {
  useDocumentMeta({
    titleKey: 'seo.home.title',
    descriptionKey: 'seo.home.description',
    ogTitleKey: 'seo.home.ogTitle',
    ogDescriptionKey: 'seo.home.ogDescription',
    path: '/',
  })

  return (
    <>
      <Navbar />
      <Hero />
      <SyncRevenue />
      <CommissionAudit />
      <Services />
      <Comparison />
      <Security />
      <ClientReferences />
      <Team />
      <DemoScheduler />
      <Contact />
      <Footer />
    </>
  )
}
