import type { Status } from '~/types/api'

/** The broadcast payload (docs/design/API.md §06), deliberately thin: a role channel
 *  is authorized once, so everything here reaches every subscriber on it. */
export interface RealtimeEvent {
  type: 'proposal.created' | 'proposal.updated' | 'proposal.status_changed' | 'review.created'
  proposal: { id: number, ref: string, title: string, status: Status }
  actor: { id: number, name: string, initials: string }
  occurred_at: string
}

type Handlers = Partial<Record<RealtimeEvent['type'], (event: RealtimeEvent) => void>>

/**
 * Subscribes for the lifetime of the calling component, so pages never touch Echo
 * directly: teardown happens here rather than in each page's own onBeforeUnmount, and
 * the no-socket null check lives in one place.
 *
 * Callers get no signal about whether a socket exists, on purpose — a screen that
 * behaves differently with it down is a screen that depends on it.
 */
export function useRealtime(channels: string | string[], handlers: Handlers): void {
  const { $echo } = useNuxtApp()
  const names = Array.isArray(channels) ? channels : [channels]

  // Custom broadcastAs() names need the leading dot below; without it Echo prefixes
  // the app namespace and silently matches nothing.
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

/** Built here rather than as string literals per call site, so a typo is a compile
 *  error rather than a subscription that silently never fires. */
export const channels = {
  user: (id: number) => `user.${id}`,
  reviewers: 'role.reviewer',
  admins: 'role.admin',
} as const

/**
 * Every channel the signed-in user is entitled to (API.md §06).
 *
 * A plain function, not a computed: auth.global.ts awaits restore() before any guarded
 * navigation resolves, so a computed here would only look reactive. Returns nothing for
 * an unknown user — restore() keeps the token on any non-401 failure, so auth.user can
 * legitimately be null with a token present.
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
