<script setup lang="ts">
defineProps<{ modelValue: File | null }>()
const emit = defineEmits<{ 'update:modelValue': [File | null] }>()

const MAX_BYTES = 4 * 1024 * 1024
const error = ref('')
const dragging = ref(false)
// A screen reader only announces a live region's text CHANGING, and only if
// the region already exists in the DOM beforehand — so this is a permanent,
// always-mounted node (never toggled with v-if), same pattern as screen 02's
// result announcer.
const announcement = ref('')

function accept(file: File | undefined) {
  error.value = ''
  if (!file) return
  if (file.type !== 'application/pdf') { error.value = 'PDF only.'; announcement.value = error.value; return }
  if (file.size > MAX_BYTES) { error.value = 'That file is over 4 MB.'; announcement.value = error.value; return }
  emit('update:modelValue', file)
  announcement.value = `${file.name} attached.`
}

function clear() {
  emit('update:modelValue', null)
  announcement.value = 'File removed.'
}

const mb = (b: number) => (b / 1024 / 1024).toFixed(1)
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label class="t-label text-ink">Slides or outline <span class="text-ink-45">optional</span></label>

    <!-- The dropzone renders at the card radius (6px), not the control
         radius (4px) other inputs use, and its resting dashed border is
         `rule-dashed` (#C9C3B9) — a distinct, darker neutral from both
         `rule` and `rule-strong`, exact to the design's dashed elements. -->
    <div
      v-if="!modelValue"
      class="rounded-card border border-dashed p-6 text-center transition-colors duration-[var(--duration-instant)] ease-out-soft"
      :class="dragging ? 'border-terracotta bg-card' : 'border-rule-dashed bg-sunken'"
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
      <!-- Dedicated file-* tokens (currently the same hexes the design
           reuses from its rejected-status badge), kept independent so a
           future rejected-* retint doesn't silently follow here. -->
      <span class="rounded-badge border border-file-br bg-file-bg text-file-fg t-eyebrow px-1.5 py-1">PDF</span>
      <span class="t-body text-ink flex-1 truncate">{{ modelValue.name }}</span>
      <span class="t-eyebrow text-ink-45">{{ mb(modelValue.size) }} MB of 4 MB</span>
      <button
        type="button" class="text-ink-45 hover:text-ink transition-colors duration-[var(--duration-instant)] ease-out-soft"
        aria-label="Remove file" @click="clear"
      >✕</button>
    </div>

    <p v-if="error" class="t-label text-rejected-fg">{{ error }}</p>
    <p v-else class="t-label text-ink-45">PDF only, 4 MB maximum. Validated here and again by the API.</p>

    <p aria-live="polite" class="sr-only">{{ announcement }}</p>
  </div>
</template>
