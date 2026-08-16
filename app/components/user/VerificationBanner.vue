<script setup lang="ts">
const auth = useAuthStore()
</script>

<template>
  <!-- Gated on auth.user, never on isAuthenticated: logout() nulls the user
       synchronously while this layout is still mounted. -->
  <div
    v-if="auth.user && !auth.isVerified"
    class="bg-pending-bg border-b border-pending-br px-6 py-3 flex items-center justify-between gap-4"
  >
    <p class="t-label text-pending-fg">
      Confirm your email address to submit, review or decide.
    </p>
    <NuxtLink to="/verify-email" class="t-label text-pending-fg underline flex-none">Enter your code</NuxtLink>
  </div>
</template>
