import { lazy, Suspense } from 'react'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useDocumentMeta } from '@/components/SEO'
// Story 6.13 (AC 6 + AC 7): Hero stays eager so the LCP image renders on
// first paint with no React.lazy delay. The remaining sections are below
// the fold during the LH measurement window, so we re-lazy them to slim the
// initial JS chunk and bring mobile LCP under 2.5s on `/`. The Suspense
// fallback is null (no skeleton) — when each chunk lands the section
// inserts itself below the fold, where Lighthouse weights the shift by
// (offscreen_distance / viewport_height) → effectively zero CLS impact
// because the new element sits outside the initial viewport. The CLS-prone
// scenario from Story 6.12 (font-swap reflow within the hero) is solved by
// the self-hosted font preload — independent of this lazy/eager choice.
import Hero from '@/components/sections/Hero'

const SyncRevenue = lazy(() => import('@/components/sections/SyncRevenue'))
const CommissionAudit = lazy(() => import('@/components/sections/CommissionAudit'))
const Services = lazy(() => import('@/components/sections/Services'))
const Comparison = lazy(() => import('@/components/sections/Comparison'))
const Security = lazy(() => import('@/components/sections/Security'))
const ClientReferences = lazy(() => import('@/components/sections/ClientReferences'))
const Team = lazy(() => import('@/components/sections/Team'))
const DemoScheduler = lazy(() => import('@/components/sections/DemoScheduler'))
const Contact = lazy(() => import('@/components/sections/Contact'))

export default function Home() {
  useDocumentMeta({
    titleKey: 'seo.home.title',
    descriptionKey: 'seo.home.description',
    ogTitleKey: 'seo.home.ogTitle',
    ogDescriptionKey: 'seo.home.ogDescription',
    path: '/',
  })

  return (
    <>
      <ErrorBoundary><Hero /></ErrorBoundary>
      <ErrorBoundary><Suspense fallback={null}><SyncRevenue /></Suspense></ErrorBoundary>
      <ErrorBoundary><Suspense fallback={null}><CommissionAudit /></Suspense></ErrorBoundary>
      <ErrorBoundary><Suspense fallback={null}><Services /></Suspense></ErrorBoundary>
      <ErrorBoundary><Suspense fallback={null}><Comparison /></Suspense></ErrorBoundary>
      <ErrorBoundary><Suspense fallback={null}><Security /></Suspense></ErrorBoundary>
      <ErrorBoundary><Suspense fallback={null}><ClientReferences /></Suspense></ErrorBoundary>
      <ErrorBoundary><Suspense fallback={null}><Team /></Suspense></ErrorBoundary>
      <ErrorBoundary><Suspense fallback={null}><DemoScheduler /></Suspense></ErrorBoundary>
      <ErrorBoundary><Suspense fallback={null}><Contact /></Suspense></ErrorBoundary>
    </>
  )
}
