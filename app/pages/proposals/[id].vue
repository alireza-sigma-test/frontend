<script setup lang="ts">
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
    // A 404 here means "not found for you" — the API deliberately returns
    // 404 rather than 403 for another speaker's proposal (verified live:
    // dana@example.com against a proposal she doesn't own), so this is
    // never labelled a permission error.
    if (err.status === 404) notFound.value = true
    else error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(load)

const sizeMb = (b: number) => (b / 1024 / 1024).toFixed(1)
</script>

<template>
  <UiCard v-if="loading"><UiSkeleton :lines="10" /></UiCard>

  <!-- Both empty/error states below reproduce the icon-square + card
       wrapper design-system.html:404-438 defines and index.vue already
       uses — UiEmptyState/UiErrorState render only the message and action,
       never the square or the state-tinted border themselves. -->
  <div v-else-if="notFound" class="bg-card border border-rule rounded-card px-8">
    <div class="w-[38px] h-[38px] rounded-control border border-rule mx-auto mb-[18px]" aria-hidden="true" />
    <UiEmptyState title="Proposal not found" body="It may have been removed, or it isn’t one of yours.">
      <!-- UiButton renders its own link when given `to` — nesting it inside
           a NuxtLink (as literally written in the brief) would put one
           interactive element inside another. -->
      <UiButton to="/proposals" variant="secondary" size="sm">Back to all proposals</UiButton>
    </UiEmptyState>
  </div>

  <div v-else-if="error" class="bg-card border border-rejected-br rounded-card px-8">
    <div class="w-[38px] h-[38px] rounded-control border border-rejected-br bg-rejected-bg text-rejected-fg t-label flex items-center justify-center mx-auto mb-[18px]" aria-hidden="true">!</div>
    <UiErrorState title="Couldn’t load this proposal" :body="error" @retry="load" />
  </div>

  <div v-else-if="proposal" class="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-10 lg:gap-9">
    <div class="lg:border-r lg:border-rule lg:pr-14">
      <NuxtLink to="/proposals" class="t-label text-ink-45 hover:text-ink">‹ All proposals</NuxtLink>

      <div class="flex items-center gap-3 mt-4">
        <span class="t-eyebrow text-ink-45">{{ proposal.ref }}</span>
        <UiBadge :status="proposal.status" />
        <span class="t-eyebrow text-ink-45">Submitted {{ relativeTime(proposal.created_at) }}</span>
      </div>

      <!-- app-screens.html:319 renders this heading at 48px, between
           t-section (40) and t-display (76) and matching none of the seven
           declared type styles exactly. main.css commits to exactly those
           seven, and t-section is already how screen 03's page heading —
           the same role, one screen over — was built, so this keeps that
           precedent rather than adding an eighth ad hoc size for an 8px gap. -->
      <h1 class="t-section text-ink mt-3 max-w-[26ch]">{{ proposal.title }}</h1>

      <div class="flex items-center gap-3 mt-4">
        <UiAvatar :initials="proposal.author.initials" />
        <span class="t-label text-ink">{{ proposal.author.name }}</span>
        <!-- Same accent-tint pill as ProposalCard and the tag input — the
             brief's own snippet used a plain ink-45 bordered badge here,
             which matches nothing else already shipped. -->
        <span
          v-for="t in proposal.tags" :key="t.id"
          class="rounded-badge bg-accent-tint text-accent-tint-fg px-2 py-1 t-label"
        >{{ t.name }}</span>
      </div>

      <!-- ink-85, not ink-70: this is full-length reading copy
           (app-screens.html:328), the same treatment review comments get
           below — lighter ink-70 is for captions and previews elsewhere. -->
      <p class="t-body text-ink-85 mt-6 whitespace-pre-line max-w-[70ch]">{{ proposal.description }}</p>

      <a
        v-if="proposal.attachment" :href="proposal.attachment.url" target="_blank" rel="noopener"
        class="mt-8 inline-flex items-center gap-3.5 rounded-control border border-rule bg-card px-4 py-3.5 max-w-[30rem] hover:border-ink transition-colors"
      >
        <!-- Same file-fg/bg/br chip ProposalCard already uses for the PDF
             badge — the brief's page snippet used a plain ink-45 label
             instead of this already-established token family. -->
        <span class="rounded-badge border border-file-br bg-file-bg text-file-fg t-eyebrow px-1.5 py-1 flex-none">PDF</span>
        <span class="flex-1 min-w-0">
          <span class="t-body text-ink block truncate">{{ proposal.attachment.filename }}</span>
          <span class="t-eyebrow text-ink-45">{{ sizeMb(proposal.attachment.size_bytes) }} MB</span>
        </span>
        <span class="t-label text-ink rounded-control border border-rule-strong px-3.5 py-2 flex-none">Open</span>
      </a>

      <!-- app-screens.html:339 renders this divider header as the mono
           eyebrow treatment with a bottom rule (matching every other
           sub-section header in the design system), not a serif t-title —
           the brief's snippet used t-title. -->
      <h2 class="t-eyebrow text-ink-70 mt-14 pb-3 border-b border-rule">Reviews · {{ proposal.reviews_count }}</h2>
      <!-- Nuxt prefixes nested-directory components with the folder name
           unless the filename already starts with it (why ProposalCard and
           ProposalFilters need no prefix but these two do) — verified live:
           the bare `<ReviewList>` tag from the brief's snippet failed to
           resolve at all and rendered nothing. -->
      <ProposalReviewList v-if="proposal.reviews.length" class="mt-6" :reviews="proposal.reviews" :max-rating="proposal.max_rating" />
      <p v-else class="t-body text-ink-45 mt-4">No reviews yet.</p>
    </div>

    <aside class="flex flex-col gap-5">
      <!-- app-screens.html:377-408 — the review form sits above Aggregate,
           not below it as the brief's snippet had them. -->
      <ProposalReviewForm
        v-if="proposal.can.review"
        :proposal-id="proposal.id" :max-rating="proposal.max_rating" :existing="proposal.my_review"
        @saved="load"
      />

      <UiCard>
        <p class="t-eyebrow text-ink-45 mb-4">Aggregate</p>
        <!-- app-screens.html:396-398 — the number and "from N reviews" sit
             on one baseline-aligned row, not stacked as two separate lines.
             44px serif is a hero stat, not body copy, so it gets an
             arbitrary-value utility (not a raw style attribute — the one
             thing the brief's own snippet used that nothing else in this
             app does) rather than an eighth named type style. -->
        <div class="flex items-baseline gap-2.5">
          <span class="font-display text-ink text-[44px] leading-none">
            {{ proposal.average_rating !== null ? proposal.average_rating.toFixed(1) : '—' }}
          </span>
          <span class="t-body text-ink-45">
            {{ proposal.reviews_count ? `from ${proposal.reviews_count} reviews` : 'no reviews yet' }}
          </span>
        </div>
      </UiCard>
    </aside>
  </div>
</template>
