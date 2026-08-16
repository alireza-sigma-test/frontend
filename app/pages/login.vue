<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const auth = useAuthStore()
const { push } = useToast()

const email = ref('')
const password = ref('')
const errors = ref<Record<string, string[]>>({})
const busy = ref(false)

const FORM_FIELDS = ['email', 'password']

async function submit() {
  if (busy.value) return
  busy.value = true
  errors.value = {}
  try {
    await auth.login(email.value, password.value)
    await navigateTo('/proposals')
  } catch (e) {
    const err = e as ApiError
    errors.value = err.errors
    reportUnhandledErrors(err, FORM_FIELDS, push)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <!-- Visually hidden: the tab row below is the visual heading (per the
         design, which has no separate serif heading on this panel), but the
         page still needs one real heading for assistive tech / doc outline. -->
    <h2 class="sr-only">Sign in</h2>

    <div class="flex gap-6 border-b border-rule mb-8">
      <span aria-current="page" class="t-label text-[14px] text-ink pb-3 border-b-2 border-terracotta -mb-px">Sign in</span>
      <NuxtLink
        to="/register"
        class="t-label text-[14px] text-ink-45 hover:text-ink pb-3 transition-colors duration-[var(--duration-instant)] ease-out-soft"
      >Create account</NuxtLink>
    </div>

    <form class="flex flex-col gap-4" @submit.prevent="submit">
      <UiInput v-model="email" label="Email" type="email" required :error="errors.email?.[0]" />
      <UiInput v-model="password" label="Password" type="password" required :error="errors.password?.[0]" />
      <UiButton type="submit" size="lg" :disabled="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</UiButton>
    </form>
  </div>
</template>
