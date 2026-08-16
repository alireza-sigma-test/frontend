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
  <!-- Layout and ARIA match design-system.html's own canonical
       `components/RatingInput.vue` reference (embedded in its x-dc script
       block, not the rendered mockup): `.rating` is
       `display:flex; align-items:center` — stars and readout side by
       side, not stacked — and each star is `role="radio"` with
       `:aria-checked`, inside a `role="radiogroup"` whose label is
       `Rating out of ${max}`. role=radiogroup + aria-pressed (this
       component's previous markup) is the toggle-button contract, not the
       radio contract, and assistive tech won't read it as single-select.
       The two-row split for max > 5 is this task's own requirement, not
       in the (single-row) reference, so it's nested one level inside the
       group rather than flattened.

       Outer gap is 14px (gap-3.5), not gap-3 (12px) — design-system.html:287
       and app-screens.html:381 both render the star row and the "n / max"
       readout with `gap: 14px`. Unfilled stars use the dedicated
       `rule-mid` token (#D9D3CA), not `rule` (#E5E1DA): the canonical
       `.rating__star` reference (design-system.html:669) and the mockup's
       own star spans (design-system.html:288, app-screens.html:346/368)
       all use #D9D3CA for the off state — a shade between `rule` and
       `rule-strong` that was never tokenised until now. -->
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
    <!-- The design system sets this readout in IBM Plex Mono at ink-70
         (#56514B), not the sans t-label/ink-45 other captions use. -->
    <p class="t-eyebrow text-ink-70">{{ modelValue || 0 }} / {{ max }}</p>
  </div>
</template>
