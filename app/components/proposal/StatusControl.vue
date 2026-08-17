<script setup lang="ts">
import type { Proposal, Status } from '~/types/api'

// `align` is the host layout's business. It defaults to `end` for decisions.vue's
// table cells; proposals/[id].vue asks for `start` explicitly.
const props = defineProps<{ proposal: Proposal; align?: 'start' | 'end' }>()
const emit = defineEmits<{ changed: [] }>()
const { push } = useToast()

const rejecting = ref(false)
const note = ref('')
const busy = ref(false)

interface StatusResponse { proposal: Proposal; changed_by: unknown; changed_at: string | null }

async function setStatus(status: Status, withNote = '') {
  if (busy.value) return
  busy.value = true
  try {
    const res = await useApi().patch<StatusResponse>(
      `/proposals/${props.proposal.id}/status`,
      { status, note: withNote || null },
    )
    rejecting.value = false
    note.value = ''
    // The server no-ops a status the proposal already holds: still 200, but
    // `changed_at` stays null and no audit row is written. Only a non-null
    // `changed_at` means a decision was recorded.
    if (res.changed_at) push(`“${props.proposal.title}” is now ${status}.`)
    else push(`“${props.proposal.title}” was already ${status} — nothing changed.`)
    // Reload either way: on the no-op branch this row's status may be stale, and the
    // queue is filtered to pending, so a row that left it must leave the list.
    emit('changed')
  } catch (e) {
    push((e as ApiError).message, 'error')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="flex gap-2" :class="align === 'start' ? 'justify-start' : 'justify-end'">
    <UiButton
      size="sm" variant="approve" :disabled="busy || proposal.status === 'approved'"
      @click="setStatus('approved')"
    >Approve</UiButton>
    <UiButton
      size="sm" variant="danger" :disabled="busy || proposal.status === 'rejected'"
      @click="rejecting = true"
    >Reject</UiButton>
    <UiButton
      size="sm" variant="ghost" :disabled="busy || proposal.status === 'pending'"
      @click="setStatus('pending')"
    >Reset</UiButton>

    <!-- Rejecting needs an explanation the speaker will read, so it goes through a
         confirmation step rather than firing on one click. -->
    <UiModal
      :open="rejecting" title="Reject this proposal?"
      :body="`${proposal.author.name} will be notified. You can change the status again later.`"
      @close="rejecting = false"
    >
      <UiTextarea v-model="note" label="Note to speaker" :rows="2" :maxlength="500" help="Optional." />
      <template #actions>
        <UiButton variant="ghost" size="sm" :disabled="busy" @click="rejecting = false">Cancel</UiButton>
        <UiButton variant="danger" size="sm" :disabled="busy" @click="setStatus('rejected', note)">Reject proposal</UiButton>
      </template>
    </UiModal>
  </div>
</template>
