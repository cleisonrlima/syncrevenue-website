// Patterns updated by Story 5.12 — see _bmad-output/test-artifacts/test-design/test-design-epic-5-v2.md
// (NG2: pre-existing flakes — RTL `waitFor` polled the DOM at a fixed interval and timed out
// under full-suite CPU contention. `findBy*` queries retry after every React effect flush and
// match the lazy-imported section the moment it commits.)
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from './Home'
import '@/i18n'
import i18next from '@/i18n'
import { useLocaleStore } from '@/store/useLocaleStore'

const lazySectionWait = { timeout: 5000 }

describe('Story 2.4 DemoScheduler entry points (Story 6.10 — id renamed)', () => {
  let scrollTargets: HTMLElement[]

  beforeEach(() => {
    scrollTargets = []
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: function (this: HTMLElement) {
        scrollTargets.push(this)
      },
    })
  })

  afterEach(async () => {
    cleanup()
    vi.restoreAllMocks()
    useLocaleStore.setState({ locale: 'en' })
    await i18next.changeLanguage('en')
  })

  it('mounts exactly one DemoForm and places DemoScheduler before Contact', async () => {
    render(<Home />)

    const demoScheduler = await screen.findByRole(
      'region',
      { name: 'Schedule a SyncRevenue demo' },
      lazySectionWait,
    )

    const contact = await screen.findByRole(
      'region',
      { name: /Talk to .*SyncSirius/ },
      lazySectionWait,
    )

    const demoForms = await screen.findAllByRole(
      'form',
      { name: 'Request a demonstration' },
      lazySectionWait,
    )
    expect(demoForms).toHaveLength(1)
    expect(demoScheduler.contains(demoForms[0])).toBe(true)
    expect(demoScheduler.compareDocumentPosition(contact)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('Hero "Schedule a Demo" CTA scrolls to the renamed DemoScheduler section (#agendar-demo)', async () => {
    const user = userEvent.setup()
    render(<Home />)

    // Hero <section> uses aria-labelledby="hero-heading" and resolves to an implicit region
    // whose accessible name is the rendered <h1> text. Use findByRole instead of querying #hero
    // so we wait deterministically for React to commit the lazy section.
    const hero = await screen.findByRole(
      'region',
      { name: /More commission per ticket.*Less rework at the rate desk/ },
      lazySectionWait,
    )

    const demoScheduler = await screen.findByRole(
      'region',
      { name: 'Schedule a SyncRevenue demo' },
      lazySectionWait,
    )

    const heroCta = within(hero).getByRole('button', { name: 'Schedule a Demo' })
    const originalHash = window.location.hash
    await user.click(heroCta)

    expect(scrollTargets).toContain(demoScheduler)
    expect(window.location.hash).toBe(originalHash)
  })

  it('the DemoForm Full name input is reachable inside the DemoScheduler section', async () => {
    render(<Home />)

    const demoScheduler = await screen.findByRole(
      'region',
      { name: 'Schedule a SyncRevenue demo' },
      lazySectionWait,
    )

    const fullName = await within(demoScheduler).findByLabelText(/Full name/i, {}, lazySectionWait)
    expect(fullName).toBeInTheDocument()
  })
})
