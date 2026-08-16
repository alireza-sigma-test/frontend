<script setup lang="ts">
// No <NuxtLayout> here — app.vue already wraps every page in `default.vue`.
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const store = useProposalsStore()
const tags = useTagsStore()

function load() {
  store.fetch(route.query as Record<string, string>)
}
watch(() => route.query, load, { immediate: true })

const hasFilters = computed(() => !!(route.query.search || route.query.tags || route.query.status))

// Matches the design's own two-state result line exactly: `counts.all` is
// unaffected by filtering (API.md), so it stands in for "the unfiltered
// total" without a second request.
const resultLine = computed(() => hasFilters.value
  ? `${store.meta.total} of ${store.counts.all} proposals`
  : `${store.counts.all} proposals · newest first`)

// Announces only the count, and only after a real, user-driven change —
// see useResultAnnouncer's own doc comment for the initial-load skip.
const announcement = useResultAnnouncer(
  () => store.loading,
  () => store.error ? 'Could not load proposals.' : resultLine.value,
)

// Status/tags/search all live in the URL query — see useProposalFilters,
// the single owner of that state shared with ProposalFilters.vue.
const { activeTags, patchQuery, removeTag, resetAll } = useProposalFilters()
const activeTagChips = computed(() => activeTags.value.map(slug => ({
  slug,
  name: tags.items.find(t => t.slug === slug)?.name ?? slug,
})))

// Local copy of the search box so typing feels instant; debounced 300ms
// before it becomes a URL change (and therefore a request). Re-synced from
// the URL so the box itself — not just the results — reflects the back
// button, a Reset click, or a removed tag chip.
const search = ref(typeof route.query.search === 'string' ? route.query.search : '')
let searchTimer: ReturnType<typeof setTimeout>
watch(search, (v) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => patchQuery({ search: v }), 300)
})
watch(() => route.query.search, (v) => {
  search.value = typeof v === 'string' ? v : ''
})
// A pending debounce firing after the user has already navigated away would
// patch the *destination* route's query instead — patchQuery reads
// route.query at call time, and router.push({ query }) keeps whatever path
// is current — silently adding `?search=…` to wherever they went next and
// breaking the back button. Clear it on unmount so leaving mid-type can't
// leak a stray query param onto the next page.
onUnmounted(() => clearTimeout(searchTimer))
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-8">
    <!-- Filters are part of this page, not a layout slot. -->
    <aside class="w-full lg:w-[260px] shrink-0">
      <details class="lg:hidden border border-rule rounded-card bg-card p-3">
        <summary class="t-label text-ink cursor-pointer">Filters</summary>
        <div class="mt-4"><ProposalFilters /></div>
      </details>
      <div class="hidden lg:block"><ProposalFilters /></div>
    </aside>

    <div class="flex-1 min-w-0">
      <!-- Announces only the count, and only after a real, user-driven
           change — see useResultAnnouncer for the initial-load skip. -->
      <p aria-live="polite" class="sr-only">{{ announcement }}</p>

      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="t-section text-ink">Proposals</h1>
          <p v-if="!store.error" class="t-body text-ink-45 mt-1.5">{{ resultLine }}</p>
        </div>
        <!-- items-end, not -center: UiInput renders a label above its field, making
             it taller than the buttons. Centering aligns against that full height and
             leaves the buttons floating above the field instead of level with it. -->
        <div class="flex items-end gap-3 flex-wrap">
          <UiInput v-model="search" label="Search" placeholder="Search titles…" />
          <UiButton variant="secondary" size="sm" @click="resetAll">Reset</UiButton>
          <UiButton v-if="auth.user && auth.isSpeaker" to="/proposals/new" size="sm">Submit a proposal</UiButton>
        </div>
      </div>

      <div v-if="activeTagChips.length" class="flex items-center gap-2 flex-wrap mb-5">
        <span class="t-label text-ink-45">Filtered by</span>
        <span
          v-for="t in activeTagChips" :key="t.slug"
          class="rounded-badge bg-accent-tint text-accent-tint-fg px-2 py-1 t-label inline-flex items-center gap-2"
        >
          {{ t.name }}
          <button
            type="button"
            class="opacity-65 hover:opacity-100 transition-opacity duration-[var(--duration-instant)] ease-out-soft"
            :aria-label="`Remove ${t.name} filter`" @click="removeTag(t.slug)"
          >✕</button>
        </span>
      </div>

      <div v-if="store.loading" class="flex flex-col gap-3">
        <UiCard v-for="n in 3" :key="n"><UiSkeleton :lines="4" /></UiCard>
      </div>

      <UiErrorState v-else-if="store.error" title="Couldn’t load proposals" :body="store.error" @retry="load" />

      <UiEmptyState v-else-if="!store.items.length" title="Nothing matches those filters" body="Try a shorter search term or clear a tag.">
        <UiButton variant="secondary" size="sm" @click="resetAll">Clear all filters</UiButton>
      </UiEmptyState>

      <div v-else class="flex flex-col gap-3.5">
        <ProposalCard v-for="p in store.items" :key="p.id" :proposal="p" />
        <div class="mt-4 flex justify-center">
          <UiPagination
            :current-page="store.meta.current_page" :last-page="store.meta.last_page"
            @change="p => router.push({ query: { ...route.query, page: String(p) } })"
          />
        </div>
      </div>
    </div>
  </div>
</template>
