import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Team from './Team'

const members = [
  {
    name: 'Team Member Name',
    role: 'Airline Distribution Lead',
    bio: 'Guides GDS operations, BSP reconciliation, and commission recovery programs.',
    photo: '',
  },
  {
    name: 'Technology Team Member',
    role: 'Travel Data Automation Lead',
    bio: 'Builds travel data integration and revenue optimization systems.',
    photo: '/team/technology-lead.jpg',
  },
]

const tMock = vi.fn((key: string, options?: { defaultValue?: string; returnObjects?: boolean }) => {
  if (key === 'team.members' && options?.returnObjects) {
    return members
  }

  return options?.defaultValue ?? key
})

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: tMock }),
}))

describe('Team', () => {
  const renderTeam = () => render(<Team />)

  beforeEach(() => {
    tMock.mockClear()
  })

  it('renders a named team region with the correct id', () => {
    renderTeam()

    const section = screen.getByRole('region', {
      name: 'Sync Sirius team specialists',
    })
    expect(section).toHaveAttribute('id', 'team')
  })

  it('renders SectionHeader copy from i18n keys', () => {
    renderTeam()

    expect(screen.getByText('Our Team')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Specialists in Airline Distribution' })).toBeInTheDocument()
    expect(screen.getByText(/GDS, BSP, and travel agency operations/)).toBeInTheDocument()
  })

  it('renders member names, roles, and bios from team.members', () => {
    renderTeam()

    members.forEach(member => {
      expect(screen.getByRole('heading', { name: member.name })).toBeInTheDocument()
      expect(screen.getByText(member.role)).toBeInTheDocument()
      expect(screen.getByText(member.bio)).toBeInTheDocument()
    })
  })

  it('renders placeholders for empty photos and images with meaningful alt text for provided photos', () => {
    const { container } = renderTeam()

    expect(container.querySelector('[data-team-photo-placeholder="true"]')).toBeInTheDocument()
    const image = screen.getByRole('img', { name: 'Technology Team Member' })

    expect(image).toHaveAttribute('src', '/team/technology-lead.jpg')
    expect(image).toHaveAttribute('width', '320')
    expect(image).toHaveAttribute('height', '320')
    expect(image).toHaveAttribute('loading', 'lazy')
  })

  it('uses mobile-first single-column classes with responsive multi-column breakpoints', () => {
    const { container } = renderTeam()
    const grid = container.querySelector('[data-team-grid="true"]')

    expect(grid).toHaveClass('grid-cols-1')
    expect(grid).toHaveClass('md:grid-cols-2')
    expect(grid).toHaveClass('lg:grid-cols-3')
  })

  it('uses translation keys for visible section copy and team data', () => {
    renderTeam()

    const usedKeys = tMock.mock.calls.map(([key]) => key)
    expect(usedKeys).toEqual(
      expect.arrayContaining([
        'team.ariaLabel',
        'team.eyebrow',
        'team.headline',
        'team.subtext',
        'team.members',
      ]),
    )
  })

  it('does not render member cards when team.members is not an array', () => {
    tMock.mockImplementationOnce((key: string) => {
      if (key === 'team.members') {
        return 'missing members'
      }

      return key
    })

    const { container } = renderTeam()

    expect(screen.getByRole('region', { name: 'Sync Sirius team specialists' })).toBeInTheDocument()
    expect(container.querySelector('[data-team-grid="true"]')).not.toBeInTheDocument()
    expect(container.querySelectorAll('article')).toHaveLength(0)
  })
})
