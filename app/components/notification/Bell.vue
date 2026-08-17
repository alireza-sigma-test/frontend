<script setup lang="ts">
const store = useNotificationsStore()
const { push } = useToast()

const open = ref(false)
const root = ref<HTMLElement>()
const trigger = ref<HTMLButtonElement>()
const buttonId = useId()

// Fetched, then nudged by events — never derived from the socket, so the badge is
// still right with Reverb down.
onMounted(() => store.fetch())

// Reuses the app's toast rather than adding a second notification surface. No "Read
// it" link: a toast must never hold the only copy of an action, and the bell beside it
// holds the same item permanently.
useRealtime(myChannels(), {
  'proposal.created': e => announce(`${e.actor.name} submitted “${e.proposal.title}”`),
  'proposal.updated': e => announce(`${e.actor.name} updated “${e.proposal.title}”`),
  'proposal.status_changed': e => announce(`“${e.proposal.title}” was ${e.proposal.status}`),
  'review.created': e => announce(`${e.actor.name} reviewed “${e.proposal.title}”`),
})

function announce(message: string) {
  store.noteIncoming()
  push(message)
}

function toggle() {
  open.value = !open.value
  if (open.value) store.fetch()
}

function close(restoreFocus = true) {
  if (!open.value) return
  open.value = false
  // Back to the control that opened the panel, unless it is closing *because* focus
  // went somewhere deliberate.
  if (restoreFocus) nextTick(() => trigger.value?.focus())
}

// The panel's own job because it is not a <dialog>: a native one would trap focus
// behind a backdrop, making a header dropdown a modal pretending to be a menu.
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

function onPointerDown(event: PointerEvent) {
  if (open.value && root.value && !root.value.contains(event.target as Node)) close(false)
}

onMounted(() => document.addEventListener('pointerdown', onPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown))

// Tabbing past the last control closes the panel rather than stranding focus — the
// non-modal equivalent of a focus trap, so Tab moves on through the page.
function onFocusOut(event: FocusEvent) {
  const next = event.relatedTarget as Node | null
  if (open.value && next && root.value && !root.value.contains(next)) close(false)
}
</script>

<template>
  <div ref="root" class="relative" @keydown="onKeydown" @focusout="onFocusOut">
    <button
      :id="buttonId"
      ref="trigger"
      type="button"
      :aria-expanded="open"
      :aria-label="store.unreadCount > 0
        ? `Notifications, ${store.unreadCount} unread`
        : 'Notifications, none unread'"
      class="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-control border border-rule-strong bg-card
             t-label text-ink hover:border-ink
             transition-colors duration-[var(--duration-instant)] ease-out-soft"
      @click="toggle"
    >
      <!-- The word plus avatar and "Sign out" wraps the header to three lines at
           375px, so below `md` the label collapses to a glyph. The aria-label carries
           the accessible name either way. Inline SVG — two glyphs in the whole app is
           not worth an icon dependency. -->
      <svg
        class="md:hidden w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      <span class="hidden md:inline">Notifications</span>
      <!-- aria-hidden because the button's own label already says the number in
           words; a bare "3" after "Notifications" says nothing. -->
      <span
        v-if="store.unreadCount > 0"
        aria-hidden="true"
        class="min-w-[18px] h-[18px] px-[5px] rounded-badge bg-terracotta text-paper
               font-mono text-[10px] grid place-items-center"
      >{{ store.unreadCount }}</span>
    </button>

    <NotificationPanel v-if="open" :labelled-by="buttonId" @close="close(false)" />
  </div>
</template>
