<script setup lang="ts">
import type { AppNotification } from '~/types/api'

defineProps<{ labelledBy: string }>()
const emit = defineEmits<{ close: [] }>()

const store = useNotificationsStore()

async function open(n: AppNotification) {
  await store.markRead(n.id)
  emit('close')
  if (n.proposal_id) await navigateTo(`/proposals/${n.proposal_id}`)
}
</script>

<template>
  <!-- The panel is the aside from app-screens.html:509-527, rendered as an
       overlay under the bell rather than a third column: this app's header is
       a single 64px row on every screen, not the two-column shell the mockup
       draws, and carving a permanent 400px column out of every page for it
       would change every other screen to serve this one.

       role="menu" is deliberately NOT used. These rows are links to
       proposals, not menu commands, and the menu role commits to arrow-key
       navigation that a list of links does not have. The label comes from the
       bell that owns it. -->
  <div
    :aria-labelledby="labelledBy"
    role="group"
    class="absolute right-0 top-[calc(100%+8px)] z-40 w-[min(24rem,calc(100vw-2rem))]
           rounded-card border border-rule bg-card shadow-lifted p-5 text-left"
  >
    <div class="flex items-center justify-between mb-4">
      <span class="t-eyebrow text-ink-45">Notifications</span>
      <button
        v-if="store.unreadCount > 0"
        type="button"
        class="t-label text-accent-tint-fg hover:text-ink
               transition-colors duration-[var(--duration-instant)] ease-out-soft"
        @click="store.markAllRead()"
      >Mark all read</button>
    </div>

    <div v-if="store.loading && !store.items.length" class="px-1"><UiSkeleton :lines="5" /></div>

    <p v-else-if="store.error" class="t-body text-ink-70">{{ store.error }}</p>

    <!-- Not UiEmptyState: that primitive owns its own card and a 38px icon
         square, sized for a full-page empty state. Inside a 24rem panel it
         would be a card within a card. Same copy discipline, right scale. -->
    <p v-else-if="!store.items.length" class="t-body text-ink-45 py-6 text-center">
      Nothing yet. Submissions, reviews and decisions show up here.
    </p>

    <ul v-else class="flex flex-col gap-1 max-h-[60vh] overflow-y-auto -mx-1 px-1">
      <li v-for="n in store.items" :key="n.id">
        <button
          type="button"
          class="w-full grid grid-cols-[8px_1fr] gap-3.5 p-3.5 rounded-control text-left
                 hover:bg-paper transition-colors duration-[var(--duration-instant)] ease-out-soft"
          :class="n.read_at ? '' : 'bg-accent-tint/45'"
          @click="open(n)"
        >
          <!-- app-screens.html:528 — "Unread items keep a tinted background
               and a filled dot. Read items lose both — no strike-through, no
               fading text." The dot is decorative; the word "Unread" below
               is what actually reaches assistive tech, since neither a tint
               nor a colour is available to it. -->
          <span
            class="w-[7px] h-[7px] rounded-full mt-1.5"
            :class="n.read_at ? 'bg-rule-mid' : 'bg-terracotta'"
            aria-hidden="true"
          />
          <span>
            <span class="t-label text-ink block">
              <span v-if="!n.read_at" class="sr-only">Unread. </span>{{ n.title }}
            </span>
            <span class="t-body text-ink-70 block mt-1">{{ n.body }}</span>
            <span class="t-eyebrow text-ink-45 block mt-2">{{ relativeTime(n.created_at) }}</span>
          </span>
        </button>
      </li>
    </ul>

    <div class="mt-5 pt-4 border-t border-rule">
      <NuxtLink
        to="/activity"
        class="t-label text-ink-45 hover:text-ink transition-colors duration-[var(--duration-instant)] ease-out-soft"
        @click="emit('close')"
      >See all activity ›</NuxtLink>
    </div>
  </div>
</template>
