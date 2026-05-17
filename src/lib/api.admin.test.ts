import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AdminApiError,
  getAdminMe,
  patchAdminLeadStatus,
  postAdminLogin,
  postAdminLogout,
} from './api'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('postAdminLogin', () => {
  it('returns success envelope on 200', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, data: { adminId: 1, email: 'a@b.com' } }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    )

    await expect(postAdminLogin({ email: 'a@b.com', password: 'x' })).resolves.toEqual({
      success: true,
      data: { adminId: 1, email: 'a@b.com' },
    })
  })

  it('throws AdminApiError(401, "Invalid credentials") on 401', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: false, message: 'Invalid credentials' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      })
    )

    await expect(postAdminLogin({ email: 'a@b.com', password: 'x' })).rejects.toMatchObject({
      name: 'AdminApiError',
      status: 401,
      message: 'Invalid credentials',
    })
  })

  it('throws AdminApiError(0) on network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('network'))

    await expect(postAdminLogin({ email: 'a@b.com', password: 'x' })).rejects.toMatchObject({
      name: 'AdminApiError',
      status: 0,
    })
  })

  it('sends credentials: include', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { adminId: 1, email: 'a@b.com' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    )

    await postAdminLogin({ email: 'a@b.com', password: 'x' })
    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(init.credentials).toBe('include')
    expect(init.method).toBe('POST')
  })

  it('throws when success response has malformed session data', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { email: 'a@b.com' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    )

    await expect(postAdminLogin({ email: 'a@b.com', password: 'x' })).rejects.toMatchObject({
      name: 'AdminApiError',
      message: 'Invalid session response',
    })
  })
})

describe('postAdminLogout', () => {
  it('resolves on 200', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    )
    await expect(postAdminLogout()).resolves.toEqual({ success: true })
  })

  it('soft-resolves on 401 (already-logged-out)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 401 })
    )
    await expect(postAdminLogout()).resolves.toEqual({ success: true })
  })
})

describe('getAdminMe', () => {
  it('returns session data on 200', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, data: { adminId: 5, email: 'a@b.com' } }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    )
    await expect(getAdminMe()).resolves.toEqual({ adminId: 5, email: 'a@b.com' })
  })

  it('returns null on 401 (no throw)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 401 }))
    await expect(getAdminMe()).resolves.toBeNull()
  })

  it('throws on 500 response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: false, message: 'boom' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      })
    )
    await expect(getAdminMe()).rejects.toBeInstanceOf(AdminApiError)
  })

  it('throws when /me success response has malformed session data', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { adminId: '5', email: 'a@b.com' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    )
    await expect(getAdminMe()).rejects.toBeInstanceOf(AdminApiError)
  })
})

describe('patchAdminLeadStatus', () => {
  const sampleRow = {
    id: 42,
    name: 'Alice',
    email: 'alice@example.com',
    company: 'AcmeCo',
    phone: null,
    role: 'Owner',
    gds: 'Amadeus',
    message: null,
    locale: 'en',
    status: 'contacted',
    created_at: '2026-05-17T12:00:00.000Z',
    updated_at: '2026-05-17T12:34:56.000Z',
  }

  it('returns the parsed row on 200', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: sampleRow }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    )

    await expect(patchAdminLeadStatus(42, 'contacted')).resolves.toMatchObject({
      id: 42,
      status: 'contacted',
    })
  })

  it('sends PATCH with credentials: include and JSON body', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: sampleRow }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    )

    await patchAdminLeadStatus(42, 'contacted')
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/admin/leads/42/status')
    expect(init.method).toBe('PATCH')
    expect(init.credentials).toBe('include')
    expect(init.body).toBe(JSON.stringify({ status: 'contacted' }))
  })

  it('throws AdminApiError with field on 400', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ success: false, message: 'Invalid status', field: 'status' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      )
    )

    await expect(patchAdminLeadStatus(42, 'contacted')).rejects.toMatchObject({
      name: 'AdminApiError',
      status: 400,
      message: 'Invalid status',
      field: 'status',
    })
  })

  it('throws AdminApiError(401) on 401 (does not soft-resolve)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      })
    )

    await expect(patchAdminLeadStatus(42, 'contacted')).rejects.toMatchObject({
      name: 'AdminApiError',
      status: 401,
    })
  })

  it('throws AdminApiError(404) on 404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: false, message: 'Lead not found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      })
    )

    await expect(patchAdminLeadStatus(42, 'contacted')).rejects.toMatchObject({
      name: 'AdminApiError',
      status: 404,
      message: 'Lead not found',
    })
  })

  it('throws on malformed row shape', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, data: { ...sampleRow, status: 'archived' } }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    )

    await expect(patchAdminLeadStatus(42, 'contacted')).rejects.toMatchObject({
      name: 'AdminApiError',
      message: 'Invalid lead update response',
    })
  })

  it('throws AdminApiError(0) on network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('network'))

    await expect(patchAdminLeadStatus(42, 'contacted')).rejects.toMatchObject({
      name: 'AdminApiError',
      status: 0,
    })
  })
})
