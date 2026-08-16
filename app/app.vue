<script setup lang="ts">
// A short fade with 4px of travel on arrival; no slide, no scale, and
// deliberately nothing on the way out. `mode: 'out-in'` plus a leave
// duration holds the incoming page unmounted until the leave finishes,
// which pushes back its own onMounted fetch — measured at ~120ms added to
// every navigation, the leave duration exactly. Class props rather than a
// `name` + CSS block keep the durations in the same
// `duration-[var(--duration-*)]` call-site form as everywhere else.
const page = {
  enterActiveClass: 'transition-[opacity,translate] duration-[var(--duration-quick)] ease-in-out-soft',
  enterFromClass: 'opacity-0 translate-y-1',
}
</script>

<template>
  <div>
    <NuxtLayout><NuxtPage :transition="page" /></NuxtLayout>
    <UiToast />
  </div>
</template>
