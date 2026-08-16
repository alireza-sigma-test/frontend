<script setup lang="ts">defineProps<{ title: string; body: string }>()</script>
<template>
  <!-- Card + 38px icon square are owned here, not hand-rebuilt at every
       call site — design-system.html:404-438 defines the empty/error state
       as one component each, icon square included. The neutral square uses
       `rule-mid` with no fill, matching the design's off/inactive tone;
       UiErrorState's square is tinted differently on purpose (see there).
       Icon is a hand-drawn inline SVG — no icon library, not worth a
       dependency for two glyphs; `currentColor` + `text-ink-45` on the
       wrapper keep it in the same muted register as the border. -->
  <div class="bg-card border border-rule rounded-card px-8 text-center py-16">
    <div class="w-[38px] h-[38px] rounded-control border border-rule-mid text-ink-45 flex items-center justify-center mx-auto mb-[18px]" aria-hidden="true">
      <!-- No <title>, and focusable="false" keeps it out of the tab order in
           engines that focus inline SVG by default; the wrapper's
           aria-hidden is what actually removes it from the a11y tree. -->
      <svg class="w-[19px] h-[19px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" focusable="false">
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
    </div>
    <p class="t-title text-ink">{{ title }}</p>
    <p class="t-body text-ink-45 mt-2 mx-auto max-w-[46ch]">{{ body }}</p>
    <div class="mt-6"><slot /></div>
  </div>
</template>
