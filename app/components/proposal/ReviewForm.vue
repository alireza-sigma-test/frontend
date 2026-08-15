<script setup lang="ts">
import type { Review } from '~/types/api'

const props = defineProps<{ proposalId: number; maxRating: number; existing: Review | null }>()
const emit = defineEmits<{ saved: [] }>()
const { push } = useToast()

const rating = ref(props.existing?.rating ?? 0)
const comment = ref(props.existing?.comment ?? '')
const errors = ref<Record<string, string[]>>({})
const busy = ref(false)

const FORM_FIELDS = ['rating', 'comment']

async function submit() {
  // Same guard as the other three forms in this app — two synchronous
  // clicks both pass `:disabled` before Vue re-renders it.
  if (busy.value) return
  busy.value = true
  errors.value = {}
  try {
    await useApi().post(`/proposals/${props.proposalId}/reviews`, { rating: rating.value, comment: comment.value || null })
    push(props.existing ? 'Review updated.' : 'Review posted.')
    emit('saved')
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
  <UiCard>
    <!-- app-screens.html:379 — the card super-title is the same eyebrow
         (mono, uppercase, ink-45) treatment as "Aggregate" below it and
         "What reviewers look for" on screen 03, not a sentence-case
         t-label. The existing/new wording itself is this form's own
         addition, justified by POST being updateOrCreate server-side. -->
    <p class="t-eyebrow text-ink-45">{{ existing ? 'Your review' : 'Add your review' }}</p>
    <form class="mt-4 flex flex-col gap-4" @submit.prevent="submit">
      <UiRatingInput v-model="rating" :max="maxRating" />
      <p v-if="errors.rating?.[0]" class="t-label text-rejected-fg">{{ errors.rating[0] }}</p>
      <UiTextarea v-model="comment" label="Comment" :rows="5" :maxlength="2000" :error="errors.comment?.[0]" />
      <UiButton type="submit" class="w-full" :disabled="busy || rating < 1">
        {{ busy ? 'Saving…' : existing ? 'Update review' : 'Post review' }}
      </UiButton>
    </form>
    <p class="t-label text-ink-45 mt-3">Speakers see reviewer comments but not individual scores.</p>
  </UiCard>
</template>
