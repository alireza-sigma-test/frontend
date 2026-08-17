// /invite/accept must be public: the invitee has no password yet, so /login is a dead
// end they cannot leave.
const PUBLIC = ['/login', '/register', '/invite/accept']

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()

  // One restore per page load, before the first guarded navigation.
  if (!auth.user && !auth.token) await auth.restore()

  if (PUBLIC.includes(to.path)) {
    return auth.isAuthenticated ? navigateTo('/proposals') : undefined
  }
  if (!auth.isAuthenticated) return navigateTo('/login')
})
