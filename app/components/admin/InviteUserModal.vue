<script setup lang="ts">
import type { Role } from '~/types/api'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; created: [] }>()
const { push } = useToast()

const form = reactive({ name: '', email: '', role: 'speaker' as Role })
const errors = ref<Record<string, string[]>>({})
const busy = ref(false)
const formId = useId()
const roleHeadingId = useId()

// Three options where register.vue deliberately shows two. Administrators
// are created by administrators — POST /api/register rejects role: admin —
// so this modal is the only place in the product where one can be made, and
// dropping the option would defeat the screen.
const roles = [
  { value: 'speaker',  label: 'Speaker',       description: 'Submit proposals and follow their status' },
  { value: 'reviewer', label: 'Reviewer',      description: 'Read every proposal, rate and comment' },
  { value: 'admin',    label: 'Administrator', description: 'Decide outcomes and manage every account' },
]

const FORM_FIELDS = ['name', 'email', 'role']

// The modal stays mounted between openings (UiModal drives the native
// <dialog> from the `open` prop), so without this a second invitation opens
// on the first one's values and its "email has already been taken" error.
watch(() => props.open, (open) => {
  if (!open) return
  form.name = ''
  form.email = ''
  form.role = 'speaker'
  errors.value = {}
})

async function submit() {
  // Same double-submit guard every other form in this app uses.
  if (busy.value) return
  busy.value = true
  errors.value = {}
  try {
    await useApi().post('/admin/users', { ...form })
    // Read the address off the form, not the 201 body: this is the last
    // moment it's on screen. The new row typically lands at the end of the
    // list — the repository issues a plain, unordered `paginate()`, so
    // nothing here actually guarantees it — meaning it may not be on the
    // current page.
    push(`Invitation sent to ${form.email}.`)
    emit('created')
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
  <UiModal
    :open="open" title="Invite a user"
    body="They’ll get an email with a code to accept the invitation and choose their own password — there is no password to set here."
    @close="emit('close')"
  >
    <form :id="formId" class="flex flex-col gap-[22px]" @submit.prevent="submit">
      <UiInput v-model="form.name" label="Name" required :error="errors.name?.[0]" />
      <UiInput v-model="form.email" label="Email" type="email" required :error="errors.email?.[0]" />

      <div>
        <p :id="roleHeadingId" class="t-label text-ink mb-2">Joining as</p>
        <div role="radiogroup" :aria-labelledby="roleHeadingId">
          <UiRadioCards v-model="form.role" :options="roles" />
        </div>
        <p v-if="errors.role?.[0]" class="t-label text-rejected-fg mt-1">{{ errors.role[0] }}</p>
      </div>
    </form>

    <!-- UiModal renders its actions on a separate tinted band, outside the
         default slot this form lives in, so the submit button reaches the
         form by id rather than by containment. That keeps it a real
         type="submit" — Enter from either text field still sends the
         invitation, which a @click-only button would have broken. -->
    <template #actions>
      <UiButton variant="ghost" size="sm" :disabled="busy" @click="emit('close')">Cancel</UiButton>
      <UiButton type="submit" :form="formId" size="sm" :disabled="busy">{{ busy ? 'Sending…' : 'Send invitation' }}</UiButton>
    </template>
  </UiModal>
</template>
