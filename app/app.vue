<script setup lang="ts">
// A fade with 4px of travel, `out-in` so the two pages never overlap — a
// cross-fade of two full pages at this density reads as a smear. Class props
// rather than a `name` + CSS block, so the durations keep the same
// `duration-[var(--duration-*)]` call-site form as everywhere else. Leave is
// `instant` and enter `quick`: the outgoing page has nothing left to say.
// `in-out-soft` per main.css — it is the easing for anything that both
// enters and exits.
//
// This does not fight the focus management on /proposals/[id],
// /admin/users or /admin/decisions: useResultAnnouncer skips the first
// loading→loaded transition, so a page's arrival never moves focus, and the
// reloads that do (a review save, a decision, a page change) happen inside
// an already-mounted page — no route change, no <Transition>.
const page = {
  mode: 'out-in' as const,
  enterActiveClass: 'transition-[opacity,translate] duration-[var(--duration-quick)] ease-in-out-soft',
  enterFromClass: 'opacity-0 translate-y-1',
  leaveActiveClass: 'transition-opacity duration-[var(--duration-instant)] ease-in-out-soft',
  leaveToClass: 'opacity-0',
}
</script>

<template>
  <div>
    <NuxtLayout><NuxtPage :transition="page" /></NuxtLayout>
    <UiToast />
  </div>
</template>
