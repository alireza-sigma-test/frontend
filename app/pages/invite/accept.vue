<script setup lang="ts">
import type { User } from '~/types/api'

definePageMeta({ layout: 'auth' })

const auth = useAuthStore()
const { push } = useToast()

const form = reactive({ email: '', code: '', password: '', password_confirmation: '' })
const errors = ref<Record<string, string[]>>({})
const busy = ref(false)

const FORM_FIELDS = ['email', 'code', 'password', 'password_confirmation']

async function submit() {
  if (busy.value) return
  busy.value = true
  errors.value = {}
  try {
    const res = await useApi().post<{ token: string; user: User }>('/invites/accept', { ...form })
    auth.set(res.token, res.user)
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
    <!-- Visually hidden: unlike login/register, there's no sibling screen to
         tab to here (nothing else an invitee could be doing on this route),
         so the visible label below is a plain span, not a real heading — the
         page still needs one real heading for assistive tech / doc outline. -->
    <h2 class="sr-only">Accept invitation</h2>

    <div class="border-b border-rule mb-8">
      <span class="t-label text-[14px] text-ink pb-3 border-b-2 border-terracotta -mb-px inline-block">Accept invitation</span>
    </div>

    <form class="flex flex-col gap-[22px]" @submit.prevent="submit">
      <UiInput v-model="form.email" label="Email" type="email" required :error="errors.email?.[0]" />
      <UiInput
        v-model="form.code" label="Invite code" required :maxlength="12"
        help="The 12-character code from your invitation email." :error="errors.code?.[0]"
      />
      <UiInput v-model="form.password" label="Password" type="password" required help="At least 8 characters." :error="errors.password?.[0]" />
      <UiInput v-model="form.password_confirmation" label="Confirm password" type="password" required />

      <UiButton type="submit" size="lg" :disabled="busy">{{ busy ? 'Accepting…' : 'Accept invitation' }}</UiButton>
      <p class="t-label text-ink-45 text-center">By continuing you agree to the code of conduct.</p>
    </form>
  </div>
</template>
