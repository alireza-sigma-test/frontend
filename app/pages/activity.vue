<script setup lang="ts">
import type { ActivityRow, ActivityType, Paginated } from '~/types/api'

// No <NuxtLayout> — app.vue already wraps every page.
const route = useRoute()
const router = useRouter()

const rows = ref<ActivityRow[]>([])
const meta = ref({ current_page: 1, last_page: 1, per_page: 20, total: 0 })
const loading = ref(true)
const error = ref('')
const pending = ref(0)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const page = Number(route.query.page ?? 1)
    const res = await useApi().get<Paginated<ActivityRow>>(`/activity?per_page=20&page=${page}`)
    rows.value = res.data
    meta.value = res.meta
    pending.value = 0
  }
  catch (e) {
    error.value = (e as ApiError).message
  }
  finally {
    loading.value = false
  }
}
watch(() => route.query.page, load, { immediate: true })

const announcement = useResultAnnouncer(
  () => loading.value,
  () => error.value ? 'Could not load the activity feed.' : `${meta.value.total} events.`,
)

// Same offer-don't-apply rule as the two list screens: this one is paginated
// and strictly time-ordered, so a live insert would push every row down and
// silently shift what page 2 contains under anyone already reading it.
useRealtime(myChannels(), {
  'proposal.created': () => pending.value++,
  'proposal.updated': () => pending.value++,
  'proposal.status_changed': () => pending.value++,
  'review.created': () => pending.value++,
})

// app-screens.html:493-505 writes each row as a sentence — "Ilya Petrov
// submitted Type-safe APIs end to end" — with the raw event name beneath it.
// The verb is the only part that varies, so it is the only part stored here.
const VERBS: Record<ActivityType, string> = {
  'proposal.created': 'submitted',
  'proposal.updated': 'edited',
  'proposal.status_changed': 'decided',
  'review.created': 'reviewed',
}

// The mockup colours proposal.created terracotta, proposal.status_changed
// green and the rest muted — the event name carries a little meaning, not a
// full status vocabulary.
const TYPE_TONE: Record<ActivityType, string> = {
  'proposal.created': 'text-accent-tint-fg',
  'proposal.status_changed': 'text-approved-fg',
  'proposal.updated': 'text-ink-45',
  'review.created': 'text-ink-45',
}

// The decision's outcome lives in the proposal's current status, which the
// row already carries. "decided" alone would leave a reader guessing.
function sentenceSuffix(row: ActivityRow) {
  return row.type === 'proposal.status_changed' ? ` · ${row.proposal.status}` : ''
}
</script>

<template>
  <div>
    <p aria-live="polite" class="sr-only">{{ announcement }}</p>

    <h1 class="t-section text-ink">Activity</h1>
    <!-- The mockup's paragraph explains the mechanism. Kept, but rewritten to
         match what this application actually does: the list does NOT reorder
         without a reload (see the bar below), and the channels are per role
         AND per user, not per role alone. -->
    <p class="t-body text-ink-70 mt-2.5 max-w-[60ch]">
      Everything you can see, newest first — submissions, reviews and decisions.
      Events arrive live over a private channel; the list waits for you to ask
      before it changes underneath you.
    </p>

    <div class="mt-8">
      <UiNewActivity :count="pending" noun="event" @refresh="load" />
    </div>

    <div v-if="loading" class="mt-2"><UiCard><UiSkeleton :lines="8" /></UiCard></div>

    <UiErrorState v-else-if="error" title="Couldn’t load activity" :body="error" class="mt-2" @retry="load" />

    <UiEmptyState
      v-else-if="!rows.length"
      class="mt-2"
      title="Nothing has happened yet"
      body="Submissions, reviews and decisions on proposals you can see will appear here."
    />

    <div v-else class="mt-2">
      <!-- app-screens.html:493 — a 96px time column beside the sentence, rows
           separated by rules rather than boxed as cards. -->
      <ul class="flex flex-col">
        <li
          v-for="row in rows" :key="row.id"
          class="grid grid-cols-[76px_1fr] sm:grid-cols-[96px_1fr] gap-5 py-5 border-t border-rule last:border-b"
        >
          <span class="t-eyebrow text-ink-45 normal-case tracking-normal">{{ relativeTime(row.occurred_at) }}</span>
          <span>
            <span class="t-body text-ink block mb-1">
              <strong class="font-medium">{{ row.actor.name }}</strong>
              {{ VERBS[row.type] }}
              <NuxtLink
                :to="`/proposals/${row.proposal.id}`"
                class="font-medium underline decoration-rule-mid underline-offset-2
                       hover:decoration-ink transition-colors duration-[var(--duration-instant)] ease-out-soft"
              >{{ row.proposal.title }}</NuxtLink>{{ sentenceSuffix(row) }}
            </span>
            <span class="t-eyebrow text-[11px] tracking-[0.08em] normal-case" :class="TYPE_TONE[row.type]">{{ row.type }}</span>
          </span>
        </li>
      </ul>

      <div class="mt-6 flex justify-center">
        <UiPagination
          :current-page="meta.current_page" :last-page="meta.last_page"
          @change="p => router.push({ query: { ...route.query, page: String(p) } })"
        />
      </div>
    </div>
  </div>
</template>
