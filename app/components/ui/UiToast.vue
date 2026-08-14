<script setup lang="ts">
const { toasts, dismiss } = useToast()
</script>
<template>
  <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-2" role="status" aria-live="polite">
    <div
      v-for="t in toasts" :key="t.id"
      class="rounded-card border bg-card px-4 py-3 shadow-lifted max-w-[24rem]"
      :class="t.tone === 'error' ? 'border-rejected-br' : 'border-rule'"
    >
      <p class="t-body" :class="t.tone === 'error' ? 'text-rejected-fg' : 'text-ink'">{{ t.message }}</p>
      <button class="t-eyebrow text-ink-45 mt-1" @click="dismiss(t.id)">Dismiss</button>
    </div>
  </div>
</template>
