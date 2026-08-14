<script setup lang="ts">
import type { Tag } from '~/types/api'

const props = defineProps<{ modelValue: (number | string)[]; suggestions: Tag[] }>()
const emit = defineEmits<{ 'update:modelValue': [(number | string)[]] }>()

const query = ref('')

const selectedLabels = computed(() => props.modelValue.map((v) => {
  const found = typeof v === 'number' ? props.suggestions.find(t => t.id === v) : undefined
  return { value: v, label: found?.name ?? String(v) }
}))

const matches = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return props.suggestions
    .filter(t => t.name.toLowerCase().includes(q) && !props.modelValue.includes(t.id))
    .slice(0, 6)
})

// Offer creation only when nothing existing matches exactly.
const canCreate = computed(() => {
  const q = query.value.trim()
  return q.length > 0 && q.length <= 40
    && !props.suggestions.some(t => t.name.toLowerCase() === q.toLowerCase())
})

function add(value: number | string) {
  if (!props.modelValue.includes(value)) emit('update:modelValue', [...props.modelValue, value])
  query.value = ''
}
function remove(value: number | string) {
  emit('update:modelValue', props.modelValue.filter(v => v !== value))
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label class="t-label text-ink">Tags <span class="text-ink-45">optional</span></label>

    <!-- Interactive control -> border-rule-strong, not the structural border-rule.
         Background is bg-card: the design system's tag input renders on white,
         not the sunken tone other inputs use. -->
    <div class="rounded-control border border-rule-strong bg-card p-2 flex flex-wrap gap-1.5">
      <span
        v-for="t in selectedLabels" :key="String(t.value)"
        class="rounded-badge bg-accent-tint text-accent-tint-fg px-2 py-1 t-label inline-flex items-center gap-1.5"
      >
        {{ t.label }}
        <button type="button" class="text-accent-tint-fg/70 hover:text-accent-tint-fg" :aria-label="`Remove ${t.label}`" @click="remove(t.value)">✕</button>
      </span>

      <input
        v-model="query" placeholder="Type to search or create…"
        class="flex-1 min-w-[12rem] bg-transparent t-body text-ink placeholder:text-ink-45 outline-none px-1"
        @keydown.enter.prevent="canCreate && add(query.trim())"
      >
    </div>

    <div v-if="matches.length || canCreate" class="flex flex-wrap gap-1.5">
      <button v-for="t in matches" :key="t.id" type="button" class="rounded-badge border border-rule bg-card px-2 py-0.5 t-label text-ink-70 hover:text-ink hover:border-ink" @click="add(t.id)">
        {{ t.name }}
      </button>
      <button v-if="canCreate" type="button" class="rounded-badge border border-dashed border-rule-strong bg-card px-2 py-0.5 t-label text-terracotta" @click="add(query.trim())">
        + Create “{{ query.trim() }}”
      </button>
    </div>
  </div>
</template>
