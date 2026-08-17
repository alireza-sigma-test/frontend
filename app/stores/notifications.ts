import { defineStore } from 'pinia'
import type { AppNotification, Paginated } from '~/types/api'

/**
 * `unreadCount` comes from a fetch and live events only nudge it. That ordering is the
 * fallback: a design where events *are* the count shows 0 to every browser that cannot
 * connect, which reads as "nothing happened" rather than as a failure.
 */
export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    items: [] as AppNotification[],
    unreadCount: 0,
    loading: false,
    error: '' as string,
    loaded: false,
  }),

  actions: {
    /** The authoritative read; everything else adjusts what it returned. */
    async fetch() {
      this.loading = true
      this.error = ''
      try {
        const res = await useApi().get<Paginated<AppNotification>>('/notifications?per_page=15')
        this.items = res.data
        this.unreadCount = res.meta.unread_count ?? 0
        this.loaded = true
      }
      catch (e) {
        this.error = (e as ApiError).message
      }
      finally {
        this.loading = false
      }
    },

    async markRead(id: string) {
      const target = this.items.find(n => n.id === id)
      if (!target || target.read_at) return

      // Optimistic, with the catch below putting both back on failure.
      //
      // The endpoint's authoritative X-Unread-Count header is deliberately not read:
      // useApi() returns parsed bodies and these writes are 204s, so it would mean a
      // second HTTP helper for a number decrementing already gets right.
      target.read_at = new Date().toISOString()
      this.unreadCount = Math.max(0, this.unreadCount - 1)

      try {
        await useApi().post(`/notifications/${id}/read`)
      }
      catch {
        target.read_at = null
        this.unreadCount += 1
      }
    },

    async markAllRead() {
      const previous = this.items.map(n => n.read_at)
      const previousCount = this.unreadCount

      const now = new Date().toISOString()
      this.items.forEach(n => (n.read_at ??= now))
      this.unreadCount = 0

      try {
        await useApi().post('/notifications/read-all')
      }
      catch {
        this.items.forEach((n, i) => (n.read_at = previous[i] ?? null))
        this.unreadCount = previousCount
      }
    },

    /**
     * The badge moves immediately, but the list is refetched rather than rebuilt from
     * the event: the payload carries no id, title, body or read state, and inventing
     * them would put a drifting copy of the notification wording in the client.
     */
    noteIncoming() {
      this.unreadCount += 1
      if (this.loaded) this.fetch()
    },
  },
})
