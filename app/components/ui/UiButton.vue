<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit'
  disabled?: boolean
}>(), { variant: 'primary', size: 'md', type: 'button', disabled: false })

const variants = {
  primary:   'bg-terracotta text-white hover:bg-terracotta-dark',
  secondary: 'bg-card text-ink border border-rule hover:bg-sunken',
  ghost:     'bg-transparent text-ink-70 hover:text-ink',
  danger:    'bg-rejected-bg text-rejected-fg border border-rejected-br hover:bg-rejected-br',
}
const sizes = { sm: 'h-[30px] px-3', md: 'h-[38px] px-4', lg: 'h-12 px-6' }
</script>

<template>
  <button
    :type="type" :disabled="disabled"
    class="t-label rounded-control inline-flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed disabled:opacity-45"
    :class="[variants[variant], sizes[size]]"
  >
    <slot />
  </button>
</template>
