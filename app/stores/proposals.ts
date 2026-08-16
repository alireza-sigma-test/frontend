import { defineStore } from 'pinia'
import type { Counts, PaginatedProposals, Proposal } from '~/types/api'

// Module-level, not Pinia state: a plain sequence counter used only to
// detect and discard stale responses when overlapping fetches race (rapid
// filter changes). It isn't meaningful UI state, so it doesn't belong in
// the reactive `state()` tree — same reasoning as `useToast`'s module-level
// `nextId` counter.
let requestSeq = 0

export const useProposalsStore = defineStore('proposals', {
  state: () => ({
    items: [] as Proposal[],
    meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
    counts: { all: 0, pending: 0, approved: 0, rejected: 0 } as Counts,
    loading: false,
    error: '' as string,
    // Live events that have arrived since this list was fetched, counted
    // rather than applied. See notePending().
    pending: 0,
  }),

  actions: {
    async fetch(query: Record<string, string> = {}) {
      const requestId = ++requestSeq
      this.loading = true
      this.error = ''
      try {
        const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== '' && v != null)).toString()
        const res = await useApi().get<PaginatedProposals>(`/proposals${qs ? `?${qs}` : ''}`)
        // A newer request was issued while this one was in flight — its
        // response describes the URL/filters as they are now, this one
        // describes filters the user has already moved on from. Discard.
        if (requestId !== requestSeq) return
        this.items = res.data
        this.meta = res.meta
        // `counts` is deliberately unaffected by search/tags/status, so the
        // sidebar tallies stay stable while filtering — API.md guarantees this.
        this.counts = res.counts
        // This response already contains everything those events were telling
        // us about, so the banner has nothing left to offer.
        this.pending = 0
      } catch (e) {
        if (requestId !== requestSeq) return
        this.error = (e as ApiError).message
      } finally {
        // Only the most recent request may clear the spinner. If a newer
        // request is still in flight, this stale one finishing must not
        // flip `loading` false out from under it.
        if (requestId === requestSeq) this.loading = false
      }
    },

    /**
     * A live event arrived. Count it; do not touch `items`.
     *
     * Inserting the row would be wrong three ways, and all three are silent:
     * this list is filtered and sorted **server-side** (search, tags, status,
     * sort=rating), so a client-side insert can show a proposal the active
     * filter excludes and put it in a position the server would not; on page 2
     * the new item belongs on page 1; and a row appearing above what someone
     * is reading moves the page under their cursor, which is worse than no
     * live update at all.
     *
     * So the screen offers, and the reader decides. The count is the whole
     * state — the payload is deliberately thin and carries nothing this list
     * could render without a fetch anyway.
     */
    notePending() {
      this.pending += 1
    },
  },
})
