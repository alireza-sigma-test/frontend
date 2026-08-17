<script setup lang="ts">
const { toasts, dismiss } = useToast()
</script>
<template>
  <!-- The live region is the <TransitionGroup>'s own `tag="div"`, mounted for the life
       of the app, so a toast is a child insertion and the announcement is immediate.
       The entry animation uses opacity rather than visibility or v-if, so nothing here
       delays what a screen reader says. -->
  <TransitionGroup
    tag="div" class="fixed bottom-6 right-6 z-50 flex flex-col gap-2" role="status" aria-live="polite"
    enter-active-class="transition-[opacity,translate] duration-[var(--duration-moderate)] ease-in-out-soft"
    enter-from-class="opacity-0 translate-y-1.5"
    leave-active-class="transition-opacity duration-[var(--duration-quick)] ease-in-out-soft"
    leave-to-class="opacity-0"
  >
    <div
      v-for="t in toasts" :key="t.id"
      class="rounded-card border bg-card px-4 py-3 shadow-lifted max-w-[24rem]"
      :class="t.tone === 'error' ? 'border-rejected-br' : 'border-rule'"
    >
      <p class="t-body" :class="t.tone === 'error' ? 'text-rejected-fg' : 'text-ink'">{{ t.message }}</p>
      <button
        class="t-eyebrow text-ink-45 mt-1 hover:text-ink transition-colors duration-[var(--duration-instant)] ease-out-soft"
        @click="dismiss(t.id)"
      >Dismiss</button>
    </div>
  </TransitionGroup>
</template>
