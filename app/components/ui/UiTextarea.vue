<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: string; label: string; required?: boolean; help?: string
  error?: string; maxlength?: number; rows?: number
}>(), { required: false, rows: 8 })

defineEmits<{ 'update:modelValue': [string] }>()
const id = useId()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="t-label text-ink">
      {{ label }}<span v-if="required" class="text-terracotta"> *</span>
    </label>
    <textarea
      :id="id" :value="modelValue" :rows="rows" :maxlength="maxlength" :aria-invalid="!!error"
      :aria-describedby="error ? `${id}-err` : undefined"
      class="rounded-control bg-sunken border px-3 py-2 t-body text-ink"
      :class="error ? 'border-error-border' : 'border-rule-strong'"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <p v-if="error" :id="`${id}-err`" class="t-label text-rejected-fg">{{ error }}</p>
    <p v-else-if="help" class="t-label text-ink-45">{{ help }}</p>
  </div>
</template>
