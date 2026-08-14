<script setup lang="ts">
withDefaults(defineProps<{ initials: string; size?: 'sm' | 'md' }>(), { size: 'md' })
</script>
<template>
  <!-- Accent tint, not neutral: the design system renders avatar initials as
       #8F3A14 on #F3E3DA. -->
  <span
    class="inline-flex items-center justify-center rounded-full bg-accent-tint text-accent-tint-fg t-label"
    :class="size === 'sm' ? 'w-6 h-6 text-[11px]' : 'w-9 h-9'"
  >{{ initials }}</span>
</template>
