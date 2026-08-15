<script setup lang="ts">
import type { Review } from '~/types/api'
defineProps<{ reviews: Review[]; maxRating: number }>()
</script>

<template>
  <!-- app-screens.html:340-374 — reviews are separated by vertical space only
       (28px, gap-7), no rule between them; a per-row border/pb (an earlier
       draft's guess) isn't in the design. Each row is a 34px avatar column
       plus a content column (grid, not a flat flex stack) so the comment
       indents under the name whether or not an avatar rendered — flattening
       it would leave the redacted rows (no avatar) with their comment
       starting under empty space instead of aligned with the other text. -->
  <div class="flex flex-col gap-7">
    <div v-for="r in reviews" :key="r.id" class="grid grid-cols-[34px_1fr] gap-4">
      <UiAvatar v-if="r.reviewer" :initials="r.reviewer.initials" />
      <!-- Owning speaker's view: identity and score are withheld by the API
           itself (ProposalResource redacts the whole entry down to
           {id, comment, created_at}) — no avatar, no placeholder for one. -->
      <span v-else />

      <div>
        <div class="flex items-center gap-3">
          <span v-if="r.reviewer" class="t-label text-ink">{{ r.reviewer.name }}</span>
          <span v-else class="t-label text-ink-45">A reviewer</span>

          <!-- Unfilled portion uses `rule-mid` (#D9D3CA), not `rule`
               (#E5E1DA) — the design's dedicated star-off colour
               (app-screens.html:346/368), matching UiRatingInput. -->
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
