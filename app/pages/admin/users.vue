<script setup lang="ts">
import type { Role, User } from '~/types/api'

definePageMeta({ middleware: 'role', roles: ['admin'] })

const auth = useAuthStore()

// This endpoint has no `counts` block, so it gets its own local shape rather than a
// loosened `Paginated<T>`.
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

// A plain ref, not URL state: nothing else on this screen is, and "page 2 of the user
// list" is not worth deep-linking.
//
// `seq` discards a superseded response — clicking 2 then 3 quickly can otherwise land
// page 2's rows after page 3's.
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

// `meta.total`, not `items.length`: the header describes the whole directory, not the
// page. Per-role tallies are absent because they could only be computed from the
// current page.
const subtitle = computed(() => {
  const n = meta.value.total
  return `${n} ${n === 1 ? 'person' : 'people'}`
})

// Paging is otherwise silent — heading, count and toast all stay the same — so this
// summary carries the page position too, unlike the count-only ones elsewhere.
//
// `onSettled` refocuses the heading because the list is gated on `v-if="!loading"`, so
// every reload remounts the row just acted on and drops focus to <body>.
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
// Administrator takes the accent tint; speaker and reviewer stay neutral. Status hues
// are deliberately not reused — they mean a proposal's decision.
const roleTone: Record<Role, 'accent' | 'neutral'> = {
  speaker:  'neutral',
  reviewer: 'neutral',
  admin:    'accent',
}

// A new account lands at the end and may be off-page; the modal's toast names the
// invitee, and this keeps the header total honest.
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
        <!-- tabindex="-1": a programmatic focus target only, never in the tab order. -->
        <h1 ref="heading" tabindex="-1" class="t-section text-ink">Users</h1>
        <p v-if="!error" class="t-body text-ink-45 mt-1.5">{{ subtitle }}</p>
      </div>
      <!-- Gated on auth.isVerified rather than a route guard: the writes sit in the
           API's `verified` group but `GET /admin/users` does not, so an unverified
           admin can load this screen while every write 403s. UserResource exposes no
           `can` object, so nothing else derives it. Covers all three write
           affordances. -->
      <UiButton v-if="auth.isVerified" class="self-start sm:self-auto" @click="inviting = true">Invite a user</UiButton>
      <p v-else class="t-label text-ink-45 max-w-[30ch] sm:text-right">
        Confirm your email address to invite people, change roles or re-invite accounts.
      </p>
    </div>

    <!-- Skeleton matches the final layout's chrome, not a bare shimmer. -->
    <div v-if="loading" class="bg-card border border-rule rounded-card p-6 mt-8">
      <UiSkeleton :lines="6" />
    </div>

    <UiErrorState v-else-if="error" title="Couldn’t load users" :body="error" class="mt-8" @retry="load" />

    <!-- Unreachable — the signed-in admin is always listed — but a blank page on an
         unexpected empty response is worse than a redundant branch. -->
    <UiEmptyState v-else-if="!items.length" title="No accounts" body="Invite someone to get started." class="mt-8" />

    <!-- Below `md` the five-column table doesn't reflow, so cards instead. -->
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

        <!-- An admin cannot change their own role, so their row offers no control
             rather than a button that can only be refused. Written as "is this me?" so
             a null `auth.user` cannot label every row as the reader's own. -->
        <p v-if="auth.user?.id === u.id" class="t-label text-ink-45 mt-4">Your own account — roles are changed by another administrator.</p>
        <!-- An unverified admin gets no role control on any row — see above. -->
        <div v-else-if="auth.isVerified" class="mt-4">
          <AdminRoleControl :user="u" @changed="load" />
        </div>

        <!-- Only unverified users can be re-invited, and only by a verified admin. -->
        <div v-if="!u.is_verified && auth.isVerified" class="mt-3 flex justify-end">
          <AdminReinviteButton :user="u" />
        </div>
      </UiCard>
    </div>

    <!-- Its own root condition, so it must re-state the loading/error guards or a role
         change renders the skeleton and the stale table at once. -->
    <div v-if="!loading && !error && items.length" class="hidden md:block bg-card border border-rule rounded-card overflow-hidden mt-8">
      <!-- Scroll the table rather than clip it; the outer overflow-hidden only rounds
           the corners at rest. -->
      <div class="overflow-x-auto">
        <table class="w-full min-w-[900px] border-collapse">
          <!-- Off the response, not a literal: the server owns the page size. -->
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
            <!-- Same near-white row wash the decision queue uses. -->
            <tr
              v-for="u in items" :key="u.id"
              class="border-b border-sunken last:border-b-0 hover:bg-paper
                     transition-colors duration-[var(--duration-instant)] ease-out-soft"
            >
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
              <!-- The unverified case carries an action, so it gets the badge and the
                   waiting date; a verified account is quiet text. -->
              <td class="py-[18px] px-3">
                <span v-if="u.is_verified" class="t-label text-ink-45">Verified</span>
                <template v-else>
                  <AdminUserBadge label="Unverified" tone="pending" dot />
                  <span class="t-label text-ink-45 block mt-1">Added {{ relativeTime(u.created_at) }}</span>
                </template>
              </td>
              <td class="py-[18px] px-3">
                <span v-if="auth.user?.id === u.id" class="t-label text-ink-45 block text-right">Your account</span>
                <AdminRoleControl v-else-if="auth.isVerified" :user="u" @changed="load" />
                <span v-else class="t-label text-ink-45 block text-right" aria-hidden="true">—</span>
              </td>
              <td class="py-[18px] pl-3 pr-6 text-right">
                <AdminReinviteButton v-if="!u.is_verified && auth.isVerified" :user="u" />
                <span v-else class="t-label text-ink-45" aria-hidden="true">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Outside both layouts so one control serves both. Without it the 16th account
         is invisible, which here means unmanageable. -->
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
