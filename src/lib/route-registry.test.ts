import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  APP_REGISTERED_ROUTES,
  isPrerenderRouteCovered,
  routeMatchesPattern,
} from './route-registry'

function extractRoutePathsFromApp() {
  const appPath = path.resolve(process.cwd(), 'src/App.tsx')
  const source = fs.readFileSync(appPath, 'utf8')
  const paths = [...source.matchAll(/<Route\s+path="([^"]+)"/g)].map(match => match[1])

  return paths
    .filter(route => route !== '*')
    .filter(route => route.startsWith('/'))
}

describe('route registry', () => {
  it('keeps top-level App route declarations covered by prerender decisions', () => {
    const appRoutes = extractRoutePathsFromApp()

    expect(appRoutes).toEqual(expect.arrayContaining(['/admin', '/dashboard', '/demo', '/privacy', '/v2']))

    for (const route of appRoutes) {
      expect(
        isPrerenderRouteCovered(route),
        `${route} must be included in or excluded from prerender routing`
      ).toBe(true)
    }
  })

  it('covers every registered route with an include or wildcard-aware exclusion', () => {
    for (const route of APP_REGISTERED_ROUTES) {
      expect(
        isPrerenderRouteCovered(route),
        `${route} must be included in or excluded from prerender routing`
      ).toBe(true)
    }
  })

  it('matches child routes through explicit wildcard exclusions', () => {
    expect(routeMatchesPattern('/admin/leads', '/admin/*')).toBe(true)
    expect(routeMatchesPattern('/dashboard/settings', '/dashboard/*')).toBe(true)
    expect(routeMatchesPattern('/privacy', '/admin/*')).toBe(false)
  })
})
