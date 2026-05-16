import { describe, it, expect, beforeEach } from 'vitest'
import { useAdminStore } from './useAdminStore'

describe('useAdminStore', () => {
  beforeEach(() => {
    useAdminStore.setState({
      isAuthenticated: false,
      adminId: null,
      email: null,
      bootstrapped: false,
    })
  })

  it('initial state is unauthenticated and not bootstrapped', () => {
    const state = useAdminStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.adminId).toBeNull()
    expect(state.email).toBeNull()
    expect(state.bootstrapped).toBe(false)
  })

  it('setSession authenticates + flips bootstrapped', () => {
    useAdminStore.getState().setSession({ adminId: 7, email: 'admin@x.com' })
    const state = useAdminStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.adminId).toBe(7)
    expect(state.email).toBe('admin@x.com')
    expect(state.bootstrapped).toBe(true)
  })

  it('clearSession resets to unauth + flips bootstrapped', () => {
    useAdminStore.getState().setSession({ adminId: 7, email: 'admin@x.com' })
    useAdminStore.getState().clearSession()
    const state = useAdminStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.adminId).toBeNull()
    expect(state.email).toBeNull()
    expect(state.bootstrapped).toBe(true)
  })

  it('markBootstrapped flips flag without changing auth state', () => {
    useAdminStore.getState().markBootstrapped()
    const state = useAdminStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.bootstrapped).toBe(true)
  })
})
