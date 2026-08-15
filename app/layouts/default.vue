<script setup lang="ts">
const auth = useAuthStore()

// Display-only Title Case — `auth.role` stays the lowercase Role literal
// other code compares against (isSpeaker/isReviewer/isAdmin, :roles metas).
const roleLabel = computed(() => (auth.role ? auth.role.charAt(0).toUpperCase() + auth.role.slice(1) : ''))
</script>

<template>
  <div class="min-h-screen bg-paper">
    <header class="border-b border-rule bg-card">
      <div class="max-w-[1440px] mx-auto px-8 h-16 flex items-center gap-6">
        <NuxtLink to="/proposals" class="flex items-center gap-2.5">
          <span class="w-[9px] h-[9px] rounded-full bg-terracotta" aria-hidden="true" />
          <span class="t-eyebrow text-[11px] text-ink">Proposal Review</span>
        </NuxtLink>
        <nav class="flex gap-4 flex-1">
          <NuxtLink to="/proposals" class="t-label text-ink-45 hover:text-ink">Proposals</NuxtLink>
          <NuxtLink v-if="auth.isSpeaker" to="/proposals/new" class="t-label text-ink-45 hover:text-ink">Submit</NuxtLink>
          <NuxtLink v-if="auth.isAdmin" to="/admin/decisions" class="t-label text-ink-45 hover:text-ink">Decisions</NuxtLink>
        </nav>
        <span v-if="auth.user" class="t-label text-ink-45">{{ auth.user.name }} · {{ roleLabel }}</span>
        <UiAvatar v-if="auth.user" :initials="auth.user.initials" size="sm" />
        <button class="t-label text-ink-45 hover:text-ink" @click="auth.logout()">Sign out</button>
      </div>
    </header>

    <!-- No named slots: app.vue already wraps every page in this layout, so a
         page wrapping itself in <NuxtLayout> again would nest two of them.
         Pages that need a sidebar lay out their own grid. -->
    <main class="max-w-[1440px] mx-auto px-6 py-8"><slot /></main>
  </div>
</template>
