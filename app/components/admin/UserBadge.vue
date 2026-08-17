<script setup lang="ts">
// Structured like UiBadge but deliberately not built on it: its prop is typed
// `Status`, and neither a role nor a verification state is a proposal status.
withDefaults(defineProps<{
  label: string
  tone: 'accent' | 'neutral' | 'pending'
  // UiBadge's mark for a live state. A role is an attribute, not a state, so only
  // the verification badge carries one.
  dot?: boolean
}>(), { dot: false })

const tones = {
  // The accent tint avatars and tag chips already use — administrator.
  accent:  'bg-accent-tint text-accent-tint-fg border-accent-tint',
  neutral: 'bg-sunken text-ink-70 border-rule',
  pending: 'bg-pending-bg text-pending-fg border-pending-br',
}
</script>

<template>
  <span class="rounded-badge border px-2 py-0.5 t-label inline-flex items-center gap-1.5" :class="tones[tone]">
    <span v-if="dot" class="w-1.5 h-1.5 rounded-full bg-current opacity-60" aria-hidden="true" />
    {{ label }}
  </span>
</template>
