<script setup lang="ts">
const auth = useAuthStore()

// Display-only Title Case — `auth.role` stays the lowercase Role literal
// other code compares against (isSpeaker/isAdmin, :roles metas).
const roleLabel = computed(() => (auth.role ? auth.role.charAt(0).toUpperCase() + auth.role.slice(1) : ''))
</script>

<template>
  <div class="min-h-screen bg-paper">
    <!-- The design's own header (app-screens.html:114-126) is a single
         64px row at min-width:1240px — no mobile behaviour specified.
         Below `md` it wraps to two rows instead: identity/actions stay on
         row one (nav no longer fits alongside "Name · Role" + avatar +
         "Sign out" without wrapping mid-word, as it did unfixed at 375px),
         nav becomes its own full-width row underneath. The name/role text
         is dropped below `md` — the avatar + nav labels already carry
         enough identity, and there's no room left once nav and actions
         both need a full-width row's worth of space. `md` (not `sm`)
         because the admin role's 3-item nav plus a long name is still
         tight at 640px. -->
    <header class="border-b border-rule bg-card">
      <div class="max-w-[1440px] mx-auto px-4 sm:px-8 py-3 md:py-0 md:h-16 flex flex-wrap md:flex-nowrap items-center gap-x-6 gap-y-3">
        <NuxtLink to="/proposals" class="flex items-center gap-2.5">
          <span class="w-[9px] h-[9px] rounded-full bg-terracotta" aria-hidden="true" />
          <span class="t-eyebrow text-[11px] text-ink">Proposal Review</span>
        </NuxtLink>
        <span v-if="auth.user" class="hidden md:inline md:order-2 t-label text-ink-45 whitespace-nowrap">{{ auth.user.name }} · {{ roleLabel }}</span>
        <UiAvatar v-if="auth.user" :initials="auth.user.initials" size="sm" class="order-1 md:order-3 ml-auto md:ml-0" />
        <button class="order-2 md:order-4 t-label text-ink-45 hover:text-ink whitespace-nowrap" @click="auth.logout()">Sign out</button>
        <nav class="order-3 md:order-1 basis-full md:basis-auto flex gap-4 md:flex-1">
          <NuxtLink to="/proposals" class="t-label text-ink-45 hover:text-ink">Proposals</NuxtLink>
          <NuxtLink v-if="auth.isSpeaker" to="/proposals/new" class="t-label text-ink-45 hover:text-ink">Submit</NuxtLink>
          <NuxtLink v-if="auth.isAdmin" to="/admin/decisions" class="t-label text-ink-45 hover:text-ink">Decisions</NuxtLink>
        </nav>
      </div>
    </header>

    <!-- No named slots: app.vue already wraps every page in this layout, so a
         page wrapping itself in <NuxtLayout> again would nest two of them.
         Pages that need a sidebar lay out their own grid. -->
    <main class="max-w-[1440px] mx-auto px-6 py-8"><slot /></main>
  </div>
</template>
