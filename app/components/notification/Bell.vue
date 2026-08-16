<script setup lang="ts">
const store = useNotificationsStore()
const { push } = useToast()

const open = ref(false)
const root = ref<HTMLElement>()
const trigger = ref<HTMLButtonElement>()
const buttonId = useId()

// The count is FETCHED, then nudged by events — never derived from the socket.
// That ordering is the fallback the spec requires: with Reverb down the badge
// is still right, because it never depended on Reverb to begin with.
onMounted(() => store.fetch())

// Live: bump the badge and say so once. `push` is the app's existing toast, so
// this behaves like every other transient message rather than introducing a
// second notification surface. The mockup's toast carries a "Read it" link;
// this one does not — useToast has no action slot, and the design's own note
// says a toast must never hold the only copy of an action. The bell beside it
// holds the same item, permanently.
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
  // The app has already shipped one focus-restoration bug. Focus goes back to
  // the control that opened the panel, unless the panel is closing *because*
  // focus went somewhere deliberate (a deep link).
  if (restoreFocus) nextTick(() => trigger.value?.focus())
}

// Escape from anywhere inside, and a click outside. Both are the panel's own
// job because it is not a <dialog> — a native dialog would trap focus behind a
// backdrop, and a header dropdown that blocks the page behind it is a modal
// pretending to be a menu.
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

function onPointerDown(event: PointerEvent) {
  if (open.value && root.value && !root.value.contains(event.target as Node)) close(false)
}

onMounted(() => document.addEventListener('pointerdown', onPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown))

// Tabbing past the last control inside the panel closes it rather than
// stranding focus behind an invisible overlay — the non-modal equivalent of a
// focus trap, and the behaviour a header dropdown should have: Tab moves on
// through the page, it does not cycle forever inside a menu.
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
      <!-- app-screens.html:483 labels this button "Notifications" in words.
           At 375px that word plus the avatar and "Sign out" overflows the row
           and wraps the header to three lines (measured), so below `md` the
           label collapses to a bell glyph. The accessible name is the button's
           aria-label either way, so nothing is lost to assistive tech —
           only to sighted users on a viewport where the word did not fit.
           Hand-drawn inline SVG, same as UiEmptyState: two glyphs in the whole
           app is not worth an icon dependency. -->
      <svg
        class="md:hidden w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      <span class="hidden md:inline">Notifications</span>
      <!-- app-screens.html:483. The badge is a terracotta pill with the count
           inside it. aria-hidden because the button's own label already says
           the number in words — a bare "3" read out after "Notifications"
           says nothing about what three there are. -->
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
