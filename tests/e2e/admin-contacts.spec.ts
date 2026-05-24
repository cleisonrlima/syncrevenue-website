import { expect, test } from './fixtures'
import type { E2eDb, Locale } from './fixtures'

const TEST_EMAIL = process.env.ADMIN_TEST_EMAIL ?? 'admin-contacts-e2e@example.com'
const TEST_PASSWORD = process.env.ADMIN_TEST_PASSWORD ?? 'admin-contacts-e2e-password'

interface SeedContact {
  name: string
  email: string
  subject: string
  message: string
  locale: Locale
  read: 0 | 1
}

const SEED_CONTACTS: SeedContact[] = [
  {
    name: 'Contact EN E2E',
    email: 'contact-en-e2e@example.com',
    subject: 'English inquiry',
    message: 'Need commission recovery help.',
    locale: 'en',
    read: 0,
  },
  {
    name: 'Contact PT E2E',
    email: 'contact-pt-e2e@example.com',
    subject: 'Portuguese inquiry',
    message: 'Precisamos de ajuda com BI.',
    locale: 'pt-BR',
    read: 1,
  },
  {
    name: 'Contact ES E2E',
    email: 'contact-es-e2e@example.com',
    subject: 'Spanish inquiry',
    message: 'Necesitamos soporte de analytics.',
    locale: 'es',
    read: 0,
  },
]

const SEED_EMAILS = SEED_CONTACTS.map(contact => contact.email)

test.describe('Admin Contacts API @P1', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(({ e2eDb }) => {
    e2eDb.resetAdminLoginAttempts(TEST_EMAIL)
    e2eDb.seedAdminUser({ email: TEST_EMAIL, password: TEST_PASSWORD })
  })

  test.beforeEach(({ e2eDb }) => {
    seedContacts(e2eDb)
  })

  test.afterAll(({ e2eDb }) => {
    e2eDb.deleteContactsByEmails(SEED_EMAILS)
  })

  test('rejects unauthenticated admin contact list requests', async ({ request }) => {
    const response = await request.get('/api/admin/contacts')

    expect(response.status()).toBe(401)
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      message: 'Unauthorized',
    })
  })

  test('lists seeded contact messages for authenticated admins', async ({ request }) => {
    await login(request)

    const response = await request.get('/api/admin/contacts')

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    const names = body.data.map((row: { name: string }) => row.name)
    for (const contact of SEED_CONTACTS) {
      expect(names).toContain(contact.name)
    }
  })

  test('filters contacts by locale and read state', async ({ request }) => {
    await login(request)

    const ptResponse = await request.get('/api/admin/contacts?locale=pt-BR')
    expect(ptResponse.status()).toBe(200)
    const ptBody = await ptResponse.json()
    expect(ptBody.data.map((row: { email: string }) => row.email)).toEqual([SEED_CONTACTS[1].email])

    const unreadResponse = await request.get('/api/admin/contacts?read=0')
    expect(unreadResponse.status()).toBe(200)
    const unreadBody = await unreadResponse.json()
    const unreadEmails = unreadBody.data.map((row: { email: string }) => row.email)
    expect(unreadEmails).toContain(SEED_CONTACTS[0].email)
    expect(unreadEmails).toContain(SEED_CONTACTS[2].email)
    expect(unreadEmails).not.toContain(SEED_CONTACTS[1].email)
  })
})

async function login(request: import('@playwright/test').APIRequestContext) {
  const response = await request.post('/api/admin/auth/login', {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  })
  expect(response.status()).toBe(200)
}

function seedContacts(e2eDb: E2eDb) {
  e2eDb.deleteContactsByEmails(SEED_EMAILS)
  for (const contact of SEED_CONTACTS) {
    e2eDb.seedContact(contact)
  }
}
