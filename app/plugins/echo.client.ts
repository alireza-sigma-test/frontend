import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import type { Channel as EchoChannel } from 'laravel-echo'
import type Channel from 'pusher-js/types/src/core/channels/channel'
import type { ChannelAuthorizationCallback, ChannelAuthorizationData } from 'pusher-js/types/src/core/auth/options'

/**
 * The websocket connection, and nothing else.
 *
 * `.client.ts` is a statement of intent rather than a necessity — this app is
 * `ssr: false`, so every plugin is already client-only. It says out loud that
 * nothing here may ever run on a server.
 *
 * **Real-time is an enhancement, never a dependency.** Every screen fetches its
 * own data and works with this file doing nothing at all. That is not an
 * accident of the implementation, it is the contract: if Reverb is down, the
 * app must behave exactly as it did before this feature existed. So every path
 * below either succeeds or logs and returns — none of them throw, and none of
 * them block a render.
 *
 * Two things about the socket-down path, both measured rather than assumed:
 *
 *   * The browser writes `WebSocket connection to 'ws://…' failed:
 *     ERR_CONNECTION_REFUSED` to the console itself, per attempt. That is the
 *     WebSocket API's own log, like a failed image, and **no JavaScript can
 *     suppress it** — it is not thrown, not passed to a handler, and does not
 *     reach pusher-js at all. Console errors here are expected noise, not a
 *     defect. Every screen still renders; verified across all five.
 *   * pusher-js keeps retrying with backoff, and that is left alone
 *     deliberately. A reviewer's list opened while Reverb was down reconnected
 *     on its own once it came back and received the next event without a
 *     reload (`.superpowers/harness/socket-recovery.mjs`). Capping the retries
 *     would trade that recovery for slightly quieter devtools.
 */

type EchoClient = Echo<'reverb'>

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public
  const auth = useAuthStore()

  let echo: EchoClient | null = null

  function connect(): void {
    if (echo || !auth.token) return

    try {
      // pusher-js reads this off the global rather than taking it as an
      // argument. Assigning it is part of laravel-echo's documented setup, not
      // a shortcut.
      ;(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher

      echo = new Echo({
        broadcaster: 'reverb',
        key: config.reverbKey,
        wsHost: config.reverbHost,
        wsPort: config.reverbPort,
        wssPort: config.reverbPort,
        forceTLS: config.reverbScheme === 'https',
        enabledTransports: ['ws', 'wss'],

        // Echo's default authorizer POSTs to /broadcasting/auth with cookies.
        // This application has no session — it authenticates with Sanctum
        // bearer tokens — so the default would arrive unauthenticated and
        // every private channel would 401. Hence a custom authorizer.
        authorizer: (channel: Channel) => ({
          // pusher-js calls this back as (error: Error | null, data) — not
          // (boolean, data), which is what most Echo examples show and what
          // TypeScript rejects here.
          authorize: (socketId: string, callback: ChannelAuthorizationCallback) => {
            // Deliberately NOT useApi(): that helper clears the token and
            // redirects to /login on any 401, which is right for a user action
            // and wrong for a background socket. A channel this browser is not
            // entitled to must fail quietly, not sign the user out.
            $fetch<ChannelAuthorizationData>('/broadcasting/auth', {
              // apiBase ends in /api; /broadcasting/auth is a framework route
              // that sits outside it.
              baseURL: config.apiBase.replace(/\/api\/?$/, ''),
              method: 'POST',
              headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${auth.token}`,
              },
              body: { socket_id: socketId, channel_name: channel.name },
            })
              .then(data => callback(null, data))
              .catch((error: Error) => {
                console.warn(`[echo] refused on ${channel.name}`, error)
                callback(error, null)
              })
          },
        }),
      }) as EchoClient
    }
    catch (error) {
      // A failure here means no live updates. It must never mean no app.
      console.warn('[echo] could not start; continuing without real-time', error)
      echo = null
    }
  }

  function disconnect(): void {
    // A socket that outlives the session keeps delivering to a signed-out
    // browser — the connection was authorized once, and nothing re-checks it.
    try {
      echo?.disconnect()
    }
    catch (error) {
      console.warn('[echo] disconnect failed', error)
    }
    echo = null
  }

  // Drive the socket off `auth.token`, not off a login callback: `restore()`
  // sets the token during boot from localStorage, and logout clears it. One
  // watcher covers sign-in, page reload and sign-out without three call sites
  // remembering to fire.
  watch(() => auth.token, token => (token ? connect() : disconnect()), { immediate: true })

  return {
    provide: {
      echo: {
        /**
         * A private channel, or null when there is no socket. Callers must
         * handle null — that is the socket-down path, and it is the normal
         * path in a deployment without Reverb.
         */
        private(name: string): EchoChannel | null {
          if (!echo) return null
          try {
            return echo.private(name)
          }
          catch (error) {
            console.warn(`[echo] could not join ${name}`, error)
            return null
          }
        },

        leave(name: string): void {
          try {
            echo?.leave(name)
          }
          catch { /* leaving a channel we never joined is not an error */ }
        },

        get connected(): boolean {
          return echo !== null
        },
      },
    },
  }
})
