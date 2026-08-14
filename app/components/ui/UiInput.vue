<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string
  label: string
  type?: string
  required?: boolean
  help?: string
  error?: string
  maxlength?: number
  counter?: boolean
  placeholder?: string
}>(), { type: 'text', required: false, counter: false })

defineEmits<{ 'update:modelValue': [string] }>()
const id = useId()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex items-baseline justify-between">
      <label :for="id" class="t-label text-ink">
        {{ label }}<span v-if="required" class="text-terracotta"> *</span>
      </label>
      <span v-if="counter && maxlength" class="t-eyebrow text-ink-45">
        {{ modelValue.length }} / {{ maxlength }}
      </span>
    </div>

    <input
      :id="id" :type="type" :value="modelValue" :maxlength="maxlength" :placeholder="placeholder"
      :aria-invalid="!!error" :aria-describedby="error ? `${id}-err` : undefined"
      class="rounded-control bg-sunken border px-3 h-[38px] t-body text-ink placeholder:text-ink-45"
      :class="error ? 'border-error-border' : 'border-rule-strong'"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >

    <p v-if="error" :id="`${id}-err`" class="t-label text-rejected-fg">{{ error }}</p>
    <p v-else-if="help" class="t-label text-ink-45">{{ help }}</p>
  </div>
</template>
