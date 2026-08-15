/**
 * Every timestamp the design shows anywhere — the card list, the detail
 * page's "Submitted …" caption, each review's date — is relative ("2 days
 * ago", "yesterday"-ish), never an absolute date until it's old enough that
 * relative phrasing stops being useful. Originally written once inline in
 * ProposalCard.vue; screen 04 needs the exact same formatting in two more
 * places (the proposal's own submitted-date and every review's date), so it
 * now lives here instead of being copied a third time with a drifted format.
 */
export function relativeTime(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}
