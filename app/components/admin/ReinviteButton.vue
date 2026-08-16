<script setup lang="ts">
import type { User } from '~/types/api'

const props = defineProps<{ user: User }>()
const { push } = useToast()

const busy = ref(false)

async function reinvite() {
  // Same double-submit guard every other form in this app uses.
  if (busy.value) return
  busy.value = true
  try {
    await useApi().post(`/admin/users/${props.user.id}/reinvite`)
    push(`A fresh invitation code is on its way to ${props.user.email}.`)
  } catch (e) {
    // Callers only render this for `is_verified: false`, but unverified is
    // not the same as re-invitable: a user who registered themselves and
    // never confirmed their email still comes back `422 not_reinvitable`
    // (verified live — reinvite exists for admin-created accounts that were
    // never claimed). Show the server's message rather than pretending it
    // worked.
    push((e as ApiError).message, 'error')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <UiButton
    variant="secondary" size="sm" :disabled="busy"
    :aria-label="`Re-send the invitation to ${user.email}`"
    @click="reinvite"
  >{{ busy ? 'Sending…' : 'Re-invite' }}</UiButton>
</template>
