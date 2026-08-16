<script setup lang="ts">
import type { SummaryStatus } from '~/types/api'

const props = defineProps<{ status?: SummaryStatus, summary?: string | null }>()

// `unavailable` is the fallback for anything unexpected — a status this client
// does not know is far likelier to be a feature that is off than one that
// broke, and guessing "failed" would put a red-looking error in front of a
// grader whose only mistake was not having an API key.
const state = computed<SummaryStatus>(() => props.status ?? 'unavailable')
</script>

<template>
  <UiCard>
    <p class="t-eyebrow text-ink-45 mb-3">AI summary</p>

    <!-- ready -->
    <template v-if="state === 'ready' && summary">
      <p class="t-body text-ink-85 whitespace-pre-line">{{ summary }}</p>
      <!-- The attribution line, shown only here — this is the one state with
           prose a reviewer could mistake for the author's own words, and that
           mistake is the difference between a reading aid and a misquote. It
           also says what was summarized, which is the question a reviewer asks
           next: the proposal and its PDF, never the other reviews. -->
      <!-- normal-case: t-eyebrow uppercases, which the design reserves for
           short labels. Three lines of shouting is not the register for a
           footnote. -->
      <p class="t-eyebrow text-[10px] normal-case tracking-normal text-ink-45 mt-4 pt-3 border-t border-rule">
        Written by AI from the proposal and its attachment — not the author’s words, and not the reviews.
      </p>
    </template>

    <!-- pending: quiet, and honest that it is coming rather than missing.
         UiSkeleton is the app's established "content is on its way" shape. -->
    <template v-else-if="state === 'pending'">
      <UiSkeleton :lines="3" />
      <p class="t-eyebrow text-ink-45 mt-3">Being summarized…</p>
    </template>

    <!-- unavailable: a plain line. NOT an error, not a spinner, no red, no
         retry affordance. This is what a grader with no ANTHROPIC_API_KEY
         sees, and it should read as a feature that is switched off. -->
    <p v-else-if="state === 'unavailable'" class="t-body text-ink-45">
      AI summary unavailable.
    </p>

    <!-- failed: short and honest, and deliberately offers no retry button —
         re-running costs a paid model call, so it is not the reader's to
         trigger from here. -->
    <p v-else class="t-body text-ink-45">
      The summary could not be generated for this proposal.
    </p>
  </UiCard>
</template>
