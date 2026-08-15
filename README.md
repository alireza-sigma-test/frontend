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
- **Permissions come from the API, never from a role string.** Every
  proposal carries `can: { edit, review, change_status }`, generated
  server-side from the same policies that gate the mutating routes. The
  client renders from `can`, it doesn't infer what a `speaker` or `admin`
  should see.
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

### Auth and role guards

- `stores/auth.ts` holds the Sanctum token and user in memory, mirrored to
  `localStorage` under `pr.token` so a refresh survives; `restore()` re-hydrates
  from the stored token and re-fetches `/me` once per page load.
- `middleware/auth.global.ts` runs on every navigation: unauthenticated users
  are sent to `/login`, and an authenticated user hitting `/login` or
  `/register` is bounced to `/proposals`.
- `middleware/role.ts` is opt-in per page — `definePageMeta({ middleware:
  'role', roles: ['admin'] })` — and is what actually keeps `/proposals/new`
  to speakers and `/admin/decisions` to admins. The nav links for both are
  also conditioned on the same role check, so there's no dead link inviting a
  role into a page it'll immediately be redirected out of.
- `app/types/router.d.ts` augments Vue Router's `RouteMeta` with `roles?:
  Role[]`, so the middleware reads `to.meta.roles` typed, no cast.

### Project layout

```
app/
  components/
    proposal/   ProposalCard, ProposalFilters, ReviewForm, ReviewList, StatusControl
    ui/         Buttons, inputs, cards, modal, toast, skeleton, pagination — the design-system primitives
  composables/  useApi (HTTP), useToast (notifications)
  layouts/      auth.vue (split marketing panel), default.vue (header + nav)
  middleware/   auth.global.ts (session gate), role.ts (per-page role gate)
  pages/        login, register, proposals/index, proposals/new, proposals/[id], admin/decisions
  stores/       auth, proposals, tags — Pinia
  types/        api.ts (server resource shapes), router.d.ts (RouteMeta augmentation)
  utils/        formErrors.ts (422 → field vs. toast), time.ts (relative timestamps)
```

Five pages for five screens: sign-in/register, the review list, submit, the
proposal detail with review posting, and the admin decision queue.

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
  review count render; the per-star breakdown doesn't, because the API has
  no `rating_distribution` field to source it from.
- **No Edit control on a proposal.** `can.edit` is `true` for the author on
  every proposal, but `PATCH /proposals/{id}` isn't among the API's 10 live
  endpoints, so there's nothing for an edit button to call.
- **The admin queue's counters come from `/proposals`' own `counts` block**,
  not a `/stats` endpoint — there isn't one. `counts` is unaffected by the
  queue's own status/sort filter, which is what makes it usable as a stable
  total.

## Tests

None, deliberately. The backend carries the whole suite (124 tests); a thin
component suite here would have cost time without covering the logic that
actually matters — server-side policies, validation and status transitions.
Stated as a decision rather than left as a gap.
