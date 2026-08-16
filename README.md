# Proposal Review — Frontend

Nuxt 4 single-page app for the talk-proposal review API: speakers submit
proposals, reviewers rate and comment, administrators decide status.

Backend: `../backend` in this same submission (see its own `README.md`) —
**start it first**, this app has nothing to render without it.

## Run it

```bash
cd ../backend  && make up              # API on :8000 (Docker) — start this first
cd ../frontend && npm ci && make dev   # SPA on :3000
```

`make dev` and `make build` both copy `.env.example` to `.env` on first run if
it's missing, so a clean clone needs no manual setup beyond `npm ci`.

For a production-shaped run instead of the dev server:

```bash
make preview   # generates the static bundle, then serves .output/public on :3000
```

| Command | What it does |
|---|---|
| `make dev` | Dev server with hot reload on :3000 |
| `make build` | Generate the static bundle into `.output/public` |
| `make preview` | Build, then serve the bundle on :3000 with an SPA fallback |
| `make lint` | Type-check (`nuxi typecheck`) |

## Configuration

One variable, in `.env` (already set in `.env.example` for the default
`docker compose` port):

```
NUXT_PUBLIC_API_BASE=http://localhost:8000/api
```

## Seeded accounts

All passwords are `password`.

| Email | Role |
|---|---|
| `dana@example.com` | speaker |
| `maya@example.com` | reviewer |
| `alex@example.com` | admin |

## Email verification and admin-managed accounts

Three routes join the original five screens:

- **`/verify-email`** — the only way out of "unverified." An authenticated
  user who registered self-service lands here, or follows the persistent
  banner (`components/user/VerificationBanner.vue`) from anywhere else in
  the app. `POST /email/verify` takes the six-digit code and returns the
  updated user; `auth.setUser()` applies it in place, so the banner and
  every `can`-driven control clear without a reload. "Send a new code"
  reissues (`POST /email/resend`) and invalidates whatever code came before.
- **`/invite/accept`** — **public**, alongside `/login` and `/register` in
  `middleware/auth.global.ts`'s `PUBLIC` array. An invitee has no password
  yet, so the default redirect-to-`/login` would be a dead end they could
  never leave. Email, the 12-character invite code and a new password go to
  `POST /invites/accept`, which returns `{ token, user }` and signs them in
  directly — no separate login step.
- **`/admin/users`** — admin-only, gated the same way as `/admin/decisions`
  (`middleware: 'role', roles: ['admin']`). A paginated directory of every
  account, an "Invite a user" modal offering all three roles, an inline
  role control per row, and a "Re-invite" action for accounts still
  unverified. The API refuses to let an admin change their own role or
  demote the last remaining admin — both refusals surface as the server's
  own message rather than a client-side guess.

Both kinds of code are plain text in the outgoing email, and nothing here is
delivered to a real mailbox. Read them at **Mailpit**,
`http://localhost:8025` (the backend's `make up` already starts it): register
an account or send an invite, open Mailpit, copy the code. That's what makes
both flows explorable end to end without configuring real SMTP.

### Where this deviates from the approved design

Every other screen in this project was built against a real mockup
(`../docs/design/app-screens.html`). These two were not:

1. **`register.vue` offers two role options where the mockup shows three.**
   `POST /register` now rejects `role: admin` with a `422` — administrators
   are created by administrators, from `/admin/users` — so the third option
   would be a choice that cannot succeed. The full three-role choice still
   exists; it just moved to the invite modal.
2. **Screen 07 (`/admin/users`) has no mockup at all** — it isn't one of the
   five screens this project was scoped against. It was composed from
   screen 05's (`/admin/decisions`) established patterns instead — the same
   table-above-`md`/cards-below layout, `UiBadge`, `UiModal`, and the
   existing button variants — rather than a new visual design.

## Architecture

`ssr: false` — every request originates in the browser, so `npm run generate`
emits a purely static bundle with no Node process behind it. That is also why
the two repos boot independently and never share a network: there is no
server-to-server hop to arrange, and it's why there is deliberately no
Dockerfile here — the backend is containerised because it pins a PHP version,
native extensions and a database; this needs only Node, which anyone building
it already has.

**Deploying it** means serving `.output/public` from any static host, with one
requirement: unknown paths must fall back to `index.html`. Routing is
client-side, so `/proposals/1` is not a file on disk. `make preview` uses
`serve -s`, which does this; a real host needs one rewrite rule for it.

- **Design tokens before components.** The palette, borders, type scale,
  radii and the one shadow live in `app/assets/css/main.css` as Tailwind v4
  `@theme` tokens — there is no `tailwind.config.js`. No component
  hard-codes a colour; there are exactly seven named type styles (`t-display`
  … `t-eyebrow`) because the design system defines seven, not eight. A few
  tokens carry a comment naming the near-miss they were added to replace
  (e.g. `rule-mid` vs `rule`/`rule-strong`) — that's intentional documentation
  of a design decision, not dead code.
- **Filters live in the URL.** `/proposals?search=…&tags=…&status=…` is
  shareable and the back button works; the search box is debounced 300 ms
  before it becomes a URL change (and therefore a request).
- **Per-proposal permissions come from the API; role only gates what's
  offered.** Every proposal carries `can: { edit, review, change_status }`,
  generated server-side from the same policies that gate the mutating
  routes — the client renders every proposal-level action from `can`, never
  by inferring what a `speaker` or `admin` should be allowed to do. Role
  *does* gate route-level access — the nav links, the "Submit a proposal"
  button, `middleware/role.ts` — but that's convenience only, deciding what's
  *offered* rather than what's *possible*: the server enforces the same
  rules independently either way (`ProposalPolicy::create` requires speaker,
  `changeStatus` requires admin, regardless of what the client shows), so it
  is authoritative in both cases.
- **Validation is the server's job.** The client mirrors only the cheap,
  synchronous checks (required, length, PDF mime, 4 MB) so obviously-bad
  input never leaves the browser; the server's `422` is still authoritative
  and its `{ field: [message] }` map binds straight to the matching input.

### State: Pinia stores + `useApi`

`app/composables/useApi.ts` wraps `$fetch` with the bearer token, JSON
headers (skipped for uploads, so the browser sets the multipart boundary),
and one error path: a `401` clears the session and redirects to `/login`;
everything else becomes a typed `ApiError { status, message, errors }` the
caller decides how to show.

**There is no generic envelope unwrapper**, because the API doesn't have one
envelope — it has three, and a single `unwrap()` would have to guess which
one it just received:

| Shape | Example | Store |
|---|---|---|
| Flat object | `GET /me` → `User`; `POST /login` → `{ token, user }` | `stores/auth.ts` |
| `{ data: T[] }` | `GET /tags` | `stores/tags.ts` |
| `{ data, meta, counts }` | `GET /proposals` | `stores/proposals.ts` |

Each store's action types its own response and reads it directly — three
call sites, three known shapes, no runtime shape-sniffing. `stores/proposals.ts`
also tags each request with a sequence number so a fast filter change can't
let a slow, stale response clobber a newer one; `stores/tags.ts` shares a
single in-flight request across simultaneous mounts (the mobile filter
disclosure and the desktop sidebar are both real, mounted-at-once instances).

**Two pages deliberately skip the store layer.** `pages/proposals/[id].vue`
holds `proposal`/`loading`/`notFound`/`error` as local `ref`s and calls
`useApi()` directly, instead of going through a Pinia store like the other
two data screens do — it fetches a single resource nobody else on the page
shares, so there's no state to coordinate across components and a store
would add a layer for nothing. `pages/admin/users.vue` does the same for the
same reason: nothing else on screen shares its list, and its `{ data, meta }`
response has no equivalent in `types/api.ts`'s `Paginated<T>` (which also
carries the proposal list's `counts` block), so it gets its own local
interface rather than a loosened shared one.

### Auth and role guards

- `stores/auth.ts` holds the Sanctum token and user in memory, mirrored to
  `localStorage` under `pr.token` so a refresh survives; `restore()` re-hydrates
  from the stored token and re-fetches `/me` once per page load.
- `middleware/auth.global.ts` runs on every navigation: unauthenticated users
  are sent to `/login`, and an authenticated user hitting `/login` or
  `/register` is bounced to `/proposals`. `/invite/accept` is the one other
  exception in its `PUBLIC` array — an invitee has no password yet, so
  leaving it gated would be a dead end.
- `middleware/role.ts` is opt-in per page — `definePageMeta({ middleware:
  'role', roles: ['admin'] })` — and is what actually keeps `/proposals/new`
  to speakers and `/admin/decisions` and `/admin/users` to admins. The nav
  links are also conditioned on the same role check, so there's no dead link
  inviting a role into a page it'll immediately be redirected out of.
- `app/types/router.d.ts` augments Vue Router's `RouteMeta` with `roles?:
  Role[]`, so the middleware reads `to.meta.roles` typed, no cast.
- An authenticated-but-unverified user isn't middleware-gated to a single
  route; `auth.isVerified` instead swaps content in place — the persistent
  banner in `default.vue`, and an empty-state prompt instead of the form on
  `/proposals/new` — because a redirect away from a page the user
  deliberately opened would be disorienting, and the server enforces the
  real gate on every mutating route regardless of what the client shows.

### Project layout

```
app/
  components/
    admin/      InviteUserModal, ReinviteButton, RoleControl, UserBadge
    proposal/   ProposalCard, ProposalFilters, ReviewForm, ReviewList, StatusControl
    ui/         Buttons, inputs, cards, modal, toast, skeleton, pagination — the design-system primitives
    user/       VerificationBanner
  composables/  useApi (HTTP), useToast (notifications), useProposalFilters
                (URL-query filters), useResultAnnouncer (shared live region)
  layouts/      auth.vue (split marketing panel), default.vue (header + nav)
  middleware/   auth.global.ts (session gate), role.ts (per-page role gate)
  pages/        login, register, verify-email, invite/accept, proposals/index,
                proposals/new, proposals/[id], admin/decisions, admin/users
  stores/       auth, proposals, tags — Pinia
  types/        api.ts (server resource shapes), router.d.ts (RouteMeta augmentation)
  utils/        formErrors.ts (422 → field vs. toast), time.ts (relative timestamps)
```

Nine page files now. The original five screens still account for six of
them — sign-in and register are one screen, two routes: the review list,
submit, the proposal detail with review posting, and the admin decision
queue round out the other four. `/verify-email` and `/invite/accept` are new
routes rather than additional numbered screens; `/admin/users` is screen 07
— see the deviations noted above.

## Known limitation: concurrent status decisions

Two admins acting on the same proposal can silently overwrite each other.
The API exposes no version or expected-prior-status token, so a stale view
submitting a *different* valid transition lands as a genuine second change
with no conflict signal. The frontend detects only the identical-status
no-op (the API returns `200` with `changed_at: null` in that case, which the
UI reports as "nothing changed" rather than a real decision — see
`StatusControl.vue`). The mitigation shipped is an unconditional reload after
every decision, so the queue at least reflects the latest server state a
moment later.

Fixing it properly needs an API change — an `If-Match`-style version or an
expected-prior-status field on `PATCH /proposals/{id}/status` — not something
addressable from the client alone.

## Not built

**Nothing on screen is mocked.** Every value in every screenshot a reviewer
takes is real data from the live backend; that's a deliberate choice, not an
oversight, and it's why the gaps below are absences rather than stand-ins.

- **Screen 06 ("Live updates")** — notifications and the activity feed — is
  not implemented. It was never one of the five screens in this task's
  scope; it needs Laravel Reverb, a later backend tier.
- **No rating-distribution bars on the detail screen.** The average and
  review count render; the per-star breakdown doesn't. `GET
  /proposals/{id}` does return a `rating_distribution` field (verified
  live) — the client just doesn't read it: neither `ProposalDetail` in
  `types/api.ts` nor the detail page consumes it yet.
- **No Edit control on a proposal.** `can.edit` is `true` for the author
  while the proposal is still pending — the policy is owner *and* pending,
  not owner alone — but there's no edit form wired up to call it.
  `PATCH /proposals/{id}` exists on the API (`routes/api.php`, verified
  live); the client simply never built the button for it.
- **The admin queue's counters come from `/proposals`' own `counts`
  block, not `GET /stats`.** The endpoint exists (verified live —
  `total`/`pending`/`approved`/`rejected`/`ready_to_decide`), but `counts`
  is unaffected by the queue's own status/sort filter, which made it the
  simpler source for a stable total; nothing on this screen calls `/stats`.
- **No delete or deactivate control on `/admin/users`.** Roles can be
  changed but accounts persist — removing one raises a real cascade question
  (orphan, reassign or soft-delete its proposals and reviews) that's larger
  than this tier and was scoped out deliberately.

## Tests

None, deliberately. The backend carries the whole suite (124 tests); a thin
component suite here would have cost time without covering the logic that
actually matters — server-side policies, validation and status transitions.
Stated as a decision rather than left as a gap.
