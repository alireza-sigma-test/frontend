<script setup lang="ts">
import type { Role, User } from '~/types/api'

const props = defineProps<{ user: User }>()
const emit = defineEmits<{ changed: [] }>()
const { push } = useToast()

const busy = ref(false)

// `long` is what the sentence forms need — an aria-label ("Make Dana Roth a
// speaker") and the confirmation toast — since the button's own visible word
// is a noun with no context of its own inside a table cell.
//
// `label: 'Admin'` here is deliberately short, even though the badge and the
// invite modal both spell out "Administrator" for the same role — a
// deliberate concession, not an oversight: three buttons have to fit
// side by side in the "Set role" column's `w-[250px]` cell, and
// "Administrator" alongside "Speaker" and "Reviewer" does not. `long`
// still says "an administrator" in full, so the one place this shorthand
// could read as a different role (the aria-label and the toast) does not.
const ROLES: { value: Role; label: string; long: string }[] = [
  { value: 'speaker',  label: 'Speaker',  long: 'a speaker' },
  { value: 'reviewer', label: 'Reviewer', long: 'a reviewer' },
  { value: 'admin',    label: 'Admin',    long: 'an administrator' },
]

async function setRole(role: Role, long: string) {
  // Same double-submit guard every other form in this app uses.
  if (busy.value) return
  busy.value = true
  try {
    await useApi().patch(`/admin/users/${props.user.id}/role`, { role })
    push(`${props.user.name} is now ${long}.`)
    emit('changed')
  } catch (e) {
    // Two different 403s can land here and only one is machine-readable
    // (verified live): demoting the last administrator returns
    // `{message, code: "last_admin"}`, while an admin changing their own
    // role returns a bare `{message: "This action is unauthorized."}` with
    // no `code` at all. The server's own message is the honest thing to
    // show for both — nothing here should be swallowed. The self-change
    // case is additionally prevented upstream: users.vue renders no control
    // on the signed-in admin's own row, because the answer is always no.
    push((e as ApiError).message, 'error')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <!-- Structured like ProposalStatusControl: a right-aligned row of small
       buttons with the option already in effect disabled, rather than a
       select (UiSelect was deleted from this codebase as unused). `flex-wrap`
       because this same control also renders inside a UiCard at 375px.
       All three are `secondary`, including Admin: the design system reserves
       `danger` for destructive actions, and granting a role is reversible —
       the elevated weight of "administrator" is carried by the role badge's
       accent tint in the row instead. -->

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
