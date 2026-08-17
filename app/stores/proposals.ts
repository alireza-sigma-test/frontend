import { defineStore } from 'pinia'
import type { Counts, PaginatedProposals, Proposal } from '~/types/api'

// Module-level, not Pinia state: it only discards stale responses when overlapping
// fetches race, so it is not UI state.
let requestSeq = 0

export const useProposalsStore = defineStore('proposals', {
  state: () => ({
    items: [] as Proposal[],
    meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
    counts: { all: 0, pending: 0, approved: 0, rejected: 0 } as Counts,
    loading: false,
    error: '' as string,
    // Events arrived since this list was fetched, counted rather than applied.
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
        // A newer request is in flight, so this response describes filters the user
        // has already moved on from.
        if (requestId !== requestSeq) return
        this.items = res.data
        this.meta = res.meta
        // Unaffected by search/tags/status, so the sidebar tallies stay stable.
        this.counts = res.counts
        // This response already covers whatever those events announced.
        this.pending = 0
      } catch (e) {
        if (requestId !== requestSeq) return
        this.error = (e as ApiError).message
      } finally {
        // Only the newest request may clear the spinner, or a stale one finishing
        // flips it false out from under a live one.
        if (requestId === requestSeq) this.loading = false
      }
    },

    /**
     * Counts the event; never touches `items`. Inserting would be silently wrong three
     * ways: this list is filtered and sorted server-side, so a client insert can show a
     * row the filter excludes; on page 2 the row belongs on page 1; and a row appearing
     * above what someone is reading moves the page under them.
     *
     * So the screen offers and the reader decides.
     */
    notePending() {
      this.pending += 1
    },
  },
})
