<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit'
  disabled?: boolean
  // When set, renders a NuxtLink instead of a <button>. A <button> nested
  // inside an <a> (the previous call-site pattern: <NuxtLink><UiButton/></NuxtLink>)
  // is invalid HTML — two interactive elements, one nested in the other —
  // so the primitive itself now owns the choice of root element.
  to?: string
}>(), { variant: 'primary', size: 'md', type: 'button', disabled: false })

// Matched to the design system's Components section. Note `danger`: destructive
// actions are OUTLINED at rest and fill only on hover — the design calls this
// out explicitly. Filling at rest reads as the action having already happened.
const variants = {
  primary:   'bg-terracotta text-white hover:bg-terracotta-dark',
  secondary: 'bg-card text-ink border border-rule-strong hover:border-ink',
  ghost:     'bg-transparent text-ink-70 hover:bg-sunken hover:text-ink',
  danger:    'bg-card text-rejected-fg border border-rejected-br hover:bg-rejected-bg',
}
const sizes = { sm: 'h-[30px] px-3.5', md: 'h-[38px] px-5', lg: 'h-12 px-[26px]' }
</script>

<template>
  <NuxtLink
    v-if="to" :to="to" :aria-disabled="disabled || undefined"
    class="t-label rounded-control inline-flex items-center justify-center gap-2 transition-colors"
    :class="[variants[variant], sizes[size], disabled ? 'pointer-events-none !bg-sunken !text-ink-45 !border-rule cursor-not-allowed' : '']"
  >
    <slot />
  </NuxtLink>
  <button
    v-else
    :type="type" :disabled="disabled"
    class="t-label rounded-control inline-flex items-center justify-center gap-2 transition-colors
           disabled:cursor-not-allowed disabled:!bg-sunken disabled:!text-ink-45 disabled:!border-rule"
    :class="[variants[variant], sizes[size]]"
  >
    <slot />
  </button>
</template>
