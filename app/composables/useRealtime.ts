import type { Status } from '~/types/api'

/** The payload every broadcast event carries — docs/design/API.md §06. It is
 *  deliberately thin: a private channel is authorized once at subscribe time,
 *  so everything here reaches every subscriber on a role channel. A screen that
 *  needs more than this refetches the one record it needs. */
export interface RealtimeEvent {
  type: 'proposal.created' | 'proposal.updated' | 'proposal.status_changed' | 'review.created'
  proposal: { id: number, ref: string, title: string, status: Status }
  actor: { id: number, name: string, initials: string }
  occurred_at: string
}

type Handlers = Partial<Record<RealtimeEvent['type'], (event: RealtimeEvent) => void>>

/**
 * Subscribe to private channels for the lifetime of the calling component.
 *
 * Pages never touch Echo directly. Two reasons: every subscription is torn down
 * on unmount here rather than in each page's own `onBeforeUnmount` (one
 * forgotten teardown is a channel that keeps firing handlers against a
 * destroyed component), and `$echo` returns null with no socket, so the
 * null-check lives in one place instead of at every call site.
 *
 * Callers get no signal about whether a socket exists, on purpose. A screen
 * that behaves differently with the socket down is a screen that depends on it.
 */
export function useRealtime(channels: string | string[], handlers: Handlers): void {
  const { $echo } = useNuxtApp()
  const names = Array.isArray(channels) ? channels : [channels]

  // Custom broadcastAs() names arrive with a leading dot in Echo's listen();
  // without it Echo prefixes the app namespace and matches nothing at all —
  // silently, since a listener for an event that never fires looks identical
  // to an event that never happened.
  const events = Object.keys(handlers) as RealtimeEvent['type'][]

  onMounted(() => {
    for (const name of names) {
      const channel = $echo.private(name)
      if (!channel) continue

      for (const event of events) {
        channel.listen(`.${event}`, (payload: RealtimeEvent) => handlers[event]?.(payload))
      }
    }
  })

  onBeforeUnmount(() => names.forEach(name => $echo.leave(name)))
}

/** The channel names from API.md §06. Built here rather than typed as string
 *  literals at each call site, so a renamed channel is one edit and a typo is
 *  a compile error rather than a subscription that silently never fires. */
export const channels = {
  user: (id: number) => `user.${id}`,
  reviewers: 'role.reviewer',
  admins: 'role.admin',
} as const

/**
 * Every channel the signed-in user is entitled to, per API.md §06's table.
 *
 * A plain function, not a computed: `auth.global.ts` awaits `restore()` before
 * any guarded navigation resolves, so the user is already known by the time a
 * page's setup runs, and `useRealtime()` subscribes once on mount either way.
 * Wrapping it in a computed and reading `.value` would only look reactive.
 *
 * Returns nothing when the user is unknown — `restore()` leaves the token in
 * place if `GET /me` fails for any reason other than a 401, so `auth.user` can
 * legitimately be null with a token present. No user, no channels, no crash.
 */
export function myChannels(): string[] {
  const auth = useAuthStore()
  const names: string[] = []

  if (!auth.user) return names

  names.push(channels.user(auth.user.id))
  if (auth.role === 'reviewer') names.push(channels.reviewers)
  if (auth.role === 'admin') names.push(channels.admins)

  return names
}
