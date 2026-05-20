// Patterns updated by Story 5.12 — see _bmad-output/test-artifacts/test-design/test-design-epic-5-v2.md
// (NG2: pre-existing flakes — RTL `waitFor` polled the DOM at a fixed interval and timed out
// under full-suite CPU contention. `findBy*` queries retry after every React effect flush, so
// they wake up the moment the lazy-imported section commits.)
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from './Home'
import '@/i18n'

// Lazy-imported sections (Home.tsx wraps Comparison/Security/ClientReferences/Team/DemoScheduler in
// React.lazy + Suspense). Under full-suite CPU contention the dynamic-import chunk can take longer
// than RTL's default 1s findBy* timeout to commit, so each query keeps an explicit 5s ceiling. The
// query still retries on every effect flush, so it returns immediately on a fast run.
const lazySectionWait = { timeout: 5000 }

describe('Home', () => {
  it('renders the public trust sequence with Team before the demo ask', async () => {
    render(<Home />)

    const syncRevenue = await screen.findByRole('region', {
      name: 'Automated Commission Reconciliation',
    }, lazySectionWait)
    const services = await screen.findByRole('region', {
      name: 'Complete Revenue Intelligence Suite',
    }, lazySectionWait)
    const comparison = await screen.findByRole('region', {
      name: 'SyncRevenue comparison against manual and generic tools',
    }, lazySectionWait)
    const security = await screen.findByRole('region', {
      name: 'Your Data is Protected',
    }, lazySectionWait)
    const clientReferences = await screen.findByRole('region', {
      name: 'Verified US travel agency references',
    }, lazySectionWait)
    const team = await screen.findByRole('region', {
      name: 'Sync Sirius team specialists',
    }, lazySectionWait)
    const demoScheduler = await screen.findByRole('region', {
      name: 'Schedule a SyncRevenue demo',
    }, lazySectionWait)

    expect(syncRevenue).toHaveAttribute('id', 'syncrevenue')
    expect(services).toHaveAttribute('id', 'services')
    expect(comparison).toHaveAttribute('id', 'comparison')
    expect(security).toHaveAttribute('id', 'security')
    expect(clientReferences).toHaveAttribute('id', 'clientes')
    expect(team).toHaveAttribute('id', 'equipe')
    expect(demoScheduler).toHaveAttribute('id', 'agendar-demo')
    expect(syncRevenue.compareDocumentPosition(services)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(services.compareDocumentPosition(comparison)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(comparison.compareDocumentPosition(security)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(security.compareDocumentPosition(clientReferences)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(clientReferences.compareDocumentPosition(team)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(team.compareDocumentPosition(demoScheduler)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })
})
