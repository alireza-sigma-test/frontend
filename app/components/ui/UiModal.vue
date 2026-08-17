<script setup lang="ts">
const props = defineProps<{ open: boolean; title: string; body?: string }>()
const emit = defineEmits<{ close: [] }>()
const el = ref<HTMLDialogElement>()
// Native <dialog> gives the focus trap, Escape and focus restoration but not a name.
const titleId = useId()

// `m-auto` below is load-bearing: the UA stylesheet centres a modal with
// `margin: auto`, and Tailwind's preflight reset beats it, pinning every modal to the
// top-left corner without the utility.
//
// The motion block is long because `display` and `overlay` are discrete — without
// `transition-discrete` and a `starting:` value there is nothing to interpolate from,
// and `overlay` is what holds the dialog in the top layer while it fades out.

watch(() => props.open, (open) => {
  if (open) el.value?.showModal()
  else el.value?.close()
})
</script>

<template>
  <dialog
    ref="el"
    :aria-labelledby="titleId"
    class="rounded-card border border-rule bg-card p-0 m-auto max-w-[34rem] w-full shadow-lifted overflow-hidden
           opacity-0 translate-y-1 open:opacity-100 open:translate-y-0 starting:open:opacity-0 starting:open:translate-y-1
           transition-[opacity,translate,display,overlay] transition-discrete duration-[var(--duration-moderate)] ease-in-out-soft
           backdrop:bg-ink/30 backdrop:opacity-0 open:backdrop:opacity-100 starting:open:backdrop:opacity-0
           backdrop:transition-[opacity,display,overlay] backdrop:transition-discrete
           backdrop:duration-[var(--duration-moderate)] backdrop:ease-in-out-soft"
    @close="emit('close')" @cancel.prevent="emit('close')"
  >
    <div class="p-6 pb-5">
      <p :id="titleId" class="t-title text-ink">{{ title }}</p>
      <p v-if="body" class="t-body text-ink-70 mt-2.5">{{ body }}</p>
      <div class="mt-4"><slot /></div>
    </div>
    <!-- The actions row sits on its own tinted band with a rule above it, not in the
         same padding block as the title and fields. -->
    <div class="flex justify-end gap-3 px-6 py-4 bg-paper border-t border-rule"><slot name="actions" /></div>
  </dialog>
</template>
