<script setup lang="ts">
import type { SummaryStatus } from '~/types/api'

const props = defineProps<{ status?: SummaryStatus, summary?: string | null }>()

// `unavailable` is the fallback for anything unexpected: an unknown status is likelier
// to be a feature that is off than one that broke.
const state = computed<SummaryStatus>(() => props.status ?? 'unavailable')
</script>

<template>
  <UiCard>
    <p class="t-eyebrow text-ink-45 mb-3">AI summary</p>

    <!-- ready -->
    <template v-if="state === 'ready' && summary">
      <p class="t-body text-ink-85 whitespace-pre-line">{{ summary }}</p>
      <!-- Shown only here: this is the one state with prose a reviewer could mistake
           for the author's own words. It also says what was summarized.
           `normal-case` because t-eyebrow uppercases, which is not the register for a
           three-line footnote. -->
      <p class="t-eyebrow text-[10px] normal-case tracking-normal text-ink-45 mt-4 pt-3 border-t border-rule">
        Written by AI from the proposal and its attachment — not the author’s words, and not the reviews.
      </p>
    </template>

    <!-- pending: honest that it is coming rather than missing. -->
    <template v-else-if="state === 'pending'">
      <UiSkeleton :lines="3" />
      <p class="t-eyebrow text-ink-45 mt-3">Being summarized…</p>
    </template>

    <!-- unavailable: not an error, not a spinner, no retry. This is what a clone with
         no API key sees, and it must read as a feature switched off. -->
    <p v-else-if="state === 'unavailable'" class="t-body text-ink-45">
      AI summary unavailable.
    </p>

    <!-- failed: no retry button, because re-running costs a paid model call. -->
    <p v-else class="t-body text-ink-45">
      The summary could not be generated for this proposal.
    </p>
  </UiCard>
</template>
