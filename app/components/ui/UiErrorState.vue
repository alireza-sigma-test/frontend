<script setup lang="ts">
defineProps<{ title: string; body: string }>()
defineEmits<{ retry: [] }>()
</script>
<template>
  <!-- Card + 38px icon square are owned here, not hand-rebuilt at every
       call site — design-system.html:404-438. The square is tinted
       (rejected-br border, rejected-bg fill, rejected-fg "!") rather than
       the neutral outline UiEmptyState uses, and the card border matches. -->
  <div class="bg-card border border-rejected-br rounded-card px-8 text-center py-16">
    <div class="w-[38px] h-[38px] rounded-control border border-rejected-br bg-rejected-bg text-rejected-fg t-label flex items-center justify-center mx-auto mb-[18px]" aria-hidden="true">!</div>
    <p class="t-title text-ink">{{ title }}</p>
    <p class="t-body text-ink-45 mt-2 mx-auto max-w-[46ch]">{{ body }}</p>
    <UiButton variant="secondary" size="sm" class="mt-4" @click="$emit('retry')">Try again</UiButton>
  </div>
</template>
