<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const auth = useAuthStore()
const { push } = useToast()

const email = ref('')
const password = ref('')
const errors = ref<Record<string, string[]>>({})
const busy = ref(false)

async function submit() {
  busy.value = true
  errors.value = {}
  try {
    await auth.login(email.value, password.value)
    await navigateTo('/proposals')
  } catch (e) {
    const err = e as ApiError
    errors.value = err.errors
    // 429 and 5xx carry no field errors, so surface them as a toast.
    if (!Object.keys(err.errors).length) push(err.message, 'error')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <p class="t-eyebrow text-ink-45">Proposal Review</p>
    <h2 class="t-section text-ink mt-2">Sign in</h2>

    <form class="mt-8 flex flex-col gap-4" @submit.prevent="submit">
      <UiInput v-model="email" label="Email" type="email" required :error="errors.email?.[0]" />
      <UiInput v-model="password" label="Password" type="password" required :error="errors.password?.[0]" />
      <UiButton type="submit" size="lg" :disabled="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</UiButton>
    </form>

    <p class="t-body text-ink-45 mt-6">
      No account? <NuxtLink to="/register" class="text-terracotta underline">Create one</NuxtLink>
    </p>
  </div>
</template>
