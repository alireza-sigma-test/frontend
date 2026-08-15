<script setup lang="ts">
import type { Proposal } from '~/types/api'

definePageMeta({ middleware: 'role', roles: ['speaker'] })

const tags = useTagsStore()
const { push } = useToast()

const form = reactive({ title: '', description: '', tags: [] as (number | string)[], attachment: null as File | null })
const errors = ref<Record<string, string[]>>({})
const busy = ref(false)

onMounted(() => { if (!tags.items.length) tags.fetch() })

async function submit() {
  busy.value = true
  errors.value = {}
  try {
    const body = new FormData()
    body.append('title', form.title)
    body.append('description', form.description)
    // Laravel's array validation expects `tags[]` as repeated keys, not a JSON array.
    form.tags.forEach(t => body.append('tags[]', String(t)))
    if (form.attachment) body.append('attachment', form.attachment)

    const created = await useApi().upload<Proposal>('/proposals', body)
    push('Proposal submitted.')
    await navigateTo(`/proposals/${created.id}`)
  } catch (e) {
    const err = e as ApiError
    errors.value = err.errors
    // Field errors land under their inputs; a status with no field errors
    // (429, 5xx) has nowhere to render but a toast.
    if (!Object.keys(err.errors).length) push(err.message, 'error')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-14">
    <div>
      <p class="t-eyebrow text-ink-45">New proposal</p>
      <h1 class="t-section text-ink mt-3">Tell us about your talk</h1>

      <form class="mt-9 flex flex-col gap-[30px]" @submit.prevent="submit">
        <UiInput
          v-model="form.title" label="Title" required counter :maxlength="120"
          help="Reviewers see this first." :error="errors.title?.[0]"
        />
        <UiTextarea
          v-model="form.description" label="Description" required :rows="7"
          help="Markdown is not rendered — plain paragraphs read best in review."
          :error="errors.description?.[0]"
        />
        <UiTagInput v-model="form.tags" :suggestions="tags.items" />
        <UiFileDrop v-model="form.attachment" />
        <p v-if="errors.attachment?.[0]" class="t-label text-rejected-fg">{{ errors.attachment[0] }}</p>

        <!-- One row, divider above: both buttons and the status note share
             it (app-screens.html:275-278), not a separate line below. -->
        <div class="flex items-center flex-wrap gap-3.5 pt-3 border-t border-rule">
          <UiButton type="submit" size="lg" :disabled="busy">{{ busy ? 'Submitting…' : 'Submit proposal' }}</UiButton>
          <NuxtLink to="/proposals"><UiButton variant="ghost" size="lg">Cancel</UiButton></NuxtLink>
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
