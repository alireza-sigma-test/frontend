<script setup lang="ts">
const props = defineProps<{ count: number, noun?: string }>()
defineEmits<{ refresh: [] }>()

const label = computed(() => {
  const noun = props.noun ?? 'update'
  return `${props.count} new ${noun}${props.count === 1 ? '' : 's'}`
})
</script>

<template>
  <!-- The offer, not the update.

       A live event never rewrites a list the reader is looking at: the list is
       filtered and sorted server-side, so an inserted row can be one the
       filter excludes, in a position the server would not choose — and rows
       moving under someone's cursor is worse than no live update at all.
       Nothing below this bar moves until the reader asks.

       Stated honestly, this bar does shift the page by its own height when it
       first appears. Two things bound that, and neither is an accident: it
       appears once, at the very top, where a reader at the top of the page is
       looking at chrome rather than mid-sentence; and for a reader scrolled
       further down, the browser's own scroll anchoring holds their position
       when content is inserted above the viewport (`overflow-anchor` is left
       at its default `auto` — main.css never disables it). The alternative,
       taking it out of flow, would have it cover content instead of move it.

       aria-live="polite", not "assertive": arriving work is worth mentioning
       at the next pause and never worth interrupting someone mid-sentence.
       The count is in the text and not only in the accent colour. -->
  <div
    v-if="count > 0"
    aria-live="polite"
    class="flex items-center justify-between gap-4 mb-4 px-4 py-2.5
           rounded-card border border-rule bg-accent-tint text-accent-tint-fg"
  >
    <p class="t-label">{{ label }}</p>
    <UiButton variant="secondary" size="sm" @click="$emit('refresh')">Refresh</UiButton>
  </div>
</template>
