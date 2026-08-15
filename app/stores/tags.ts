import { defineStore } from 'pinia'
import type { Tag } from '~/types/api'

// Module-level, not Pinia state: the in-flight request, shared across every
// caller. `ProposalFilters` is legitimately mounted twice at once (the
// mobile disclosure and the desktop sidebar — CSS decides which is
// visible, both are real DOM instances), so both fire `fetch()` on mount
// around the same tick. Without this, both would see an empty `items` and
// issue their own `GET /tags`. Keeping the guard here — where the shared
// resource actually lives — means any future caller gets the same
// deduplication for free, rather than every call site having to remember
// its own mount-time check.
let inflight: Promise<void> | null = null

export const useTagsStore = defineStore('tags', {
  state: () => ({ items: [] as Tag[], failed: false }),
  actions: {
    async fetch() {
      if (this.items.length) return
      if (inflight) return inflight

      this.failed = false
      inflight = (async () => {
        // GET /tags wraps its array in `data` — a different envelope shape
        // from the paginated `/proposals` response, per API.md.
        const res = await useApi().get<{ data: Tag[] }>('/tags')
        this.items = res.data
      })()
        // Settled here, deliberately: every concurrent caller adopts this one
        // promise, so letting it reject raises one unhandled rejection per
        // caller rather than one per failure. Tags are a filter affordance,
        // not page content — losing them degrades to "no tag filter", which
        // is why this resolves instead of propagating.
        .catch(() => { this.failed = true })
        .finally(() => { inflight = null })

      return inflight
    },
  },
})
