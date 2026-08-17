<script setup lang="ts">
import type { RealtimeEvent } from '~/composables/useRealtime'
import type { ProposalDetail } from '~/types/api'

const route = useRoute()
const id = Number(route.params.id)

const proposal = ref<ProposalDetail | null>(null)
const loading = ref(true)
const notFound = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  notFound.value = false
  error.value = ''
  try {
    proposal.value = await useApi().get<ProposalDetail>(`/proposals/${id}`)
  } catch (e) {
    const err = e as ApiError
    // A 404 means "not found for you": the API returns 404 rather than 403 for
    // another speaker's proposal, so this is never labelled a permission error.
    if (err.status === 404) notFound.value = true
    else error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(load)

// `heading` is where focus returns to: the loading branch unmounts this whole grid
// including the review form, so without it a keyboard user submitting a review is
// dropped at <body>.
const heading = ref<HTMLHeadingElement>()
const announcement = useResultAnnouncer(
  () => loading.value,
  () => error.value ? 'Could not load this proposal.' : 'Proposal updated.',
  () => heading.value?.focus(),
)

// A fixed MB unit renders the seeded 231-byte attachment as "0.0 MB", which reads as
// an empty file, so the unit scales.
const fileSize = (b: number) =>
  b < 1024 ? `${b} B`
    : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB`
      : `${(b / 1024 / 1024).toFixed(1)} MB`

// Unlike the list screens, this one applies live updates: one record on the page means
// nothing can reorder or appear above what the reader is looking at.
//
// Every handler ignores events about other proposals — role-channel subscribers receive
// mostly events about something else.
function isThisProposal(event: RealtimeEvent) {
  return event.proposal.id === id
}

// A refetch caused by somebody else's action must not pull focus: onSettled moving to
// the heading is right after the reader submits a review, wrong when an admin elsewhere
// approves something. The announcement still fires.
function reload() {
  announcement.suppressOnce()
  load()
}

useRealtime(myChannels(), {
  // Both: the payload's status changes the badge instantly, but `can` is computed
  // server-side, so patching alone leaves an Edit button that 403s and refetching
  // alone leaves the badge stale for a round trip.
  'proposal.status_changed': (event) => {
    if (!isThisProposal(event) || !proposal.value) return
    proposal.value.status = event.proposal.status
    reload()
  },
  // Refetch rather than widen the payload: a new review moves the average, the count
  // and the list, and a role-channel event should not carry the author's rating.
  'review.created': event => isThisProposal(event) && reload(),
  'proposal.updated': event => isThisProposal(event) && reload(),
})
</script>

<template>
  <div>
    <!-- One root element: app.vue's <Transition> silently applies nothing to a
         multi-root page. This note sits inside the wrapper because Nuxt's root check
         counts a template-level comment as a second root node. -->
    <p aria-live="polite" class="sr-only">{{ announcement }}</p>

    <UiCard v-if="loading"><UiSkeleton :lines="10" /></UiCard>

    <!-- UiEmptyState/UiErrorState own the card + icon square themselves. -->
    <UiEmptyState v-else-if="notFound" title="Proposal not found" body="It may have been removed, or it isn’t one of yours.">
      <!-- UiButton renders its own link when given `to`; nesting it in a NuxtLink
           would nest two interactive elements. -->
      <UiButton to="/proposals" variant="secondary" size="sm">Back to all proposals</UiButton>
    </UiEmptyState>

    <UiErrorState v-else-if="error" title="Couldn’t load this proposal" :body="error" @retry="load" />

    <!-- `minmax(0,1fr)` at the base breakpoint too: without a column definition an
         implicit track sizes to its widest item rather than the container, which
         overflowed the 375px viewport. The 0 floor makes it clamp. -->
    <div v-else-if="proposal" class="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_380px] gap-10 lg:gap-9">
      <div class="lg:border-r lg:border-rule lg:pr-14">
        <NuxtLink
          to="/proposals"
          class="t-label text-ink-45 hover:text-ink transition-colors duration-[var(--duration-instant)] ease-out-soft"
        >‹ All proposals</NuxtLink>

        <div class="flex items-center gap-3 mt-4">
          <span class="t-eyebrow text-ink-45">{{ proposal.ref }}</span>
          <UiBadge :status="proposal.status" />
          <span class="t-eyebrow text-ink-45">Submitted {{ relativeTime(proposal.created_at) }}</span>
        </div>

        <!-- The design's 48px matches none of main.css's seven type styles; t-section
             is what screen 03's page heading uses, so an 8px gap does not earn an
             eighth style. -->
        <!-- tabindex="-1": a programmatic focus target only, never in the tab order. -->
        <h1 ref="heading" tabindex="-1" class="t-section text-ink mt-3 max-w-[26ch]">{{ proposal.title }}</h1>

        <div class="flex items-center gap-3 mt-4">
          <UiAvatar :initials="proposal.author.initials" />
          <span class="t-label text-ink">{{ proposal.author.name }}</span>
          <!-- Same accent-tint pill as ProposalCard and the tag input. -->
          <span
            v-for="t in proposal.tags" :key="t.id"
            class="rounded-badge bg-accent-tint text-accent-tint-fg px-2 py-1 t-label"
          >{{ t.name }}</span>
        </div>

        <!-- The control decisions.vue mounts, gated on the server's own
             `can.change_status`, so an admin can decide without returning to the queue.
             `align="start"` because its default is right-aligned for its other home, a
             table cell — unset here the button strands itself at the far edge of the
             reading column. -->
        <div v-if="proposal.can.change_status" class="mt-6">
          <ProposalStatusControl :proposal="proposal" align="start" @changed="load" />
        </div>

        <!-- ink-85: full-length reading copy, like review comments below. ink-70 is
             for captions and previews. -->
        <p class="t-body text-ink-85 mt-6 whitespace-pre-line max-w-[70ch]">{{ proposal.description }}</p>

        <!-- `flex`, not `inline-flex`: shrink-to-fit defeats the filename's `min-w-0`
             truncation, so it needs a real width to truncate against. -->
        <a
          v-if="proposal.attachment" :href="proposal.attachment.url" target="_blank" rel="noopener"
          class="mt-8 flex items-center gap-3.5 rounded-control border border-rule bg-card px-4 py-3.5 max-w-[30rem]
                 hover:border-ink transition-colors duration-[var(--duration-instant)] ease-out-soft"
        >
          <!-- Same file-fg/bg/br chip ProposalCard uses for the PDF badge. -->
          <span class="rounded-badge border border-file-br bg-file-bg text-file-fg t-eyebrow px-1.5 py-1 flex-none">PDF</span>
          <span class="flex-1 min-w-0">
            <span class="t-body text-ink block truncate">{{ proposal.attachment.filename }}</span>
            <span class="t-eyebrow text-ink-45">{{ fileSize(proposal.attachment.size_bytes) }}</span>
          </span>
          <span class="t-label text-ink rounded-control border border-rule-strong px-3.5 py-2 flex-none">Open</span>
        </a>

        <!-- Mono eyebrow with a bottom rule, matching every other sub-section header,
             not a serif t-title. -->
        <h2 class="t-eyebrow text-ink-70 mt-14 pb-3 border-b border-rule">Reviews · {{ proposal.reviews_count }}</h2>
        <!-- Nuxt prefixes nested-directory components with the folder name unless the
             filename already starts with it, so a bare `<ReviewList>` resolves to
             nothing. -->
        <ProposalReviewList v-if="proposal.reviews.length" class="mt-6" :reviews="proposal.reviews" :max-rating="proposal.max_rating" />
        <p v-else class="t-body text-ink-45 mt-4">No reviews yet.</p>
      </div>

      <aside class="flex flex-col gap-5">
        <!-- Above the review form: a reading aid read after forming an opinion is a
             second opinion, not an aid.

             Gated on can.view_summary rather than on the presence of `summary` —
             key-presence works today and starts leaking the moment the shape
             changes. -->
        <ProposalSummary
          v-if="proposal.can.view_summary"
          :status="proposal.summary_status"
          :summary="proposal.summary"
        />

        <!-- The review form sits above Aggregate. -->
        <ProposalReviewForm
          v-if="proposal.can.review"
          :proposal-id="proposal.id" :max-rating="proposal.max_rating" :existing="proposal.my_review"
          @saved="load"
        />

        <UiCard>
          <p class="t-eyebrow text-ink-45 mb-4">Aggregate</p>
          <!-- One baseline-aligned row, not two stacked lines. 44px serif is a hero
               stat, so it takes an arbitrary-value utility rather than an eighth
               named type style. -->
          <div class="flex items-baseline gap-2.5">
            <span class="font-display text-ink text-[44px] leading-none">
              {{ proposal.average_rating !== null ? proposal.average_rating.toFixed(1) : '—' }}
            </span>
            <span class="t-body text-ink-45">
              {{ proposal.reviews_count ? `from ${proposal.reviews_count} review${proposal.reviews_count === 1 ? '' : 's'}` : 'no reviews yet' }}
            </span>
          </div>
        </UiCard>
      </aside>
    </div>
  </div>
</template>
