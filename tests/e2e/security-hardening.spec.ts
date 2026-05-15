import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import type { Express } from 'express'
import type Database from 'better-sqlite3'
import { allowedOrigin, securityTempDir } from './security-test-env'
import db from '../../server/db'
import { createApp } from '../../server/index'
import { request as appRequest, type AppResponse } from '../../server/test-utils/request'
import { FORM_RATE_LIMIT_MAX } from '../../server/middleware/rateLimit'

test.describe.configure({ mode: 'serial' })

test.describe('@P1 Story 2.7 security hardening', () => {
  const app = createApp()

  test.afterAll(() => {
    db.close()
    fs.rmSync(securityTempDir, { recursive: true, force: true })
  })

  test('enforces rate limits, locale allowlists, security headers, and SQL safety', async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'API security integration is covered once')

    const health = await appRequest(app, {
      path: '/api/health',
      headers: { Origin: allowedOrigin },
    })
    expect(health.status).toBe(200)
    expectSecurityHeaders(health)
    expectAllowedCorsOrigin(health)

    const missing = await appRequest(app, {
      path: '/api/missing',
      headers: { Origin: allowedOrigin },
    })
    expect(missing.status).toBe(404)
    expectSecurityHeaders(missing)
    expectAllowedCorsOrigin(missing)

    const invalidLocale = await appRequest(app, {
      method: 'POST',
      path: '/api/demo',
      headers: { Origin: allowedOrigin },
      body: { ...validDemoPayload('invalid-locale'), locale: 'fr' },
      remoteAddress: '127.0.27.1',
    })
    expect(invalidLocale.status).toBe(400)
    expectSecurityHeaders(invalidLocale)
    expectAllowedCorsOrigin(invalidLocale)
    expect(invalidLocale.json()).toEqual({
      success: false,
      message: 'Invalid demo request',
      field: 'locale',
    })
    expect(rowCount(db, 'demo_requests')).toBe(0)

    const blockedDemo = await exhaustRoute(app, '/api/demo', '127.0.27.2')
    expect(blockedDemo.status).toBe(429)
    expectSecurityHeaders(blockedDemo)
    expect(blockedDemo.json()).toEqual({ success: false, message: 'Too many requests' })
    expect(blockedDemo.headers.ratelimit).toBeTruthy()
    expect(blockedDemo.headers['ratelimit-policy']).toBeTruthy()
    expect(blockedDemo.headers['x-ratelimit-limit']).toBeUndefined()

    const blockedContact = await exhaustRoute(app, '/api/contact', '127.0.27.3')
    expect(blockedContact.status).toBe(429)
    expect(blockedContact.json()).toEqual({ success: false, message: 'Too many requests' })

    const demoBlocked = await exhaustRoute(app, '/api/demo', '127.0.27.4')
    expect(demoBlocked.status).toBe(429)
    const contactAfterDemoQuota = await appRequest(app, {
      method: 'POST',
      path: '/api/contact',
      body: validContactPayload('after-demo-quota'),
      remoteAddress: '127.0.27.4',
    })
    expect(contactAfterDemoQuota.status).toBe(201)

    const contactBlocked = await exhaustRoute(app, '/api/contact', '127.0.27.5')
    expect(contactBlocked.status).toBe(429)
    const demoAfterContactQuota = await appRequest(app, {
      method: 'POST',
      path: '/api/demo',
      body: validDemoPayload('after-contact-quota'),
      remoteAddress: '127.0.27.5',
    })
    expect(demoAfterContactQuota.status).toBe(201)

    const maliciousDemo = "Robert'); DROP TABLE demo_requests;--"
    const injectionDemo = await appRequest(app, {
      method: 'POST',
      path: '/api/demo',
      body: {
        ...validDemoPayload('sql-demo'),
        name: maliciousDemo,
        message: maliciousDemo,
      },
      remoteAddress: '127.0.27.6',
    })
    expect(injectionDemo.status).toBe(201)
    expect(injectionDemo.body).not.toMatch(/SQLITE|syntax error|DROP TABLE/i)
    expect(tableExists(db, 'demo_requests')).toBe(true)

    const maliciousContact = "Robert'); DROP TABLE contacts;--"
    const injectionContact = await appRequest(app, {
      method: 'POST',
      path: '/api/contact',
      body: {
        ...validContactPayload('sql-contact'),
        message: maliciousContact,
      },
      remoteAddress: '127.0.27.7',
    })
    expect(injectionContact.status).toBe(201)
    expect(injectionContact.body).not.toMatch(/SQLITE|syntax error|DROP TABLE/i)
    expect(tableExists(db, 'contacts')).toBe(true)
  })
})

async function exhaustRoute(
  app: Express,
  route: '/api/demo' | '/api/contact',
  remoteAddress: string
) {
  for (let i = 0; i < FORM_RATE_LIMIT_MAX; i += 1) {
    const response = await appRequest(app, {
      method: 'POST',
      path: route,
      body:
        route === '/api/demo'
          ? validDemoPayload(`${remoteAddress}-${i}`)
          : validContactPayload(`${remoteAddress}-${i}`),
      remoteAddress,
    })
    expect(response.status).toBe(201)
    expect(response.headers.ratelimit).toBeTruthy()
    expect(response.headers['ratelimit-policy']).toBeTruthy()
    expect(response.headers['x-ratelimit-limit']).toBeUndefined()
  }

  return appRequest(app, {
    method: 'POST',
    path: route,
    body:
      route === '/api/demo'
        ? validDemoPayload(`${remoteAddress}-blocked`)
        : validContactPayload(`${remoteAddress}-blocked`),
    remoteAddress,
  })
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
    subject: 'BI/Data Analytics',
    message: 'We need analytics help for agency revenue reporting.',
    locale: 'pt-BR',
  }
}

function expectSecurityHeaders(response: AppResponse) {
  expect(response.headers['content-security-policy']).toBeTruthy()
  expect(response.headers['x-content-type-options']).toBe('nosniff')
  expect(response.headers['x-frame-options']).toBeTruthy()
  expect(response.headers['referrer-policy']).toBeTruthy()
  expect(response.headers['x-powered-by']).toBeUndefined()
}

function expectAllowedCorsOrigin(response: AppResponse) {
  const acao = response.headers['access-control-allow-origin']
  expect(acao).toBe(allowedOrigin)
  expect(acao).not.toBe('*')
}

function rowCount(db: Database.Database, tableName: string) {
  return (db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as { count: number }).count
}

function tableExists(db: Database.Database, tableName: string) {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(tableName) as { name: string } | undefined
  return row?.name === tableName
}

function safeId(value: string) {
  return value.replace(/[^a-z0-9-]/gi, '-').toLowerCase()
}
