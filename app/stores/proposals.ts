import { defineStore } from 'pinia'
import type { Counts, Paginated, Proposal } from '~/types/api'

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
  }),

  actions: {
    async fetch(query: Record<string, string> = {}) {
      const requestId = ++requestSeq
      this.loading = true
      this.error = ''
      try {
        const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== '' && v != null)).toString()
        const res = await useApi().get<Paginated<Proposal>>(`/proposals${qs ? `?${qs}` : ''}`)
        // A newer request was issued while this one was in flight — its
        // response describes the URL/filters as they are now, this one
        // describes filters the user has already moved on from. Discard.
        if (requestId !== requestSeq) return
        this.items = res.data
        this.meta = res.meta
        // `counts` is deliberately unaffected by search/tags/status, so the
        // sidebar tallies stay stable while filtering — API.md guarantees this.
        this.counts = res.counts
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
  },
})
