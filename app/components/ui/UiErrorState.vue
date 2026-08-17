<script setup lang="ts">
defineProps<{ title: string; body: string }>()
defineEmits<{ retry: [] }>()
</script>
<template>
  <!-- Card and icon square owned here rather than rebuilt per call site. The square
       is tinted rejected-* rather than the neutral outline UiEmptyState uses, and the
       card border matches. -->
  <div class="bg-card border border-rejected-br rounded-card px-8 text-center py-16">
    <div class="w-[38px] h-[38px] rounded-control border border-rejected-br bg-rejected-bg text-rejected-fg flex items-center justify-center mx-auto mb-[18px]" aria-hidden="true">
      <!-- focusable="false" keeps it out of the tab order in engines that focus
           inline SVG; the wrapper's aria-hidden removes it from the a11y tree. -->
      <svg class="w-[19px] h-[19px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" focusable="false">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    </div>
    <p class="t-title text-ink">{{ title }}</p>
    <p class="t-body text-ink-45 mt-2 mx-auto max-w-[46ch]">{{ body }}</p>
    <UiButton variant="secondary" size="sm" class="mt-4" @click="$emit('retry')">Try again</UiButton>
  </div>
</template>
