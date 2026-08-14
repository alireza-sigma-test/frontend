<script setup lang="ts">
const props = defineProps<{ open: boolean; title: string; body?: string }>()
const emit = defineEmits<{ close: [] }>()
const el = ref<HTMLDialogElement>()

watch(() => props.open, (open) => {
  if (open) el.value?.showModal()
  else el.value?.close()
})
</script>

<template>
  <dialog
    ref="el"
    class="rounded-card border border-rule bg-card p-6 max-w-[34rem] w-full shadow-lifted backdrop:bg-ink/30"
    @close="emit('close')" @cancel.prevent="emit('close')"
  >
    <p class="t-title text-ink">{{ title }}</p>
    <p v-if="body" class="t-body text-ink-70 mt-2">{{ body }}</p>
    <div class="mt-5"><slot /></div>
    <div class="mt-6 flex justify-end gap-2"><slot name="actions" /></div>
  </dialog>
</template>
