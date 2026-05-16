import { create } from 'zustand'

export interface AdminSession {
  adminId: number
  email: string
}

export interface AdminStoreState {
  isAuthenticated: boolean
  adminId: number | null
  email: string | null
  bootstrapped: boolean
  setSession: (session: AdminSession) => void
  clearSession: () => void
  markBootstrapped: () => void
}

export const useAdminStore = create<AdminStoreState>(set => ({
  isAuthenticated: false,
  adminId: null,
  email: null,
  bootstrapped: false,
  setSession: ({ adminId, email }) =>
    set({ isAuthenticated: true, adminId, email, bootstrapped: true }),
  clearSession: () =>
    set({ isAuthenticated: false, adminId: null, email: null, bootstrapped: true }),
  markBootstrapped: () => set({ bootstrapped: true }),
}))
