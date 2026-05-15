import { lazy, Suspense } from 'react'
import SectionSkeleton from '@/components/sections/SectionSkeleton'
import ErrorBoundary from '@/components/ErrorBoundary'

const Hero = lazy(() => import('@/components/sections/Hero'))
const SyncRevenue = lazy(() => import('@/components/sections/SyncRevenue'))
const Services = lazy(() => import('@/components/sections/Services'))
const Comparison = lazy(() => import('@/components/sections/Comparison'))
const Security = lazy(() => import('@/components/sections/Security'))
const ClientReferences = lazy(() => import('@/components/sections/ClientReferences'))
const Team = lazy(() => import('@/components/sections/Team'))
const DemoScheduler = lazy(() => import('@/components/sections/DemoScheduler'))
const Contact = lazy(() => import('@/components/sections/Contact'))

export default function Home() {
  return (
    <>
      <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton className="min-h-[600px]" label="Loading hero" />}>
          <Hero />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton className="min-h-[400px]" label="Loading syncrevenue" />}>
          <SyncRevenue />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton className="min-h-[400px]" label="Loading services" />}>
          <Services />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton className="min-h-[400px]" label="Loading comparison" />}>
          <Comparison />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton className="min-h-[400px]" label="Loading security" />}>
          <Security />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton className="min-h-[400px]" label="Loading references" />}>
          <ClientReferences />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton className="min-h-[500px]" label="Loading team" />}>
          <Team />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton className="min-h-[300px]" label="Loading demo scheduler" />}>
          <DemoScheduler />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton className="min-h-[300px]" label="Loading contact" />}>
          <Contact />
        </Suspense>
      </ErrorBoundary>
    </>
  )
}
