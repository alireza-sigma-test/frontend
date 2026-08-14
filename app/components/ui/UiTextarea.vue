<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: string; label: string; required?: boolean; help?: string
  error?: string; maxlength?: number; counter?: boolean; rows?: number
}>(), { required: false, counter: false, rows: 8 })

defineEmits<{ 'update:modelValue': [string] }>()
const id = useId()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex items-baseline justify-between">
      <label :for="id" class="t-label text-ink">
        {{ label }}<span v-if="required" class="text-terracotta"> *</span>
      </label>
      <span v-if="counter && maxlength" class="t-eyebrow text-ink-45">{{ modelValue.length }} / {{ maxlength }}</span>
    </div>
    <textarea
      :id="id" :value="modelValue" :rows="rows" :maxlength="maxlength" :aria-invalid="!!error"
      class="rounded-control bg-sunken border px-3 py-2 t-body text-ink"
      :class="error ? 'border-rejected-br' : 'border-rule'"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <p v-if="error" class="t-label text-rejected-fg">{{ error }}</p>
    <p v-else-if="help" class="t-label text-ink-45">{{ help }}</p>
  </div>
</template>
