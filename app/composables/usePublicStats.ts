export interface PublicStats { proposals_this_year: number; reviewers: number }

export function usePublicStats() {
  const stats = ref<PublicStats | null>(null)

  // Swallows its error on purpose: this feeds a decorative panel on the sign-in
  // screen, and a toast would put an API error in front of a signed-out visitor.
  async function load() {
    try { stats.value = await useApi().get<PublicStats>('/public-stats') }
    catch { stats.value = null }
  }

  return { stats, load }
}
