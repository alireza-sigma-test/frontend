const PUBLIC = ['/login', '/register']

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()

  // One restore per page load, before the first guarded navigation.
  if (!auth.user && !auth.token) await auth.restore()

  if (PUBLIC.includes(to.path)) {
    return auth.isAuthenticated ? navigateTo('/proposals') : undefined
  }
  if (!auth.isAuthenticated) return navigateTo('/login')
})
