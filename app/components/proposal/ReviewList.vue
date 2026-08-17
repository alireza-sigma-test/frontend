<script setup lang="ts">
import type { Review } from '~/types/api'
defineProps<{ reviews: Review[]; maxRating: number }>()
</script>

<template>
  <!-- Separated by vertical space only, no rule between rows. Each row is an avatar
       column plus a content column, so the comment indents under the name whether or
       not an avatar rendered — flattening it would leave redacted rows misaligned. -->
  <div class="flex flex-col gap-7">
    <div v-for="r in reviews" :key="r.id" class="grid grid-cols-[34px_1fr] gap-4">
      <UiAvatar v-if="r.reviewer" :initials="r.reviewer.initials" />
      <!-- The owning speaker's view: the API itself redacts identity and score, so
           there is no avatar and no placeholder for one. -->
      <span v-else />

      <div>
        <div class="flex items-center gap-3">
          <span v-if="r.reviewer" class="t-label text-ink">{{ r.reviewer.name }}</span>
          <span v-else class="t-label text-ink-45">A reviewer</span>

          <!-- `rule-mid` is the design's dedicated star-off colour, matching
               UiRatingInput. -->
          <span v-if="r.rating !== undefined" class="t-label text-terracotta">
            {{ '★'.repeat(r.rating) }}<span class="text-rule-mid">{{ '★'.repeat(maxRating - r.rating) }}</span>
          </span>

          <span class="flex-1" />
          <span class="t-eyebrow text-ink-45">{{ relativeTime(r.created_at) }}</span>
        </div>
        <p v-if="r.comment" class="t-body text-ink-85 mt-2">{{ r.comment }}</p>
      </div>
    </div>
  </div>
</template>
