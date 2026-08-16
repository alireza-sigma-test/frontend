import { defineStore } from 'pinia'
import type { Role, User } from '~/types/api'

const TOKEN_KEY = 'pr.token'

export const useAuthStore = defineStore('auth', {
  state: () => ({ token: null as string | null, user: null as User | null }),

  getters: {
    isAuthenticated: s => !!s.token,
    role: (s): Role | null => s.user?.role ?? null,
    isSpeaker: s => s.user?.role === 'speaker',
    isAdmin:   s => s.user?.role === 'admin',
    // Derived from the API's own boolean rather than re-deriving it from the
    // timestamp, so the client cannot disagree with the server about who may write.
    isVerified: s => s.user?.is_verified === true,
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
      catch (e) {
        // Only a genuine 401 means the token itself is invalid — clear it.
        // A 500, an offline blip or the API still booting must not sign the
        // user out: useApi() already clears + redirects on a real 401 on
        // every *other* request, so this only needs to handle the case
        // where /me itself is what failed. Leaving the token in place on
        // anything else lets the next authenticated request (or a plain
        // refresh) re-derive the truth instead of stranding the user at
        // /login with no way back short of re-entering credentials.
        if ((e as ApiError).status === 401) this.clear()
      }
    },

    set(token: string, user: User) {
      this.token = token
      this.user = user
      if (import.meta.client) localStorage.setItem(TOKEN_KEY, token)
    },

    // Separate from `set`: verifying doesn't change the token, so callers
    // would otherwise have to pass `auth.token!` back into the store it came
    // from. This only ever replaces the user.
    setUser(user: User) {
      this.user = user
    },

    clear() {
      this.token = null
      this.user = null
      if (import.meta.client) localStorage.removeItem(TOKEN_KEY)
    },
  },
})
