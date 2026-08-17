<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'approve'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit'
  disabled?: boolean
  // When set, renders a NuxtLink instead of a <button>, so callers never nest a
  // button inside an anchor.
  to?: string
}>(), { variant: 'primary', size: 'md', type: 'button', disabled: false })

// `danger` is outlined at rest and fills only on hover: filling at rest reads as the
// action having already happened.
//
// `approve` is a fifth variant beyond the design's four, built from the same
// approved-fg/bg/br triple as the Approved badge and structured like `danger` — a
// token-for-token match, kept here rather than hand-styled inside StatusControl.
const variants = {
  primary:   'bg-terracotta text-white hover:bg-terracotta-dark',
  secondary: 'bg-card text-ink border border-rule-strong hover:border-ink',
  ghost:     'bg-transparent text-ink-70 hover:bg-sunken hover:text-ink',
  danger:    'bg-card text-rejected-fg border border-rejected-br hover:bg-rejected-bg',
  approve:   'bg-card text-approved-fg border border-approved-br hover:bg-approved-bg',
}
const sizes = { sm: 'h-[30px] px-3.5', md: 'h-[38px] px-5', lg: 'h-12 px-[26px]' }
</script>

<template>
  <NuxtLink
    v-if="to" :to="to" :aria-disabled="disabled || undefined"
    class="t-label rounded-control inline-flex items-center justify-center gap-2
           transition-colors duration-[var(--duration-instant)] ease-out-soft"
    :class="[variants[variant], sizes[size], disabled ? 'pointer-events-none !bg-sunken !text-ink-45 !border-rule cursor-not-allowed' : '']"
  >
    <slot />
  </NuxtLink>
  <button
    v-else
    :type="type" :disabled="disabled"
    class="t-label rounded-control inline-flex items-center justify-center gap-2
           transition-colors duration-[var(--duration-instant)] ease-out-soft
           disabled:cursor-not-allowed disabled:!bg-sunken disabled:!text-ink-45 disabled:!border-rule"
    :class="[variants[variant], sizes[size]]"
  >
    <slot />
  </button>
</template>
