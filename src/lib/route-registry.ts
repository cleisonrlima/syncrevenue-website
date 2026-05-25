export const PRERENDER_INCLUDED_ROUTES = ['/', '/privacy'] as const

export const PRERENDER_EXCLUDED_ROUTES = [
  '/v2',
  '/demo',
  '/dashboard',
  '/dashboard/*',
  '/admin',
  '/admin/*',
  '/404',
] as const

export const APP_REGISTERED_ROUTES = [
  '/',
  '/privacy',
  '/demo',
  '/dashboard',
  '/dashboard/recovery',
  '/dashboard/payouts',
  '/dashboard/insights',
  '/dashboard/settings',
  '/dashboard/*',
  '/admin',
  '/admin/login',
  '/admin/dashboard',
  '/admin/leads',
  '/admin/team',
  '/404',
] as const

export function routeMatchesPattern(route: string, pattern: string) {
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -2)
    return route === prefix || route.startsWith(`${prefix}/`)
  }

  return route === pattern
}

export function isPrerenderRouteCovered(route: string) {
  return (
    PRERENDER_INCLUDED_ROUTES.includes(route as (typeof PRERENDER_INCLUDED_ROUTES)[number]) ||
    PRERENDER_EXCLUDED_ROUTES.some(pattern => routeMatchesPattern(route, pattern))
  )
}
