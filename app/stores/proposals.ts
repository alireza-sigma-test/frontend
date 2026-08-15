import { defineStore } from 'pinia'
import type { Counts, Paginated, Proposal } from '~/types/api'

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
      this.loading = true
      this.error = ''
      try {
        const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== '' && v != null)).toString()
        const res = await useApi().get<Paginated<Proposal>>(`/proposals${qs ? `?${qs}` : ''}`)
        this.items = res.data
        this.meta = res.meta
        // `counts` is deliberately unaffected by search/tags/status, so the
        // sidebar tallies stay stable while filtering — API.md guarantees this.
        this.counts = res.counts
      } catch (e) {
        this.error = (e as ApiError).message
      } finally {
        this.loading = false
      }
    },
  },
})
