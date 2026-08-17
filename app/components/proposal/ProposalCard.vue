<script setup lang="ts">
import type { Proposal } from '~/types/api'
defineProps<{ proposal: Proposal }>()

// Relative-time formatting lives in ~/utils/time.ts, shared with screen 04.
</script>

<template>
  <!-- Content plus a status/rating rail, per screen 02's own card rather than the
       gallery's single-column one. Below `sm` the fixed 190px rail would crush the
       text column, so it stacks. -->
  <NuxtLink :to="`/proposals/${proposal.id}`" class="block">
    <UiCard class="grid grid-cols-1 sm:grid-cols-[1fr_190px] gap-4 sm:gap-8 hover:border-rule-dashed transition-colors duration-[var(--duration-instant)] ease-out-soft">
      <div class="min-w-0">
        <div class="flex items-center gap-3 mb-2.5">
          <span class="t-eyebrow text-ink-45">{{ proposal.ref }}</span>
          <span class="t-body text-ink-45">·</span>
          <span class="t-body text-ink-45">{{ relativeTime(proposal.created_at) }}</span>
        </div>

        <h3 class="t-title text-ink mb-2.5">{{ proposal.title }}</h3>
        <p class="t-body text-ink-70 mb-4 line-clamp-2">{{ proposal.description }}</p>

        <div class="flex items-center gap-4 flex-wrap">
          <div class="flex items-center gap-2.5">
            <UiAvatar :initials="proposal.author.initials" size="sm" />
            <span class="t-label text-ink-70">{{ proposal.author.name }}</span>
          </div>
          <div v-if="proposal.tags.length" class="flex gap-2 flex-wrap">
            <span
              v-for="t in proposal.tags" :key="t.id"
              class="rounded-badge bg-accent-tint text-accent-tint-fg px-2 py-1 t-label"
            >{{ t.name }}</span>
          </div>
          <span
            v-if="proposal.attachment"
            class="rounded-badge border border-file-br bg-file-bg text-file-fg t-eyebrow px-1.5 py-1"
          >PDF</span>
        </div>
      </div>

      <div class="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-4">
        <UiBadge :status="proposal.status" />
        <div class="text-right">
          <template v-if="proposal.average_rating !== null">
            <p class="t-title text-ink">{{ proposal.average_rating.toFixed(1) }}</p>
            <p class="t-label text-ink-45 mt-1">{{ proposal.reviews_count }} review{{ proposal.reviews_count === 1 ? '' : 's' }}</p>
          </template>
          <p v-else class="t-label text-ink-45">No reviews yet</p>
        </div>
      </div>
    </UiCard>
  </NuxtLink>
</template>
