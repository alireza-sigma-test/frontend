<script setup lang="ts">
// Status and tag filters live in the URL query, not component state, so a
// filtered view is shareable and the back button restores it. This
// component owns only `status` and `tags` — `search` is read here (for the
// query-string preview) but written by the page, whose header holds the
// search box per the design's actual screen-02 layout.
const route = useRoute()
const router = useRouter()
const tags = useTagsStore()
const proposals = useProposalsStore()

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

function setStatus(value: string) {
  patchQuery({ status: value })
}

function toggleTag(slug: string) {
  const next = activeTags.value.includes(slug)
    ? activeTags.value.filter(s => s !== slug)
    : [...activeTags.value, slug]
  patchQuery({ tags: next.join(',') })
}

const statusOptions = computed(() => [
  { value: '', label: 'All proposals', count: proposals.counts.all },
  { value: 'pending', label: 'Pending', count: proposals.counts.pending },
  { value: 'approved', label: 'Approved', count: proposals.counts.approved },
  { value: 'rejected', label: 'Rejected', count: proposals.counts.rejected },
])

// Mirrors the design's own live preview exactly: search, then tags, then
// status, and never `page` — this box demonstrates how filters compose,
// not pagination.
const queryString = computed(() => {
  const parts: string[] = []
  if (search.value) parts.push(`search=${encodeURIComponent(search.value)}`)
  if (activeTags.value.length) parts.push(`tags=${activeTags.value.join(',')}`)
  if (status.value) parts.push(`status=${status.value}`)
  return `/api/proposals${parts.length ? `?${parts.join('&')}` : ''}`
})

// The store itself dedupes concurrent calls — this component is mounted
// twice at once (mobile disclosure + desktop sidebar), so both copies call
// this on mount.
onMounted(() => { tags.fetch() })
</script>

<template>
  <div class="flex flex-col gap-9">
    <div>
      <p class="t-eyebrow text-ink-45 mb-4">Status</p>
      <!-- Single-select, mutually exclusive — the same "which one am I
           looking at" relationship as UiPagination's page buttons, which
           this codebase already marks with aria-current rather than
           aria-pressed. Not a real toggle: clicking the active one again
           is a no-op, it never turns "off" on its own. -->
      <div class="flex flex-col gap-1">
        <button
          v-for="s in statusOptions" :key="s.value" type="button"
          class="flex justify-between items-center t-body px-2.5 py-2 rounded-control transition-colors text-left"
          :class="status === s.value ? 'bg-sunken text-ink' : 'text-ink-70 hover:bg-sunken'"
          :aria-current="status === s.value ? 'true' : undefined"
          @click="setStatus(s.value)"
        >
          <span>{{ s.label }}</span>
          <span class="t-eyebrow text-ink-45">{{ s.count }}</span>
        </button>
      </div>
    </div>

    <div>
      <p class="t-eyebrow text-ink-45 mb-4">Tags</p>
      <!-- Multi-select, independent — each tag toggles on/off on its own
           (OR semantics), which is exactly the toggle-button contract
           aria-pressed describes, unlike the single-current Status list
           above. -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="t in tags.items" :key="t.id" type="button"
          class="rounded-badge px-2 py-1 t-label border transition-colors"
          :class="activeTags.includes(t.slug)
            ? 'bg-accent-tint text-accent-tint-fg border-transparent'
            : 'border-rule text-ink-70 hover:border-ink hover:text-ink'"
          :aria-pressed="activeTags.includes(t.slug)"
          @click="toggleTag(t.slug)"
        >{{ t.name }}</button>
      </div>
    </div>

    <div class="border-t border-rule pt-6">
      <p class="t-label text-ink-45">Filters compose into one query string the API reads directly.</p>
      <code class="t-eyebrow text-terracotta break-all block mt-2.5">{{ queryString }}</code>
    </div>
  </div>
</template>
