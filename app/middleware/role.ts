/** Usage: definePageMeta({ middleware: 'role', roles: ['admin'] }) */
export default defineNuxtRouteMiddleware((to) => {
  // `roles` is typed via the RouteMeta augmentation in app/types/router.d.ts — no cast needed.
  const roles = to.meta.roles ?? []
  if (roles.length === 0) return

  const auth = useAuthStore()
  if (!auth.role || !roles.includes(auth.role)) {
    return navigateTo('/proposals')
  }
})
