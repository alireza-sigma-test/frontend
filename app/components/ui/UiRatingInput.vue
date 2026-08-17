<script setup lang="ts">
const props = defineProps<{ modelValue: number; max: number }>()
const emit = defineEmits<{ 'update:modelValue': [number] }>()

// An explicit tuple, because under noUncheckedIndexedAccess a number[][] would make
// row[0]/row[1] `number | undefined`.
const rows = computed<[number, number][]>(() => (props.max > 5 ? [[1, 5], [6, props.max]] : [[1, props.max]]))
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)
</script>

<template>
  <!-- Stars and readout side by side, each star a `role="radio"` with `:aria-checked`
       inside a `role="radiogroup"`. radiogroup + aria-pressed is the toggle-button
       contract, not the radio one, and assistive tech will not read it as
       single-select. The two-row split for max > 5 nests inside the group rather than
       flattening it.

       Unfilled stars use `rule-mid`, the design's dedicated star-off shade. -->
  <div class="flex items-center gap-3.5">
    <div class="flex flex-col gap-1" role="radiogroup" :aria-label="`Rating out of ${max}`">
      <div v-for="(row, i) in rows" :key="i" class="flex gap-1">
        <button
          v-for="n in range(row[0], row[1])" :key="n" type="button" role="radio"
          class="text-2xl leading-none transition-colors duration-[var(--duration-instant)] ease-out-soft"
          :class="n <= modelValue ? 'text-terracotta' : 'text-rule-mid hover:text-ink-45'"
          :aria-checked="n === modelValue" :aria-label="`${n} of ${max}`"
          @click="emit('update:modelValue', n)"
        >★</button>
      </div>
    </div>
    <!-- Mono at ink-70, not the sans t-label/ink-45 other captions use. -->
    <p class="t-eyebrow text-ink-70">{{ modelValue || 0 }} / {{ max }}</p>
  </div>
</template>
