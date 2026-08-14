import type { Role } from '~/types/api'

/** Usage: definePageMeta({ middleware: 'role', roles: ['admin'] }) */
export default defineNuxtRouteMiddleware((to) => {
  const roles = (to.meta.roles ?? []) as Role[]
  if (roles.length === 0) return

  const auth = useAuthStore()
  if (!auth.role || !roles.includes(auth.role)) {
    return navigateTo('/proposals')
  }
})
