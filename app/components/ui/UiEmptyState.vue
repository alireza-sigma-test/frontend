<script setup lang="ts">defineProps<{ title: string; body: string }>()</script>
<template>
  <!-- Card + 38px icon square are owned here, not hand-rebuilt at every
       call site — design-system.html:404-438 defines the empty/error state
       as one component each, icon square included. The neutral square uses
       `rule-mid` with no fill, matching the design's off/inactive tone;
       UiErrorState's square is tinted differently on purpose (see there). -->
  <div class="bg-card border border-rule rounded-card px-8 text-center py-16">
    <div class="w-[38px] h-[38px] rounded-control border border-rule-mid mx-auto mb-[18px]" aria-hidden="true" />
    <p class="t-title text-ink">{{ title }}</p>
    <p class="t-body text-ink-45 mt-2 mx-auto max-w-[46ch]">{{ body }}</p>
    <div class="mt-6"><slot /></div>
  </div>
</template>
