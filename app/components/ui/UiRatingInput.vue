<script setup lang="ts">
const props = defineProps<{ modelValue: number; max: number }>()
const emit = defineEmits<{ 'update:modelValue': [number] }>()

// Explicit tuple type: with noUncheckedIndexedAccess on, indexing a plain
// number[][] would make row[0]/row[1] `number | undefined`. A fixed-length
// tuple keeps them `number`.
const rows = computed<[number, number][]>(() => (props.max > 5 ? [[1, 5], [6, props.max]] : [[1, props.max]]))
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex flex-col gap-1" role="radiogroup" aria-label="Rating">
      <div v-for="(row, i) in rows" :key="i" class="flex gap-1">
        <button
          v-for="n in range(row[0], row[1])" :key="n" type="button"
          class="text-2xl leading-none transition-colors"
          :class="n <= modelValue ? 'text-terracotta' : 'text-rule hover:text-ink-45'"
          :aria-label="`${n} of ${max}`" :aria-pressed="n === modelValue"
          @click="emit('update:modelValue', n)"
        >★</button>
      </div>
    </div>
    <!-- The design system sets this readout in IBM Plex Mono at ink-70
         (#56514B), not the sans t-label/ink-45 other captions use. -->
    <p class="t-eyebrow text-ink-70">{{ modelValue || 0 }} / {{ max }}</p>
  </div>
</template>
