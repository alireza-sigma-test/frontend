import { defineStore } from 'pinia'
import type { Tag } from '~/types/api'

export const useTagsStore = defineStore('tags', {
  state: () => ({ items: [] as Tag[] }),
  actions: {
    async fetch() {
      // GET /tags wraps its array in `data` — a different envelope shape
      // from the paginated `/proposals` response, per API.md.
      const res = await useApi().get<{ data: Tag[] }>('/tags')
      this.items = res.data
    },
  },
})
