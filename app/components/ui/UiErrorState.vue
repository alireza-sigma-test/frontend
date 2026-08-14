<script setup lang="ts">
defineProps<{ title: string; body: string; requestId?: string }>()
defineEmits<{ retry: [] }>()
</script>
<template>
  <div class="text-center py-16">
    <p class="t-title text-ink">{{ title }}</p>
    <p class="t-body text-ink-45 mt-2 mx-auto max-w-[46ch]">{{ body }}</p>
    <UiButton variant="secondary" size="sm" class="mt-4" @click="$emit('retry')">Try again</UiButton>
    <p v-if="requestId" class="t-eyebrow text-ink-45 mt-3">request-id {{ requestId }}</p>
  </div>
</template>
