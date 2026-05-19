import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
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
    const { container } = render(<Home />)

    const demoScheduler = await waitFor(() => {
      const section = container.querySelector('#agendar-demo')
      expect(section).toBeInTheDocument()
      return section as HTMLElement
    }, lazySectionWait)

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
    const { container } = render(<Home />)

    const hero = await waitFor(() => {
      const section = container.querySelector('#hero')
      expect(section).toBeInTheDocument()
      return section as HTMLElement
    }, lazySectionWait)

    const demoScheduler = await waitFor(() => {
      const section = container.querySelector('#agendar-demo')
      expect(section).toBeInTheDocument()
      return section as HTMLElement
    }, lazySectionWait)

    const heroCta = within(hero).getByRole('button', { name: 'Schedule a Demo' })
    const originalHash = window.location.hash
    await user.click(heroCta)

    expect(scrollTargets).toContain(demoScheduler)
    expect(window.location.hash).toBe(originalHash)
  })

  it('the DemoForm Full name input is reachable inside the DemoScheduler section', async () => {
    const { container } = render(<Home />)

    const demoScheduler = await waitFor(() => {
      const section = container.querySelector('#agendar-demo')
      expect(section).toBeInTheDocument()
      return section as HTMLElement
    }, lazySectionWait)

    const fullName = await within(demoScheduler).findByLabelText(/Full name/i, {}, lazySectionWait)
    expect(fullName).toBeInTheDocument()
  })
})
