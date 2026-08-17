import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import type { Channel as EchoChannel } from 'laravel-echo'
import type Channel from 'pusher-js/types/src/core/channels/channel'
import type { ChannelAuthorizationCallback, ChannelAuthorizationData } from 'pusher-js/types/src/core/auth/options'

/**
 * Real-time is an enhancement, never a dependency: every screen fetches its own data
 * and works with this file doing nothing. So every path here either succeeds or logs
 * and returns — none throw, none block a render.
 *
 * Two notes on the socket-down path. The browser's own ERR_CONNECTION_REFUSED console
 * line cannot be suppressed from JavaScript, so it is expected noise rather than a
 * defect. And pusher-js's retry backoff is left alone deliberately — it is what lets a
 * list opened while Reverb was down recover on its own.
 */

type EchoClient = Echo<'reverb'>

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public
  const auth = useAuthStore()

  let echo: EchoClient | null = null

  // Surfaced so the header can say whether live updates are working: an enhancement
  // that silently is not happening reads as an app that has stopped updating.
  const state = ref<'connected' | 'connecting' | 'offline'>('offline')

  function connect(): void {
    if (echo || !auth.token) return

    try {
      // pusher-js reads this off the global; assigning it is laravel-echo's
      // documented setup, not a shortcut.
      ;(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher

      echo = new Echo({
        broadcaster: 'reverb',
        key: config.reverbKey,
        wsHost: config.reverbHost,
        wsPort: config.reverbPort,
        wssPort: config.reverbPort,
        forceTLS: config.reverbScheme === 'https',
        enabledTransports: ['ws', 'wss'],

        // Echo's default authorizer sends cookies, but this app authenticates with
        // Sanctum bearer tokens, so every private channel would 401.
        authorizer: (channel: Channel) => ({
          // pusher-js calls back as (error, data), not the (boolean, data) most Echo
          // examples show.
          authorize: (socketId: string, callback: ChannelAuthorizationCallback) => {
            // Not useApi(): it signs the user out on any 401, which is right for a
            // user action and wrong for a background socket.
            $fetch<ChannelAuthorizationData>('/broadcasting/auth', {
              // /broadcasting/auth sits outside apiBase's /api prefix.
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

      state.value = 'connecting'
      // Pusher's state machine mapped onto the three words the header can say.
      echo.connector.pusher.connection.bind('state_change', ({ current }: { current: string }) => {
        state.value = current === 'connected'
          ? 'connected'
          : current === 'connecting' ? 'connecting' : 'offline'
      })
    }
    catch (error) {
      // No live updates must never mean no app.
      console.warn('[echo] could not start; continuing without real-time', error)
      echo = null
      state.value = 'offline'
    }
  }

  function disconnect(): void {
    // A socket outliving the session keeps delivering to a signed-out browser: it was
    // authorized once, and nothing re-checks it.
    try {
      echo?.disconnect()
    }
    catch (error) {
      console.warn('[echo] disconnect failed', error)
    }
    echo = null
    state.value = 'offline'
  }

  // Driven off `auth.token` rather than a login callback, so one watcher covers
  // sign-in, page reload and sign-out.
  watch(() => auth.token, token => (token ? connect() : disconnect()), { immediate: true })

  return {
    provide: {
      echo: {
        /** Null when there is no socket — the normal path without Reverb. */
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

        /** Readonly so a component cannot claim a connection the socket lacks. */
        state: readonly(state),
      },
    },
  }
})
