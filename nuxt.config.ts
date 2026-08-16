import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-08-14',

  // Every API call originates in the browser, so there is no server runtime
  // and `npm run generate` emits a purely static bundle.
  ssr: false,

  modules: ['@pinia/nuxt', '@nuxt/fonts'],
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },

  fonts: {
    families: [
      { name: 'Instrument Serif', provider: 'google', weights: [400] },
      { name: 'IBM Plex Sans', provider: 'google', weights: [400, 500, 600] },
      { name: 'IBM Plex Mono', provider: 'google', weights: [400, 500] },
    ],
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api',

      // Reverb, as the BROWSER reaches it. The API reaches the same server by
      // its compose hostname on the internal network, so the backend's
      // REVERB_HOST/REVERB_PORT are different values for the same thing —
      // see the backend's .env.example.
      //
      // The app key is not a secret: it identifies the application in the
      // socket handshake and is meant to reach the client. The app *secret*
      // never leaves the server, and joining a private channel still needs a
      // signed /broadcasting/auth response that only the server can produce.
      reverbKey: process.env.NUXT_PUBLIC_REVERB_KEY || 'pr-local-app-key',
      reverbHost: process.env.NUXT_PUBLIC_REVERB_HOST || 'localhost',
      // Must track the backend's REVERB_HOST_PORT, which is the host-side
      // mapping — not its REVERB_PORT, which is the container-side one.
      reverbPort: Number(process.env.NUXT_PUBLIC_REVERB_PORT || 8080),
      reverbScheme: process.env.NUXT_PUBLIC_REVERB_SCHEME || 'http',
    },
  },

  devServer: { port: 3000 },
  app: { head: { title: 'Proposal Review', htmlAttrs: { lang: 'en' } } },
})
