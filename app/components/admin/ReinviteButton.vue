<script setup lang="ts">
import type { User } from '~/types/api'

const props = defineProps<{ user: User }>()
const { push } = useToast()

const busy = ref(false)

async function reinvite() {
  if (busy.value) return
  busy.value = true
  try {
    await useApi().post(`/admin/users/${props.user.id}/reinvite`)
    push(`A fresh invitation code is on its way to ${props.user.email}.`)
  } catch (e) {
    // Unverified is not the same as re-invitable: a self-registered user who never
    // confirmed still returns 422 not_reinvitable, so show the server's message.
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
