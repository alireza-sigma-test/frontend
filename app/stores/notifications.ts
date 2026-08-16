import { defineStore } from 'pinia'
import type { AppNotification, Paginated } from '~/types/api'

/**
 * The bell's data.
 *
 * **`unreadCount` comes from a fetch, and live events only nudge it.** That
 * ordering is the whole fallback the spec asks for: with no socket the count is
 * still right, because it was never derived from the socket in the first place.
 * A design where events *are* the count would show 0 to every browser that
 * could not connect — and would look like "nothing happened" rather than like a
 * failure.
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
    /** The authoritative read. Everything else adjusts what this returned. */
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

      // Optimistic: the dot and the badge answer the click immediately, and
      // the failure path below puts both back rather than leaving the UI
      // claiming something that did not happen.
      //
      // The endpoint also returns the authoritative total in X-Unread-Count,
      // which this deliberately does not read: useApi() returns parsed bodies
      // and these writes are 204s, so reading the header would mean a second
      // HTTP helper for one number that decrementing already gets right. The
      // next fetch() reconciles if it ever does not.
      target.read_at = new Date().toISOString()
      this.unreadCount = Math.max(0, this.unreadCount - 1)

      try {
        await useApi().post(`/notifications/${id}/read`)
      }
      catch {
        // Put it back rather than leave the UI claiming something it failed
        // to do.
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
     * A live event arrived. Bump the badge now, then refetch the list.
     *
     * The badge moves immediately because that is the point of the socket; the
     * list is refetched rather than reconstructed from the event, because the
     * event payload is deliberately thin and carries none of a notification's
     * fields — no id, no title, no body, no read state. Inventing them here
     * would put a second, drifting copy of the notification wording in the
     * client.
     */
    noteIncoming() {
      this.unreadCount += 1
      if (this.loaded) this.fetch()
    },
  },
})
