<script setup lang="ts">withDefaults(defineProps<{ lines?: number }>(), { lines: 3 })</script>
<template>
  <div class="space-y-3" role="status" aria-label="Loading">
    <!-- `skeleton-bar` (main.css) adds the sweep; its gradient, clip and keyframe are
         coupled, so they stay one class. -->
    <div v-for="n in lines" :key="n" class="h-4 rounded-control bg-sunken skeleton-bar" :style="{ width: `${100 - n * 7}%` }" />
  </div>
</template>
