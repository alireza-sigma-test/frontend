<script setup lang="ts">
import type { Role, User } from '~/types/api'

definePageMeta({ middleware: 'role', roles: ['admin'] })

const auth = useAuthStore()

// GET /admin/users returns `{data, links, meta}` — deliberately NOT the
// `Paginated<T>` in types/api.ts, which also carries the proposal list's
// `counts` block. This endpoint has no equivalent (verified live), so it gets
// its own local shape rather than a loosened shared one.
interface UsersPage {
  data: User[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}

const items = ref<User[]>([])
const meta = ref({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
const loading = ref(false)
const error = ref('')
const page = ref(1)
const inviting = ref(false)

// Page lives in a plain ref, not the URL query: nothing else on this screen
// is URL state (no filters, no search), and an admin has no reason to
// deep-link "page 2 of the user list" the way they do a filtered proposal
// view. The UiPagination wiring itself is the same as proposals/index.vue's.
//
// `seq` discards a response whose request has already been superseded —
// clicking 2 then 3 quickly can otherwise land page 2's rows after page 3's,
// the same race the proposals store guards.
let seq = 0
async function load() {
  const requestId = ++seq
  loading.value = true
  error.value = ''
  try {
    const res = await useApi().get<UsersPage>(`/admin/users?page=${page.value}`)
    if (requestId !== seq) return
    items.value = res.data
    meta.value = res.meta
  } catch (e) {
    if (requestId !== seq) return
    error.value = (e as ApiError).message
  } finally {
    if (requestId === seq) loading.value = false
  }
}
watch(page, load, { immediate: true })

// `meta.total`, not `items.length`: the list is paginated at 15 and the
// header must describe the whole directory, not the slice on screen.
// Per-role tallies are deliberately absent — they could only be computed
// from the current page, which would state a confident number that is wrong
// as soon as there is a second page.
const subtitle = computed(() => {
  const n = meta.value.total
  return `${n} ${n === 1 ? 'person' : 'people'} · oldest first`
})

// Paging is the one action here whose result is otherwise silent — the
// heading, the count and the toast all stay the same, and `aria-current` on
// a button the user has already left doesn't announce itself. So the summary
// carries the page position too, unlike the count-only summaries on the
// proposal screens.
//
// `onSettled` moves focus back to the heading, the same fix decisions.vue
// makes for the same cause: the whole list is gated on `v-if="!loading"`, so
// every reload — after a role change, after paging — unmounts and remounts
// the row that was just acted on. The activated button goes with it (and
// would become `disabled` even if it survived), dropping focus to <body> and
// making a keyboard admin tab past the entire table again. `flush: 'post'`
// inside the composable is what makes this land after the remount.
const heading = ref<HTMLHeadingElement>()
const announcement = useResultAnnouncer(
  () => loading.value,
  () => error.value
    ? 'Could not load users.'
    : meta.value.last_page > 1
      ? `${subtitle.value} · page ${meta.value.current_page} of ${meta.value.last_page}`
      : subtitle.value,
  () => heading.value?.focus(),
)

const roleLabel: Record<Role, string> = { speaker: 'Speaker', reviewer: 'Reviewer', admin: 'Administrator' }
// Administrator carries the accent tint the avatars and tag chips use;
// speaker and reviewer are neutral. Status hues (pending/approved/rejected)
// are pointedly not reused here — they mean a proposal's decision, and
// borrowing them for a role would make two unrelated things look alike.
const roleTone: Record<Role, 'accent' | 'neutral'> = {
  speaker:  'neutral',
  reviewer: 'neutral',
  admin:    'accent',
}

// A new account lands at the end of the list, so on a full page it may not
// be on screen; the toast in the modal names the invitee, and reloading the
// current page keeps the header total honest.
function onCreated() {
  inviting.value = false
  load()
}
</script>

<template>
  <div>
    <p aria-live="polite" class="sr-only">{{ announcement }}</p>

    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <!-- tabindex="-1": not in the tab order, only a programmatic focus
             target for the post-reload focus restoration above. -->
        <h1 ref="heading" tabindex="-1" class="t-section text-ink">Users</h1>
        <p v-if="!error" class="t-body text-ink-45 mt-1.5">{{ subtitle }}</p>
      </div>
      <UiButton class="self-start sm:self-auto" @click="inviting = true">Invite a user</UiButton>
    </div>

    <!-- Skeleton matches the final layout's own chrome (a bordered card),
         not a bare shimmer — design-system.html:424. -->
    <div v-if="loading" class="bg-card border border-rule rounded-card p-6 mt-8">
      <UiSkeleton :lines="6" />
    </div>

    <UiErrorState v-else-if="error" title="Couldn’t load users" :body="error" class="mt-8" @retry="load" />

    <!-- Unreachable in practice — the signed-in admin is always in this list
         — but a blank page on an unexpected empty response is worse than one
         redundant branch. -->
    <UiEmptyState v-else-if="!items.length" title="No accounts" body="Invite someone to get started." class="mt-8" />

    <!-- Below `md` the five-column table doesn't reflow — cards instead, one
         per account, exactly as screen 05 solves the same problem. -->
    <div v-else class="md:hidden mt-8 flex flex-col gap-3">
      <UiCard v-for="u in items" :key="u.id">
        <div class="flex items-center gap-3">
          <UiAvatar :initials="u.initials" size="sm" />
          <div class="min-w-0">
            <p class="t-label text-ink truncate">{{ u.name }}</p>
            <p class="t-label text-ink-45 truncate">{{ u.email }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap mt-3">
          <AdminUserBadge :label="roleLabel[u.role]" :tone="roleTone[u.role]" />
          <AdminUserBadge v-if="!u.is_verified" label="Unverified" tone="pending" dot />
        </div>

        <!-- An admin cannot change their own role (the API refuses it with a
             bare 403), so their row offers no control at all rather than a
             button whose only possible outcome is a refusal. Written as
             "is this me?" rather than "is this someone else?" so a null
             `auth.user` can only ever fall through to the control, never
             label every row as the reader's own account. -->
        <p v-if="auth.user?.id === u.id" class="t-label text-ink-45 mt-4">Your own account — roles are changed by another administrator.</p>
        <div v-else class="mt-4">
          <AdminRoleControl :user="u" @changed="load" />
        </div>

        <!-- Only unverified users can be re-invited. -->
        <div v-if="!u.is_verified" class="mt-3 flex justify-end">
          <AdminReinviteButton :user="u" />
        </div>
      </UiCard>
    </div>

    <!-- Its own root condition, not part of the chain above: without
         re-stating the loading/error guards, a role change would render the
         skeleton and the stale table at once at >=768px. -->
    <div v-if="!loading && !error && items.length" class="hidden md:block bg-card border border-rule rounded-card overflow-hidden mt-8">
      <!-- Five columns with two fixed-width action clusters don't fit a
           narrow viewport; scroll the table itself rather than clipping it
           (the outer overflow-hidden only rounds the corners at rest). -->
      <div class="overflow-x-auto">
        <table class="w-full min-w-[900px] border-collapse">
          <!-- The page size comes off the response, not a literal: the
               server owns it, and a hardcoded 15 becomes a lie the moment
               its default changes. -->
          <caption class="sr-only">User accounts, {{ meta.per_page }} per page</caption>
          <thead>
            <tr class="bg-paper border-b border-rule text-left">
              <th scope="col" class="t-label text-ink-70 py-3.5 pl-6 pr-3">Person</th>
              <th scope="col" class="t-label text-ink-70 py-3.5 px-3 w-[140px]">Role</th>
              <th scope="col" class="t-label text-ink-70 py-3.5 px-3 w-[160px]">Account</th>
              <th scope="col" class="t-label text-ink-70 py-3.5 px-3 w-[250px] text-right">Set role</th>
              <th scope="col" class="t-label text-ink-70 py-3.5 pl-3 pr-6 w-[130px] text-right">Invitation</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in items" :key="u.id" class="border-b border-sunken last:border-b-0">
              <td class="py-[18px] pl-6 pr-3">
                <div class="flex items-center gap-3">
                  <UiAvatar :initials="u.initials" size="sm" />
                  <div class="min-w-0">
                    <span class="t-label text-ink block">{{ u.name }}</span>
                    <span class="t-label text-ink-45 block">{{ u.email }}</span>
                  </div>
                </div>
              </td>
              <td class="py-[18px] px-3">
                <AdminUserBadge :label="roleLabel[u.role]" :tone="roleTone[u.role]" />
              </td>
              <!-- The unverified case is the one that carries an action, so
                   it gets the badge and the date it has been waiting; a
                   verified account is quiet text. -->
              <td class="py-[18px] px-3">
                <span v-if="u.is_verified" class="t-label text-ink-45">Verified</span>
                <template v-else>
                  <AdminUserBadge label="Unverified" tone="pending" dot />
                  <span class="t-label text-ink-45 block mt-1">Added {{ relativeTime(u.created_at) }}</span>
                </template>
              </td>
              <td class="py-[18px] px-3">
                <span v-if="auth.user?.id === u.id" class="t-label text-ink-45 block text-right">Your account</span>
                <AdminRoleControl v-else :user="u" @changed="load" />
              </td>
              <td class="py-[18px] pl-3 pr-6 text-right">
                <AdminReinviteButton v-if="!u.is_verified" :user="u" />
                <span v-else class="t-label text-ink-45" aria-hidden="true">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Outside both the card list and the table so one control serves both
         layouts. Without it the 16th account is invisible, and on this screen
         invisible means unmanageable. -->
    <div v-if="!loading && !error && meta.last_page > 1" class="mt-6 flex justify-center">
      <UiPagination :current-page="meta.current_page" :last-page="meta.last_page" @change="p => page = p" />
    </div>

    <p class="t-body text-ink-45 mt-6 max-w-[76ch]">
      An invited person sets their own password from a code we email them; nobody sets a password on their behalf.
      Administrators cannot change their own role, and the last remaining administrator cannot be demoted.
    </p>

    <AdminInviteUserModal :open="inviting" @close="inviting = false" @created="onCreated" />
  </div>
</template>
