// Status, tags and search live in the URL query, so a filtered view is shareable and
// the back button restores it. Both the page and ProposalFilters.vue read and write
// that state, so this composable owns the logic rather than each holding a copy.
export function useProposalFilters() {
  const route = useRoute()
  const router = useRouter()

  const activeTags = computed(() => {
    const raw = route.query.tags
    return typeof raw === 'string' ? raw.split(',').filter(Boolean) : []
  })
  const status = computed(() => (typeof route.query.status === 'string' ? route.query.status : ''))
  const search = computed(() => (typeof route.query.search === 'string' ? route.query.search : ''))

  function patchQuery(patch: Record<string, string | undefined>) {
    const current: Record<string, string> = {}
    for (const [k, v] of Object.entries(route.query)) {
      if (typeof v === 'string' && v !== '') current[k] = v
    }
    const merged = { ...current, ...patch }
    const query: Record<string, string> = {}
    for (const [k, v] of Object.entries(merged)) {
      if (v) query[k] = v
    }
    // Any filter change returns to page 1.
    delete query.page
    router.push({ query })
  }

  function toggleTag(slug: string) {
    const next = activeTags.value.includes(slug)
      ? activeTags.value.filter(s => s !== slug)
      : [...activeTags.value, slug]
    patchQuery({ tags: next.join(',') })
  }

  function removeTag(slug: string) {
    patchQuery({ tags: activeTags.value.filter(s => s !== slug).join(',') })
  }

  function resetAll() {
    router.push({ query: {} })
  }

  return { activeTags, status, search, patchQuery, toggleTag, removeTag, resetAll }
}
