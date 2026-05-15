import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ContactApiError,
  DemoApiError,
  postContact,
  postDemo,
  type ContactPayload,
  type DemoPayload,
} from './api'

const validPayload: DemoPayload = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  company: 'Example Travel',
  phone: '',
  role: 'Owner',
  gds: 'Sabre',
  message: '',
  locale: 'en',
}

const validContactPayload: ContactPayload = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  subject: 'BI/Data Analytics',
  message: 'We need analytics support.',
  locale: 'en',
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('postDemo', () => {
  it('rejects malformed 2xx envelopes instead of treating them as success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'missing success flag' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    )

    await expect(postDemo(validPayload)).rejects.toMatchObject({
      name: 'DemoApiError',
      status: 200,
      message: 'missing success flag',
    })
  })
})

describe('postContact', () => {
  it('posts a valid contact payload and returns a success envelope', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true, message: 'Contact message received' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      })
    )

    await expect(postContact(validContactPayload)).resolves.toEqual({
      success: true,
      message: 'Contact message received',
    })
    expect(fetchMock).toHaveBeenCalledWith('/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validContactPayload),
    })
  })

  it('rejects malformed 2xx envelopes instead of treating them as success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'missing success flag' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    )

    await expect(postContact(validContactPayload)).rejects.toMatchObject({
      name: 'ContactApiError',
      status: 200,
      message: 'missing success flag',
    })
  })

  it('preserves HTTP 429 status for inline rate-limit handling', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: false, message: 'Too many requests' }), {
        status: 429,
        headers: { 'content-type': 'application/json' },
      })
    )

    await expect(postContact(validContactPayload)).rejects.toEqual(
      new ContactApiError(429, 'Too many requests')
    )
  })
})
