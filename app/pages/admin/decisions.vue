<script setup lang="ts">
definePageMeta({ middleware: 'role', roles: ['admin'] })

const store = useProposalsStore()

// The decision queue is the list endpoint with a preset filter — no
// separate route exists (API.md §05). Counters come from the same
// response's `counts` block: there is no `/stats` endpoint (verified live,
// 404 — `GET /api/proposals?status=pending&sort=rating` plus this `counts`
// block covers everything the header needs).
function load() {
  store.fetch({ status: 'pending', sort: 'rating', per_page: '50' })
}
onMounted(load)

// app-screens.html:434-437 colours the pending/approved/rejected counters
// with the same fg tokens the status badge already uses for each — only
// "total" stays plain ink. The brief's own snippet rendered all four the
// same colour.
const counters = computed(() => [
  { key: 'all', label: 'total', value: store.counts.all, tone: 'text-ink' },
  { key: 'pending', label: 'pending', value: store.counts.pending, tone: 'text-pending-fg' },
  { key: 'approved', label: 'approved', value: store.counts.approved, tone: 'text-approved-fg' },
  { key: 'rejected', label: 'rejected', value: store.counts.rejected, tone: 'text-rejected-fg' },
])

// app-screens.html:431 reads "3 proposals have enough reviews to decide" —
// that "enough reviews" gate would be the documented-but-not-real
// `ready_to_decide` field from API.md's `/api/stats` (confirmed live: that
// route 404s — there is no such endpoint, and nothing here enforces a
// minimum review count before a decision anyway). The queue itself already
// is every pending proposal, so this counts what's actually on screen
// rather than asserting a threshold nothing backs.
const subtitle = computed(() => {
  const n = store.items.length
  return `${n} proposal${n === 1 ? '' : 's'} waiting for a decision.`
})

// Mirrors proposals/index.vue's own announcer: a visually-hidden live
// region for the queue-size summary, skipping the page's own initial load
// so only user-driven changes (an approve/reject/reset) get announced.
const announcement = ref('')
let pastInitialLoad = false
watch(() => store.loading, (loading) => {
  if (loading) return
  if (!pastInitialLoad) { pastInitialLoad = true; return }
  announcement.value = store.error ? 'Could not load the queue.' : subtitle.value
})
</script>

<template>
  <div>
    <p aria-live="polite" class="sr-only">{{ announcement }}</p>

    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
      <div>
        <h1 class="t-section text-ink">Decision queue</h1>
        <p v-if="!store.error" class="t-body text-ink-45 mt-1.5">{{ subtitle }}</p>
      </div>
      <div class="flex gap-8">
        <div v-for="c in counters" :key="c.key" class="text-right">
          <p class="font-display text-[30px] leading-none" :class="c.tone">{{ c.value }}</p>
          <p class="t-label text-ink-45 mt-1">{{ c.label }}</p>
        </div>
      </div>
    </div>

    <UiSkeleton v-if="store.loading" class="mt-8" :lines="6" />

    <!-- Same icon-square + tinted-border wrapper design-system.html:404-438
         defines and every other screen's empty/error states already use —
         UiEmptyState/UiErrorState render only the message and action. -->
    <div v-else-if="store.error" class="bg-card border border-rejected-br rounded-card px-8 mt-8">
      <div class="w-[38px] h-[38px] rounded-control border border-rejected-br bg-rejected-bg text-rejected-fg t-label flex items-center justify-center mx-auto mb-[18px]" aria-hidden="true">!</div>
      <UiErrorState title="Couldn’t load the queue" :body="store.error" @retry="load" />
    </div>

    <div v-else-if="!store.items.length" class="bg-card border border-rule rounded-card px-8 mt-8">
      <div class="w-[38px] h-[38px] rounded-control border border-rule-mid mx-auto mb-[18px]" aria-hidden="true" />
      <UiEmptyState title="Nothing waiting" body="Every proposal has a decision." />
    </div>

    <!-- Below `md`, a 5-column table with fixed action-button widths
         doesn't reflow the way ProposalCard's grid does even with a
         horizontal scroll — cards instead, one per queued proposal.
         `ProposalStatusControl`, not `StatusControl`: Nuxt prefixes
         nested-directory components with the folder name (same auto-prefix
         gotcha [id].vue's comment already documents), and the table below
         already uses the resolved name. -->
    <div v-else-if="store.items.length" class="md:hidden mt-8 flex flex-col gap-3">
      <UiCard v-for="p in store.items" :key="p.id">
        <NuxtLink :to="`/proposals/${p.id}`" class="t-title text-ink">{{ p.title }}</NuxtLink>
        <p class="t-eyebrow text-ink-45 mt-1">{{ p.ref }} · {{ p.author.name }}</p>
        <div class="flex items-center gap-3 mt-3">
          <UiBadge :status="p.status" />
          <span v-if="p.average_rating !== null" class="t-label text-ink flex items-center gap-1.5">
            <span class="text-terracotta" aria-hidden="true">★</span>{{ p.average_rating.toFixed(1) }}
            <span class="t-eyebrow text-ink-45">{{ p.reviews_count }}</span>
          </span>
        </div>
        <div v-if="p.can.change_status" class="mt-4"><ProposalStatusControl :proposal="p" @changed="load" /></div>
      </UiCard>
    </div>

    <!-- Not a bare `v-if="store.items.length"`: the mobile block above is
         chained into the loading/error `v-else-if`, but this one is its own
         root condition, so it must re-state those guards. `fetch()` does not
         clear `items` while loading, so without them a decision at >=768px
         renders the skeleton and the stale pre-decision table at once. -->
    <div v-if="!store.loading && !store.error && store.items.length" class="hidden md:block bg-card border border-rule rounded-card overflow-hidden mt-8">
      <!-- The design's own mockup pins this at min-width:1240px — a dense
           5-column table with fixed action-button widths doesn't reflow to
           a phone width the way ProposalCard's grid does. Scroll the table
           itself rather than clipping it (the outer overflow-hidden above
           is only there to round the corners at rest width) or letting it
           blow out the page. -->
      <div class="overflow-x-auto">
        <table class="w-full min-w-[760px] border-collapse">
          <caption class="sr-only">Proposals awaiting a decision</caption>
          <thead>
            <tr class="bg-paper border-b border-rule text-left">
              <th scope="col" class="t-label text-ink-70 py-3.5 pl-6 pr-3">Proposal</th>
              <th scope="col" class="t-label text-ink-70 py-3.5 px-3 w-[150px]">Speaker</th>
              <th scope="col" class="t-label text-ink-70 py-3.5 px-3 w-[110px]">Rating</th>
              <th scope="col" class="t-label text-ink-70 py-3.5 px-3 w-[120px]">Status</th>
              <th scope="col" class="t-label text-ink-70 py-3.5 pl-3 pr-6 w-[230px] text-right">Set status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in store.items" :key="p.id" class="border-b border-sunken last:border-b-0">
              <td class="py-[18px] pl-6 pr-3">
                <NuxtLink :to="`/proposals/${p.id}`" class="t-label text-ink hover:text-terracotta block">{{ p.title }}</NuxtLink>
                <span class="t-eyebrow text-ink-45 block mt-0.5">{{ p.ref }}</span>
              </td>
              <td class="py-[18px] px-3 t-label text-ink-70">{{ p.author.name }}</td>
              <td class="py-[18px] px-3">
                <span v-if="p.average_rating !== null" class="flex items-center gap-1.5">
                  <span class="text-terracotta" aria-hidden="true">★</span>
                  <span class="t-body text-ink">{{ p.average_rating.toFixed(1) }}</span>
                  <span class="t-eyebrow text-ink-45">{{ p.reviews_count }}</span>
                </span>
                <span v-else class="t-body text-ink-45">—</span>
              </td>
              <td class="py-[18px] px-3"><UiBadge :status="p.status" /></td>
              <td class="py-[18px] pl-3 pr-6">
                <ProposalStatusControl v-if="p.can.change_status" :proposal="p" @changed="load" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <p class="t-body text-ink-45 mt-5 max-w-[76ch]">Status changes are logged with the admin’s id and broadcast to the speaker. Reviewers keep read-and-rate rights after a decision but can no longer change the outcome.</p>
  </div>
</template>
