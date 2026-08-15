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

// A visually-hidden, always-mounted live region announces the same count
// summary shown on screen — never the list itself — whenever a fetch
// finishes because of something the user did (a filter change, Reset,
// retry, a page change). The very first loading→loaded transition is the
// page's own initial load, not a user action, so it's deliberately
// skipped rather than announced.
const announcement = ref('')
let pastInitialLoad = false
watch(() => store.loading, (loading) => {
  if (loading) return
  if (!pastInitialLoad) { pastInitialLoad = true; return }
  announcement.value = store.error ? 'Could not load proposals.' : resultLine.value
})

const activeTagSlugs = computed(() => {
  const raw = route.query.tags
  return typeof raw === 'string' ? raw.split(',').filter(Boolean) : []
})
const activeTagChips = computed(() => activeTagSlugs.value.map(slug => ({
  slug,
  name: tags.items.find(t => t.slug === slug)?.name ?? slug,
})))

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
  delete query.page
  router.push({ query })
}

function removeTag(slug: string) {
  patchQuery({ tags: activeTagSlugs.value.filter(s => s !== slug).join(',') })
}

function resetAll() {
  router.push({ query: {} })
}

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
           change — see the `pastInitialLoad` guard above. -->
      <p aria-live="polite" class="sr-only">{{ announcement }}</p>

      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="t-section text-ink">Proposals</h1>
          <p v-if="!store.error" class="t-body text-ink-45 mt-1.5">{{ resultLine }}</p>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
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
          <button type="button" class="opacity-65 hover:opacity-100" :aria-label="`Remove ${t.name} filter`" @click="removeTag(t.slug)">✕</button>
        </span>
      </div>

      <div v-if="store.loading" class="flex flex-col gap-3">
        <UiCard v-for="n in 3" :key="n"><UiSkeleton :lines="4" /></UiCard>
      </div>

      <div v-else-if="store.error" class="bg-card border border-rejected-br rounded-card px-8">
        <div class="w-[38px] h-[38px] rounded-control border border-rejected-br bg-rejected-bg text-rejected-fg t-label flex items-center justify-center mx-auto mb-[18px]" aria-hidden="true">!</div>
        <UiErrorState title="Couldn’t load proposals" :body="store.error" @retry="load" />
      </div>

      <div v-else-if="!store.items.length" class="bg-card border border-rule rounded-card px-8">
        <div class="w-[38px] h-[38px] rounded-control border border-rule mx-auto mb-[18px]" aria-hidden="true" />
        <UiEmptyState title="Nothing matches those filters" body="Try a shorter search term or clear a tag.">
          <UiButton variant="secondary" size="sm" @click="resetAll">Clear all filters</UiButton>
        </UiEmptyState>
      </div>

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
