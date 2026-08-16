<script setup lang="ts">
// Status and tag filters live in the URL query, not component state, so a
// filtered view is shareable and the back button restores it. This
// component owns only `status` and `tags` markup — `search` is read here
// (for the query-string preview) but written by the page, whose header
// holds the search box per the design's actual screen-02 layout.
// useProposalFilters is the single owner of the URL-query read/write logic
// itself, shared with pages/proposals/index.vue.
const tags = useTagsStore()
const proposals = useProposalsStore()

const { activeTags, status, search, patchQuery, toggleTag } = useProposalFilters()

function setStatus(value: string) {
  patchQuery({ status: value })
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
          class="flex justify-between items-center t-body px-2.5 py-2 rounded-control text-left
                 transition-colors duration-[var(--duration-instant)] ease-out-soft"
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
      <!-- `failed` used to be written by the store and read nowhere — a
           failed GET /tags degraded silently to "no tag filter" with no way
           for the user to know anything went wrong. Surface it with the
           same retry idiom the page-level error states use. -->
      <div v-if="tags.failed" class="flex items-center gap-3 flex-wrap">
        <p class="t-body text-ink-45">Couldn’t load tags.</p>
        <UiButton variant="secondary" size="sm" @click="tags.fetch()">Try again</UiButton>
      </div>
      <!-- Multi-select, independent — each tag toggles on/off on its own
           (OR semantics), which is exactly the toggle-button contract
           aria-pressed describes, unlike the single-current Status list
           above. -->
      <div v-else class="flex flex-wrap gap-2">
        <button
          v-for="t in tags.items" :key="t.id" type="button"
          class="rounded-badge px-2 py-1 t-label border transition-colors duration-[var(--duration-instant)] ease-out-soft"
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
