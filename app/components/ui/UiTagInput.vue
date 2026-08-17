<script setup lang="ts">
import type { Tag } from '~/types/api'

// Mirrors the API's own `tags` max:10. Not just polish: nothing on the consuming page
// has a slot for a whole-array `tags` error, so overflowing would be unrenderable.
const MAX_TAGS = 10

const props = defineProps<{ modelValue: (number | string)[]; suggestions: Tag[] }>()
const emit = defineEmits<{ 'update:modelValue': [(number | string)[]] }>()

const query = ref('')

const selectedLabels = computed(() => props.modelValue.map((v) => {
  const found = typeof v === 'number' ? props.suggestions.find(t => t.id === v) : undefined
  return { value: v, label: found?.name ?? String(v) }
}))

const atMax = computed(() => props.modelValue.length >= MAX_TAGS)

const matches = computed(() => {
  if (atMax.value) return []
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return props.suggestions
    .filter(t => t.name.toLowerCase().includes(q) && !props.modelValue.includes(t.id))
    .slice(0, 6)
})

// Only when nothing existing or already chosen matches, case-insensitively, so
// "Testing" then "testing" cannot emit two near-identical new tags.
const canCreate = computed(() => {
  if (atMax.value) return false
  const q = query.value.trim()
  const qLower = q.toLowerCase()
  return q.length > 0 && q.length <= 40
    && !props.suggestions.some(t => t.name.toLowerCase() === qLower)
    && !selectedLabels.value.some(t => t.label.toLowerCase() === qLower)
})

function add(value: number | string) {
  if (atMax.value) return
  // Case-insensitive for new names; ids compare as-is.
  const alreadyChosen = typeof value === 'string'
    ? selectedLabels.value.some(t => t.label.toLowerCase() === value.toLowerCase())
    : props.modelValue.includes(value)
  if (!alreadyChosen) emit('update:modelValue', [...props.modelValue, value])
  query.value = ''
}
function remove(value: number | string) {
  emit('update:modelValue', props.modelValue.filter(v => v !== value))
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex items-baseline justify-between">
      <label class="t-label text-ink">Tags <span class="text-ink-45">optional</span></label>
      <!-- Visible before the cap is hit, not just on rejection at 11. -->
      <span class="t-eyebrow" :class="atMax ? 'text-terracotta' : 'text-ink-45'">{{ modelValue.length }} / {{ MAX_TAGS }}</span>
    </div>

    <!-- An interactive control, so border-rule-strong rather than the structural
         border-rule, and bg-card rather than the sunken tone other inputs use. -->
    <div class="rounded-control border border-rule-strong bg-card p-2 flex flex-wrap gap-1.5">
      <span
        v-for="t in selectedLabels" :key="String(t.value)"
        class="rounded-badge bg-accent-tint text-accent-tint-fg px-2 py-1 t-label inline-flex items-center gap-1.5"
      >
        {{ t.label }}
        <button
          type="button"
          class="text-accent-tint-fg/65 hover:text-accent-tint-fg transition-colors duration-[var(--duration-instant)] ease-out-soft"
          :aria-label="`Remove ${t.label}`" @click="remove(t.value)"
        >✕</button>
      </span>

      <input
        v-model="query" :disabled="atMax"
        :placeholder="atMax ? 'Maximum reached — remove one to add another' : 'Type to search or create…'"
        class="flex-1 min-w-[12rem] bg-transparent t-body text-ink placeholder:text-ink-45 outline-none px-1 disabled:cursor-not-allowed"
        @keydown.enter.prevent="canCreate && add(query.trim())"
      >
    </div>

    <div v-if="matches.length || canCreate" class="flex flex-wrap gap-1.5">
      <button
        v-for="t in matches" :key="t.id" type="button"
        class="rounded-badge border border-rule bg-card px-2 py-0.5 t-label text-ink-70 hover:text-ink hover:border-ink
               transition-colors duration-[var(--duration-instant)] ease-out-soft"
        @click="add(t.id)"
      >
        {{ t.name }}
      </button>
      <button v-if="canCreate" type="button" class="rounded-badge border border-dashed border-rule-dashed bg-card px-2 py-0.5 t-label text-terracotta" @click="add(query.trim())">
        + Create “{{ query.trim() }}”
      </button>
    </div>
  </div>
</template>
