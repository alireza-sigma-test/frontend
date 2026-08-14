<script setup lang="ts">
defineProps<{ modelValue: File | null }>()
const emit = defineEmits<{ 'update:modelValue': [File | null] }>()

const MAX_BYTES = 4 * 1024 * 1024
const error = ref('')
const dragging = ref(false)

function accept(file: File | undefined) {
  error.value = ''
  if (!file) return
  if (file.type !== 'application/pdf') { error.value = 'PDF only.'; return }
  if (file.size > MAX_BYTES) { error.value = 'That file is over 4 MB.'; return }
  emit('update:modelValue', file)
}

const mb = (b: number) => (b / 1024 / 1024).toFixed(1)
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label class="t-label text-ink">Slides or outline <span class="text-ink-45">optional</span></label>

    <!-- Dropzone is an interactive control (click/drop target) -> border-rule-strong,
         and the design system renders it at the card radius (6px), not the control
         radius (4px) other inputs use. -->
    <div
      v-if="!modelValue"
      class="rounded-card border border-dashed p-6 text-center transition-colors"
      :class="dragging ? 'border-terracotta bg-card' : 'border-rule-strong bg-sunken'"
      @dragover.prevent="dragging = true" @dragleave="dragging = false"
      @drop.prevent="dragging = false; accept($event.dataTransfer?.files[0])"
    >
      <p class="t-body text-ink-70">
        Drop a PDF here or
        <label class="text-terracotta font-medium cursor-pointer">
          browse
          <input type="file" accept="application/pdf" class="sr-only" @change="accept(($event.target as HTMLInputElement).files?.[0])">
        </label>
      </p>
      <p class="t-eyebrow text-ink-45 mt-1">application/pdf · 4096 KB</p>
    </div>

    <div v-else class="rounded-control border border-rule bg-card p-3 flex items-center gap-3">
      <!-- The design system renders the "PDF" chip with the same fg/bg/border
           triplet as its rejected-status badge (#8E2E29/#FAEDEC/#E8CFCD) -
           an exact match to the rejected-* tokens, reused here for a file-type
           chip rather than a status. -->
      <span class="rounded-badge border border-rejected-br bg-rejected-bg text-rejected-fg t-eyebrow px-1.5 py-1">PDF</span>
      <span class="t-body text-ink flex-1 truncate">{{ modelValue.name }}</span>
      <span class="t-eyebrow text-ink-45">{{ mb(modelValue.size) }} MB of 4 MB</span>
      <button type="button" class="text-ink-45 hover:text-ink" aria-label="Remove file" @click="emit('update:modelValue', null)">✕</button>
    </div>

    <p v-if="error" class="t-label text-rejected-fg">{{ error }}</p>
    <p v-else class="t-label text-ink-45">PDF only, 4 MB maximum. Validated here and again by the API.</p>
  </div>
</template>
