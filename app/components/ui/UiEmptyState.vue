<script setup lang="ts">defineProps<{ title: string; body: string }>()</script>
<template>
  <div class="text-center py-16">
    <p class="t-title text-ink">{{ title }}</p>
    <p class="t-body text-ink-45 mt-2 mx-auto max-w-[46ch]">{{ body }}</p>
    <div class="mt-6"><slot /></div>
  </div>
</template>
