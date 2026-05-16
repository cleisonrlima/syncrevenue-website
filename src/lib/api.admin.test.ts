import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminApiError, getAdminMe, postAdminLogin, postAdminLogout } from './api'

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
