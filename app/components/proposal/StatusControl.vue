<script setup lang="ts">
import type { Proposal, Status } from '~/types/api'

// `align` is the host layout's business, not this control's. It defaults to
// `end` because this component was built as a right-aligned table cell in
// admin/decisions.vue and both of that page's call sites still depend on it;
// proposals/[id].vue mounts it inside a left-aligned reading column and asks
// for `start` explicitly.
const props = defineProps<{ proposal: Proposal; align?: 'start' | 'end' }>()
const emit = defineEmits<{ changed: [] }>()
const { push } = useToast()

const rejecting = ref(false)
const note = ref('')
const busy = ref(false)

interface StatusResponse { proposal: Proposal; changed_by: unknown; changed_at: string | null }

async function setStatus(status: Status, withNote = '') {
  // Same double-submit guard every other form in this app uses.
  if (busy.value) return
  busy.value = true
  try {
    const res = await useApi().patch<StatusResponse>(
      `/proposals/${props.proposal.id}/status`,
      { status, note: withNote || null },
    )
    rejecting.value = false
    note.value = ''
    // The server no-ops setting a proposal to the status it already holds:
    // still 200, still a fully populated `changed_by`, but `changed_at`
    // stays null and no status-change row is written (verified live). A 200
    // alone never means a decision was recorded — only a non-null
    // `changed_at` does, so the two cases get different, honest copy.
    if (res.changed_at) push(`“${props.proposal.title}” is now ${status}.`)
    else push(`“${props.proposal.title}” was already ${status} — nothing changed.`)
    // Reload either way: even on the no-op branch, this row's `status` may
    // be stale relative to the server (e.g. another admin already changed
    // it), and the queue is filtered to `status=pending` — a row that just
    // left that status needs to actually leave the list.
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

    <!-- Approving needs no explanation; rejecting does — the note is shown
         to the speaker, so it goes through a confirmation step rather than
         firing on one click (design-system.html:381-393). -->
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
