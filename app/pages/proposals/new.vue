<script setup lang="ts">
import type { Proposal } from '~/types/api'

definePageMeta({ middleware: 'role', roles: ['speaker'] })

const auth = useAuthStore()
const tags = useTagsStore()
const { push } = useToast()

const form = reactive({ title: '', description: '', tags: [] as (number | string)[], attachment: null as File | null })
const errors = ref<Record<string, string[]>>({})
const busy = ref(false)

onMounted(() => { if (!tags.items.length) tags.fetch() })

const FORM_FIELDS = ['title', 'description', 'tags', 'attachment']

async function submit() {
  if (busy.value) return
  busy.value = true
  errors.value = {}
  try {
    const body = new FormData()
    body.append('title', form.title)
    body.append('description', form.description)
    // Laravel expects `tags[]` as repeated keys, not a JSON array.
    form.tags.forEach(t => body.append('tags[]', String(t)))
    if (form.attachment) body.append('attachment', form.attachment)

    const created = await useApi().upload<Proposal>('/proposals', body)
    push('Proposal submitted.')
    await navigateTo(`/proposals/${created.id}`)
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
  <div class="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_340px] gap-14">
    <!-- `grid-cols-[minmax(0,1fr)]` at the base breakpoint, not only `lg:` —
         see proposals/[id].vue for the concrete bug this pattern caused
         there (an implicit, undefined track sizes to its widest item's
         content rather than the container's actual width). Not currently
         symptomatic on this page, but it's the same fragile shape and this
         keeps the sizing intentional at every breakpoint rather than
         accidental. Inside the wrapper, not above it — see [id].vue's root
         note for why a template-level comment trips NUXT_E4004. -->
    <div>
      <p class="t-eyebrow text-ink-45">New proposal</p>
      <h1 class="t-section text-ink mt-3">Tell us about your talk</h1>

      <!-- Gated on auth.user, not isAuthenticated: logout() nulls the user
           synchronously while this page may still be mounted. No redirect —
           a redirect away from a page the speaker deliberately navigated to
           is disorienting, and the layout's banner is already saying the
           same thing. -->
      <UiEmptyState
        v-if="auth.user && !auth.isVerified"
        title="Confirm your email to submit a proposal"
        body="This form opens back up as soon as your address is confirmed — it only takes a minute."
        class="mt-9"
      >
        <UiButton to="/verify-email" size="sm">Enter your code</UiButton>
      </UiEmptyState>

      <form v-else-if="auth.user" class="mt-9 flex flex-col gap-[30px]" @submit.prevent="submit">
        <UiInput
          v-model="form.title" label="Title" required counter :maxlength="120"
          help="Reviewers see this first." :error="errors.title?.[0]"
        />
        <UiTextarea
          v-model="form.description" label="Description" required :rows="7"
          help="Markdown is not rendered — plain paragraphs read best in review."
          :error="errors.description?.[0]"
        />
        <div>
          <!-- `tags.failed` used to be written by the store and read
               nowhere — a failed GET /tags degraded silently to "no
               suggestions", which risked a speaker creating a duplicate
               free-text tag instead of picking the existing one they meant.
               The input itself still works on failure (free-text tags are
               still valid), so it stays mounted; this just makes the
               degradation visible with the same retry idiom other screens
               use. -->
          <div v-if="tags.failed" class="mb-1.5 flex items-center gap-3 flex-wrap">
            <p class="t-label text-ink-45">Couldn’t load tag suggestions — you can still type to create one.</p>
            <UiButton variant="secondary" size="sm" @click="tags.fetch()">Try again</UiButton>
          </div>
          <UiTagInput v-model="form.tags" :suggestions="tags.items" />
          <p v-if="errors.tags?.[0]" class="t-label text-rejected-fg mt-1.5">{{ errors.tags[0] }}</p>
        </div>
        <UiFileDrop v-model="form.attachment" />
        <p v-if="errors.attachment?.[0]" class="t-label text-rejected-fg">{{ errors.attachment[0] }}</p>

        <!-- One row, divider above: both buttons and the status note share
             it (app-screens.html:275-278), not a separate line below. -->
        <div class="flex items-center flex-wrap gap-3.5 pt-3 border-t border-rule">
          <UiButton type="submit" size="lg" :disabled="busy">{{ busy ? 'Submitting…' : 'Submit proposal' }}</UiButton>
          <UiButton to="/proposals" variant="ghost" size="lg">Cancel</UiButton>
          <p class="t-label text-ink-45 sm:ml-auto">
            Status will be <strong class="text-pending-fg">pending</strong> until a reviewer reads it.
          </p>
        </div>
      </form>
    </div>

    <aside class="lg:pt-[78px] flex flex-col gap-4">
      <UiCard>
        <p class="t-eyebrow text-ink-45 mb-4">What reviewers look for</p>
        <div class="flex flex-col gap-4">
          <p class="t-body text-ink-70"><strong class="font-medium text-ink">A concrete claim.</strong> Name the thing you learned, not the topic area.</p>
          <p class="t-body text-ink-70"><strong class="font-medium text-ink">Evidence.</strong> Numbers, before and after, or a war story.</p>
          <p class="t-body text-ink-70"><strong class="font-medium text-ink">Who it's for.</strong> One sentence on the audience that benefits.</p>
        </div>
      </UiCard>

      <!-- app-screens.html:291-293 — a second, borderless aside block the
           brief omitted entirely. -->
      <div class="bg-sunken rounded-card px-[22px] py-5">
        <p class="t-body text-ink-70">You can edit a proposal freely while it is pending. Once a decision is made, edits are locked and reviewers are notified.</p>
      </div>
    </aside>
  </div>
</template>
