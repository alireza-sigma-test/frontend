import { defineStore } from 'pinia'
import type { Tag } from '~/types/api'

// The in-flight request, shared across callers. ProposalFilters is legitimately
// mounted twice at once (mobile disclosure and desktop sidebar), so both fetch on the
// same tick and would otherwise each issue their own GET /tags. Deduping here rather
// than per call site means future callers get it for free.
let inflight: Promise<void> | null = null

export const useTagsStore = defineStore('tags', {
  state: () => ({ items: [] as Tag[], failed: false }),
  actions: {
    async fetch() {
      if (this.items.length) return
      if (inflight) return inflight

      this.failed = false
      inflight = (async () => {
        // GET /tags wraps its array in `data`, a different envelope from /proposals.
        const res = await useApi().get<{ data: Tag[] }>('/tags')
        this.items = res.data
      })()
        // Settled here on purpose: every concurrent caller adopts this one promise, so
        // rejecting would raise one unhandled rejection per caller. Tags are a filter
        // affordance, so losing them degrades to "no tag filter".
        .catch(() => { this.failed = true })
        .finally(() => { inflight = null })

      return inflight
    },
  },
})
