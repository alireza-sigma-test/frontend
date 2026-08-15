<script setup lang="ts">
import type { Role } from '~/types/api'
definePageMeta({ layout: 'auth' })

const auth = useAuthStore()
const { push } = useToast()

const form = reactive({ name: '', email: '', password: '', password_confirmation: '', role: 'speaker' as Role })
const errors = ref<Record<string, string[]>>({})
const busy = ref(false)
const roleHeadingId = useId()

const roles = [
  { value: 'speaker',  label: 'Speaker',       description: 'Submit proposals and follow their status' },
  { value: 'reviewer', label: 'Reviewer',      description: 'Read every proposal, rate and comment' },
  { value: 'admin',    label: 'Administrator', description: 'Set the final status of any proposal' },
]

async function submit() {
  busy.value = true
  errors.value = {}
  try {
    await auth.register({ ...form })
    await navigateTo('/proposals')
  } catch (e) {
    const err = e as ApiError
    errors.value = err.errors
    if (!Object.keys(err.errors).length) push(err.message, 'error')
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
    <h2 class="sr-only">Create account</h2>

    <div class="flex gap-6 border-b border-rule mb-8">
      <span class="t-label text-[14px] text-ink pb-3 border-b-2 border-terracotta -mb-px">Create account</span>
      <NuxtLink to="/login" class="t-label text-[14px] text-ink-45 hover:text-ink pb-3">Sign in</NuxtLink>
    </div>

    <form class="flex flex-col gap-[22px]" @submit.prevent="submit">
      <div class="grid grid-cols-2 gap-4">
        <UiInput v-model="form.name" label="Name" required :error="errors.name?.[0]" />
        <UiInput v-model="form.email" label="Email" type="email" required :error="errors.email?.[0]" />
      </div>
      <UiInput v-model="form.password" label="Password" type="password" required help="At least 8 characters." :error="errors.password?.[0]" />
      <UiInput v-model="form.password_confirmation" label="Confirm password" type="password" required />

      <div>
        <p :id="roleHeadingId" class="t-label text-ink mb-2">I am joining as</p>
        <div role="radiogroup" :aria-labelledby="roleHeadingId">
          <UiRadioCards v-model="form.role" :options="roles" />
        </div>
        <p v-if="errors.role?.[0]" class="t-label text-rejected-fg mt-1">{{ errors.role[0] }}</p>
      </div>

      <UiButton type="submit" size="lg" :disabled="busy">{{ busy ? 'Creating…' : 'Create account' }}</UiButton>
      <p class="t-label text-ink-45 text-center">By continuing you agree to the code of conduct.</p>
    </form>
  </div>
</template>
