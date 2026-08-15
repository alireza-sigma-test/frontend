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
    class="rounded-card border border-rule bg-card p-0 max-w-[34rem] w-full shadow-lifted backdrop:bg-ink/30 overflow-hidden"
    @close="emit('close')" @cancel.prevent="emit('close')"
  >
    <div class="p-6 pb-5">
      <p class="t-title text-ink">{{ title }}</p>
      <p v-if="body" class="t-body text-ink-70 mt-2.5">{{ body }}</p>
      <div class="mt-4"><slot /></div>
    </div>
    <!-- design-system.html:388 — the actions row sits on its own tinted
         band with a rule above it, not in the same padding block as the
         title/body/fields. This primitive had zero consumers before this
         task, so the previous single-`p-6` version was never actually
         checked against the design's own canonical modal reference. -->
    <div class="flex justify-end gap-3 px-6 py-4 bg-paper border-t border-rule"><slot name="actions" /></div>
  </dialog>
</template>
