import type { Role } from '~/types/api'

declare module 'vue-router' {
  interface RouteMeta {
    roles?: Role[]
  }
}

export {}
