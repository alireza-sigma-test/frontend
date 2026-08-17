<script setup lang="ts">
// Enter only, nothing on the way out: `mode: 'out-in'` plus a leave duration holds the
// incoming page unmounted until the leave finishes, delaying its own fetch by exactly
// that duration.
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
