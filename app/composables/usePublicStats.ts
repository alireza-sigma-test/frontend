export interface PublicStats { proposals_this_year: number; reviewers: number }

export function usePublicStats() {
  const stats = ref<PublicStats | null>(null)

  // Deliberately swallows its error. This feeds a decorative panel on the
  // sign-in screen; if the call fails, the panel hides and the user signs in
  // as normal. A toast here would put an API error in front of someone who
  // has not even authenticated yet.
  async function load() {
    try { stats.value = await useApi().get<PublicStats>('/public-stats') }
    catch { stats.value = null }
  }

  return { stats, load }
}
