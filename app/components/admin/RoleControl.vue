<script setup lang="ts">
import type { Role, User } from '~/types/api'

const props = defineProps<{ user: User }>()
const emit = defineEmits<{ changed: [] }>()
const { push } = useToast()

const busy = ref(false)

// `long` feeds the sentence forms — the aria-label and the confirmation toast — since
// the visible word alone has no context inside a table cell.
//
// `label: 'Admin'` is short where the badge and invite modal spell out
// "Administrator": three buttons must fit the `w-[250px]` cell. `long` still says it
// in full, so nothing user-facing reads as a different role.
const ROLES: { value: Role; label: string; long: string }[] = [
  { value: 'speaker',  label: 'Speaker',  long: 'a speaker' },
  { value: 'reviewer', label: 'Reviewer', long: 'a reviewer' },
  { value: 'admin',    label: 'Admin',    long: 'an administrator' },
]

async function setRole(role: Role, long: string) {
  if (busy.value) return
  busy.value = true
  try {
    await useApi().patch(`/admin/users/${props.user.id}/role`, { role })
    push(`${props.user.name} is now ${long}.`)
    emit('changed')
  } catch (e) {
    // Two different 403s land here and only one carries a `code`: demoting the last
    // admin returns `last_admin`, self-demotion returns a bare message. The server's
    // own message is honest for both. users.vue also prevents the self case upstream.
    push((e as ApiError).message, 'error')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <!-- Like ProposalStatusControl: a row of small buttons with the current option
       disabled. `flex-wrap` because this also renders inside a UiCard at 375px. All
       three are `secondary` — `danger` is reserved for destructive actions, and
       granting a role is reversible. -->

  <div class="flex justify-end gap-2 flex-wrap">
    <UiButton
      v-for="r in ROLES" :key="r.value"
      size="sm" variant="secondary"
      :disabled="busy || user.role === r.value"
      :aria-label="`Make ${user.name} ${r.long}`"
      @click="setRole(r.value, r.long)"
    >{{ r.label }}</UiButton>
  </div>
</template>
