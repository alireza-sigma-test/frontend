<script setup lang="ts">
const props = defineProps<{ currentPage: number; lastPage: number }>()
defineEmits<{ change: [number] }>()
</script>
<template>
  <nav v-if="lastPage > 1" class="flex items-center gap-1" aria-label="Pagination">
    <button class="t-label px-2 py-1 text-ink-70 disabled:opacity-40" :disabled="currentPage === 1" @click="$emit('change', currentPage - 1)">‹</button>
    <button
      v-for="p in lastPage" :key="p"
      class="t-label px-2.5 py-1 rounded-control" :aria-current="p === currentPage ? 'page' : undefined"
      :class="p === currentPage ? 'bg-ink text-white' : 'text-ink-70 hover:bg-sunken'"
      @click="$emit('change', p)"
    >{{ p }}</button>
    <button class="t-label px-2 py-1 text-ink-70 disabled:opacity-40" :disabled="currentPage === lastPage" @click="$emit('change', currentPage + 1)">›</button>
  </nav>
</template>
