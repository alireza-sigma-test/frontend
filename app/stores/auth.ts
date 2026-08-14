import { defineStore } from 'pinia'
import type { Role, User } from '~/types/api'

const TOKEN_KEY = 'pr.token'

export const useAuthStore = defineStore('auth', {
  state: () => ({ token: null as string | null, user: null as User | null }),

  getters: {
    isAuthenticated: s => !!s.token,
    role: (s): Role | null => s.user?.role ?? null,
    isSpeaker:  s => s.user?.role === 'speaker',
    isReviewer: s => s.user?.role === 'reviewer',
    isAdmin:    s => s.user?.role === 'admin',
  },

  actions: {
    async login(email: string, password: string) {
      const res = await useApi().post<{ token: string; user: User }>('/login', { email, password })
      this.set(res.token, res.user)
    },

    async register(payload: { name: string; email: string; password: string; password_confirmation: string; role: Role }) {
      const res = await useApi().post<{ token: string; user: User }>('/register', payload)
      this.set(res.token, res.user)
    },

    async logout() {
      // Best-effort: a failed revoke must not strand the user in a signed-in UI.
      try { await useApi().post('/logout') } catch { /* ignore */ }
      this.clear()
      await navigateTo('/login')
    },

    /** GET /me returns a FLAT user object, not { data: … }. */
    async restore() {
      const stored = import.meta.client ? localStorage.getItem(TOKEN_KEY) : null
      if (!stored) return
      this.token = stored
      try { this.user = await useApi().get<User>('/me') }
      catch { this.clear() }
    },

    set(token: string, user: User) {
      this.token = token
      this.user = user
      if (import.meta.client) localStorage.setItem(TOKEN_KEY, token)
    },

    clear() {
      this.token = null
      this.user = null
      if (import.meta.client) localStorage.removeItem(TOKEN_KEY)
    },
  },
})
