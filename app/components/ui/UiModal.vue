<script setup lang="ts">
const props = defineProps<{ open: boolean; title: string; body?: string }>()
const emit = defineEmits<{ close: [] }>()
const el = ref<HTMLDialogElement>()
// Native <dialog> gives us the focus trap, Escape and focus restoration, but
// not a name — without this the dialog is announced unlabelled.
const titleId = useId()

// `m-auto` in the class list below is load-bearing, not decoration: the UA
// stylesheet centres a modal dialog with `margin: auto` against `inset: 0`,
// and Tailwind's preflight resets `margin: 0` on every element, which beats
// it. Without the utility every modal in the app renders pinned to the
// top-left corner (measured: 0,0 on both this screen's callers).
//
// The motion block is long because `display` and `overlay` are discrete:
// without `transition-discrete` and a `starting:` entry value there is
// nothing to interpolate from and the dialog just pops. `overlay` is what
// holds it in the top layer while it fades out. Both confirmed supported in
// the browser under test (Chromium 151) rather than assumed. The close path
// is untouched — Escape still fires `cancel`, and native focus restoration
// happens on close(), not when the fade ends.

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
    <!-- design-system.html:388 — the actions row sits on its own tinted
         band with a rule above it, not in the same padding block as the
         title/body/fields. This primitive had zero consumers before this
         task, so the previous single-`p-6` version was never actually
         checked against the design's own canonical modal reference. -->
    <div class="flex justify-end gap-3 px-6 py-4 bg-paper border-t border-rule"><slot name="actions" /></div>
  </dialog>
</template>
