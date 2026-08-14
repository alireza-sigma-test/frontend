<script setup lang="ts">withDefaults(defineProps<{ lines?: number }>(), { lines: 3 })</script>
<template>
  <div class="space-y-3" role="status" aria-label="Loading">
    <div v-for="n in lines" :key="n" class="h-4 rounded-control bg-sunken" :style="{ width: `${100 - n * 7}%` }" />
  </div>
</template>
