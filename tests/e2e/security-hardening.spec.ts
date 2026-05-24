import { expect, test } from './fixtures'
import type { APIRequestContext, APIResponse } from '@playwright/test'
import { FORM_RATE_LIMIT_MAX } from '../../server/middleware/rateLimit'

const allowedOrigin = 'http://localhost:5173'

test.describe.configure({ mode: 'serial' })

test.describe('@P1 Story 2.7 security hardening', () => {
  test('enforces rate limits, locale allowlists, security headers, and SQL safety', async ({
    request,
    e2eDb,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'API security integration is covered once')

    const health = await request.get('/api/health', {
      headers: { Origin: allowedOrigin },
    })
    expect(health.status()).toBe(200)
    expectSecurityHeaders(health)
    expectAllowedCorsOrigin(health)

    const missing = await request.get('/api/missing', {
      headers: { Origin: allowedOrigin },
    })
    expect(missing.status()).toBe(404)
    expectSecurityHeaders(missing)
    expectAllowedCorsOrigin(missing)

    const invalidLocale = await postForm(request, '/api/demo', validDemoPayload('invalid-locale'), {
      Origin: allowedOrigin,
      'x-e2e-remote-address': '127.0.27.1',
    }, { locale: 'fr' })
    expect(invalidLocale.status()).toBe(400)
    expectSecurityHeaders(invalidLocale)
    expectAllowedCorsOrigin(invalidLocale)
    await expect(invalidLocale.json()).resolves.toEqual({
      success: false,
      message: 'Invalid demo request',
      field: 'locale',
    })
    expect(e2eDb.rowCount('demo_requests')).toBe(0)

    const blockedDemo = await exhaustRoute(request, '/api/demo', '127.0.27.2')
    expect(blockedDemo.status()).toBe(429)
    expectSecurityHeaders(blockedDemo)
    await expect(blockedDemo.json()).resolves.toEqual({
      success: false,
      message: 'Too many requests',
    })
    expect(blockedDemo.headers().ratelimit).toBeTruthy()
    expect(blockedDemo.headers()['ratelimit-policy']).toBeTruthy()
    expect(blockedDemo.headers()['x-ratelimit-limit']).toBeUndefined()

    const contactAfterDemoQuota = await postForm(
      request,
      '/api/contact',
      validContactPayload('after-demo-quota'),
      { 'x-e2e-remote-address': '127.0.27.2' }
    )
    expect(contactAfterDemoQuota.status()).toBe(201)

    const blockedContact = await exhaustRoute(request, '/api/contact', '127.0.27.3')
    expect(blockedContact.status()).toBe(429)
    await expect(blockedContact.json()).resolves.toEqual({
      success: false,
      message: 'Too many requests',
    })

    const demoAfterContactQuota = await postForm(
      request,
      '/api/demo',
      validDemoPayload('after-contact-quota'),
      { 'x-e2e-remote-address': '127.0.27.3' }
    )
    expect(demoAfterContactQuota.status()).toBe(201)

    const maliciousDemo = "Robert'); DROP TABLE demo_requests;--"
    const injectionDemo = await postForm(
      request,
      '/api/demo',
      {
        ...validDemoPayload('sql-demo'),
        name: maliciousDemo,
        message: maliciousDemo,
      },
      { 'x-e2e-remote-address': '127.0.27.6' }
    )
    expect(injectionDemo.status()).toBe(201)
    await expect(injectionDemo.text()).resolves.not.toMatch(/SQLITE|syntax error|DROP TABLE/i)
    expect(e2eDb.tableExists('demo_requests')).toBe(true)

    const maliciousContact = "Robert'); DROP TABLE contacts;--"
    const injectionContact = await postForm(
      request,
      '/api/contact',
      {
        ...validContactPayload('sql-contact'),
        message: maliciousContact,
      },
      { 'x-e2e-remote-address': '127.0.27.7' }
    )
    expect(injectionContact.status()).toBe(201)
    await expect(injectionContact.text()).resolves.not.toMatch(/SQLITE|syntax error|DROP TABLE/i)
    expect(e2eDb.tableExists('contacts')).toBe(true)
  })
})

async function exhaustRoute(
  request: APIRequestContext,
  route: '/api/demo' | '/api/contact',
  remoteAddress: string
) {
  for (let i = 0; i < FORM_RATE_LIMIT_MAX; i += 1) {
    const response = await postForm(
      request,
      route,
      route === '/api/demo'
        ? validDemoPayload(`${remoteAddress}-${i}`)
        : validContactPayload(`${remoteAddress}-${i}`),
      { 'x-e2e-remote-address': remoteAddress }
    )
    expect(response.status()).toBe(201)
    expect(response.headers().ratelimit).toBeTruthy()
    expect(response.headers()['ratelimit-policy']).toBeTruthy()
    expect(response.headers()['x-ratelimit-limit']).toBeUndefined()
  }

  return postForm(
    request,
    route,
    route === '/api/demo'
      ? validDemoPayload(`${remoteAddress}-blocked`)
      : validContactPayload(`${remoteAddress}-blocked`),
    { 'x-e2e-remote-address': remoteAddress }
  )
}

function postForm(
  request: APIRequestContext,
  route: '/api/demo' | '/api/contact',
  body: Record<string, unknown>,
  headers: Record<string, string>,
  overrides: Record<string, unknown> = {}
) {
  return request.post(route, { data: { ...body, ...overrides }, headers })
}

function validDemoPayload(id: string) {
  return {
    name: `Security Demo ${id}`,
    email: `security-demo-${safeId(id)}@example.com`,
    company: `Example Travel ${id}`,
    phone: '+1 305 555 0100',
    role: 'Owner',
    gds: 'Sabre',
    message: 'We need help reconciling commissions.',
    locale: 'en',
  }
}

function validContactPayload(id: string) {
  return {
    name: `Security Contact ${id}`,
    email: `security-contact-${safeId(id)}@example.com`,
    subject: 'commercial',
    message: 'We need analytics help for agency revenue reporting.',
    locale: 'pt-BR',
  }
}

function expectSecurityHeaders(response: APIResponse) {
  const headers = response.headers()
  expect(headers['content-security-policy']).toBeTruthy()
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['x-frame-options']).toBeTruthy()
  expect(headers['referrer-policy']).toBeTruthy()
  expect(headers['x-powered-by']).toBeUndefined()
}

function expectAllowedCorsOrigin(response: APIResponse) {
  const acao = response.headers()['access-control-allow-origin']
  expect(acao).toBe(allowedOrigin)
  expect(acao).not.toBe('*')
}

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, '-').toLowerCase()
}
