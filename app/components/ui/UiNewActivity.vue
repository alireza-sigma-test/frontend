<script setup lang="ts">
const props = defineProps<{ count: number, noun?: string }>()
defineEmits<{ refresh: [] }>()

const label = computed(() => {
  const noun = props.noun ?? 'update'
  return `${props.count} new ${noun}${props.count === 1 ? '' : 's'}`
})
</script>

<template>
  <!-- The offer, not the update: nothing below this bar moves until the reader asks,
       because the list is filtered and sorted server-side and rows moving under
       someone's cursor is worse than no live update at all.

       The bar does shift the page by its own height once, at the top, where a reader
       is looking at chrome rather than mid-sentence — and scroll anchoring holds the
       position of anyone scrolled further down. Taking it out of flow would have it
       cover content instead.

       aria-live="polite", never "assertive", and the count is in the text rather than
       only in the accent colour. -->
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
