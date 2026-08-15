// A visually-hidden, always-mounted live region announces a short summary
// whenever a watched `loading` flag finishes — but only for a transition
// caused by something the user did (a filter change, a decision, a retry,
// a review save). The very first loading→loaded transition is the page's
// own initial load, not a user action, so it's deliberately skipped rather
// than announced. `onSettled`, when given, fires on that same user-driven
// transition — the natural hook for moving DOM focus somewhere sensible
// after a mutation reshuffles or remounts the content (see `UiButton`-less
// callers in decisions.vue and proposals/[id].vue).
export function useResultAnnouncer(loading: () => boolean, summary: () => string, onSettled?: () => void) {
  const announcement = ref('')
  let pastInitialLoad = false
  // `flush: 'post'`: `onSettled` moves DOM focus, and on proposals/[id].vue
  // the loading branch unmounts/remounts the very element being focused —
  // the default pre-flush timing would run this before that DOM patch
  // lands, focusing a stale (or not-yet-existing) node.
  watch(loading, (isLoading) => {
    if (isLoading) return
    if (!pastInitialLoad) { pastInitialLoad = true; return }
    announcement.value = summary()
    onSettled?.()
  }, { flush: 'post' })
  return announcement
}
