<script setup lang="ts">
const { stats, load } = usePublicStats()
onMounted(load)
</script>

<template>
  <div class="min-h-screen grid lg:grid-cols-2">
    <aside class="hidden lg:flex flex-col justify-between bg-sunken px-[72px] py-16 border-r border-rule">
      <div class="flex items-center gap-3">
        <span class="w-2.5 h-2.5 rounded-full bg-terracotta" aria-hidden="true" />
        <p class="t-eyebrow text-ink-70">Proposal Review</p>
      </div>

      <div>
        <h1 class="t-display text-ink">Good talks start as rough ideas.</h1>
        <p class="t-lead text-ink-70 mt-5 max-w-[46ch]">
          Submit a proposal, get read by real reviewers, and see exactly where it stands.
        </p>
      </div>

      <div v-if="stats" class="flex gap-10">
        <div>
          <p class="t-title text-ink">{{ stats.proposals_this_year }}</p>
          <p class="t-label text-ink-45 mt-0.5">proposals this year</p>
        </div>
        <div>
          <p class="t-title text-ink">{{ stats.reviewers }}</p>
          <p class="t-label text-ink-45 mt-0.5">reviewers reading</p>
        </div>
      </div>
    </aside>

    <main class="flex items-center justify-center px-6 py-12">
      <div class="w-full max-w-[26rem]">
        <!-- The aside above carries the brand mark from `lg` up; it's hidden
             below that breakpoint, so restate it here or the page ships with
             no product identity at all on mobile. -->
        <div class="flex items-center gap-3 mb-8 lg:hidden">
          <span class="w-2.5 h-2.5 rounded-full bg-terracotta" aria-hidden="true" />
          <p class="t-eyebrow text-ink-70">Proposal Review</p>
        </div>
        <slot />
      </div>
    </main>
  </div>
</template>
