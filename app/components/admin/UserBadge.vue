<script setup lang="ts">
// Structured exactly like UiBadge, deliberately not built on it: UiBadge's
// prop is typed `Status` (pending | approved | rejected) and shared with
// three other screens, and neither a role nor a verification state is a
// proposal status. Widening it to carry both would make two unrelated things
// look like one type.
withDefaults(defineProps<{
  label: string
  tone: 'accent' | 'neutral' | 'pending'
  // The dot is UiBadge's mark for "this is a live state". A role is an
  // attribute of the account, not a state it's currently in, so only the
  // verification badge carries one.
  dot?: boolean
}>(), { dot: false })

const tones = {
  // The accent tint the avatars and tag chips already use — administrator.
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
