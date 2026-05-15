import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DemoApiError, postDemo, type DemoPayload } from './api'

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
