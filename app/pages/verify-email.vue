<script setup lang="ts">
import type { User } from '~/types/api'

const auth = useAuthStore()
const { push } = useToast()

const code = ref('')
const errors = ref<Record<string, string[]>>({})
const busy = ref(false)
const resending = ref(false)

const FORM_FIELDS = ['code']

async function submit() {
  if (busy.value) return
  busy.value = true
  errors.value = {}
  try {
    // Returns the flat, updated user — assign it so the banner and every
    // `can`-driven control update without a page reload.
    const user = await useApi().post<User>('/email/verify', { code: code.value })
    auth.setUser(user)
    await navigateTo('/proposals')
  } catch (e) {
    const err = e as ApiError
    errors.value = err.errors
    reportUnhandledErrors(err, FORM_FIELDS, push)
  } finally {
    busy.value = false
  }
}

async function resend() {
  if (resending.value) return
  resending.value = true
  try {
    await useApi().post('/email/resend')
    // The old code is dead the moment a new one is issued — a stale
    // "not valid or expired" message left under the input would now be
    // describing a code that no longer exists, contradicting the toast.
    errors.value = {}
    push('A new code is on its way.')
  } catch (e) {
    push((e as ApiError).message, 'error')
  } finally {
    resending.value = false
  }
}
</script>

<template>
  <div class="max-w-[26rem]">
    <h1 class="t-section text-ink">Confirm your email</h1>
    <p class="t-body text-ink-70 mt-2">
      We sent a six-digit code to {{ auth.user?.email }}. It expires in 15 minutes.
    </p>

    <!-- Already verified: this page has nothing to do, and saying so beats
         showing a form whose only outcome is a no-op 200. -->
    <p v-if="auth.isVerified" class="t-body text-approved-fg mt-6">
      Your email address is already confirmed.
      <NuxtLink to="/proposals" class="underline">Back to proposals</NuxtLink>
    </p>

    <form v-else class="mt-8 flex flex-col gap-4" @submit.prevent="submit">
      <UiInput
        v-model="code" label="Verification code" required
        :maxlength="6" :error="errors.code?.[0]"
        help="Six digits, from the email we just sent."
      />
      <UiButton type="submit" size="lg" :disabled="busy">{{ busy ? 'Confirming…' : 'Confirm email' }}</UiButton>
      <button type="button" class="t-label text-ink-45 hover:text-ink self-start" :disabled="resending" @click="resend">
        {{ resending ? 'Sending…' : 'Send a new code' }}
      </button>
    </form>
  </div>
</template>
