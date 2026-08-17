<script setup lang="ts">
const auth = useAuthStore()

// Display-only Title Case — `auth.role` stays the lowercase Role literal
// other code compares against (isSpeaker/isAdmin, :roles metas).
const roleLabel = computed(() => (auth.role ? auth.role.charAt(0).toUpperCase() + auth.role.slice(1) : ''))

// One treatment for four links, rather than four chances to let one drift.
const navLink = 't-label text-ink-45 hover:text-ink transition-colors duration-[var(--duration-instant)] ease-out-soft'
</script>

<template>
  <div class="min-h-screen bg-paper">
    <!-- The design specifies a single 64px row and no mobile behaviour. Below `md`
         this wraps to two: identity and actions on row one, nav full-width beneath.
         The name/role text drops there — the avatar and nav labels carry enough
         identity, and nothing else fits. `md` not `sm`, because an admin's 3-item nav
         plus a long name is still tight at 640px. -->
    <header class="border-b border-rule bg-card">
      <div class="max-w-[1440px] mx-auto px-4 sm:px-8 py-3 md:py-0 md:h-16 flex flex-wrap md:flex-nowrap items-center gap-x-6 gap-y-3">
        <NuxtLink to="/proposals" class="flex items-center gap-2.5">
          <span class="w-[9px] h-[9px] rounded-full bg-terracotta" aria-hidden="true" />
          <span class="t-eyebrow text-[11px] text-ink">Proposal Review</span>
        </NuxtLink>
        <!-- Rendered only when the socket is up: an "Offline" chip on every
             deployment without Reverb would read as a broken app rather than an
             absent enhancement. Dropped below `md` with the name/role text. -->
        <span
          v-if="auth.user && $echo.state.value === 'connected'"
          class="hidden md:flex md:order-2 items-center gap-2 t-eyebrow text-[11px] text-approved-fg whitespace-nowrap"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-approved-fg opacity-80" aria-hidden="true" />
          Connected
        </span>
        <span v-if="auth.user" class="hidden md:inline md:order-2 t-label text-ink-45 whitespace-nowrap">{{ auth.user.name }} · {{ roleLabel }}</span>
        <!-- Gated on auth.user, not isAuthenticated: logout() nulls the user while
             this layout is still mounted, and the bell fetches on mount. -->
        <NotificationBell v-if="auth.user" class="order-1 md:order-2 ml-auto md:ml-0" />
        <UiAvatar v-if="auth.user" :initials="auth.user.initials" size="sm" class="order-1 md:order-3 md:ml-0" />
        <button
          class="order-2 md:order-4 t-label text-ink-45 hover:text-ink whitespace-nowrap
                 transition-colors duration-[var(--duration-instant)] ease-out-soft"
          @click="auth.logout()"
        >Sign out</button>
        <nav class="order-3 md:order-1 basis-full md:basis-auto flex gap-4 md:flex-1">
          <NuxtLink to="/proposals" :class="navLink">Proposals</NuxtLink>
          <NuxtLink v-if="auth.isSpeaker" to="/proposals/new" :class="navLink">Submit</NuxtLink>
          <NuxtLink v-if="auth.isAdmin" to="/admin/decisions" :class="navLink">Decisions</NuxtLink>
          <NuxtLink v-if="auth.isAdmin" to="/admin/users" :class="navLink">Users</NuxtLink>
          <NuxtLink to="/activity" :class="navLink">Activity</NuxtLink>
        </nav>
      </div>
    </header>

    <UserVerificationBanner />

    <!-- No named slots: app.vue already wraps every page, so a page using
         <NuxtLayout> itself would nest two. Sidebars are the page's own grid. -->
    <main class="max-w-[1440px] mx-auto px-6 py-8"><slot /></main>
  </div>
</template>
