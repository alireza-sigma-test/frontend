// Announces a summary into a live region whenever `loading` finishes, but only for
// user-driven transitions — the first loading→loaded is the page's initial load, so it
// is skipped. `onSettled` fires on the same transition, for moving DOM focus after a
// mutation reshuffles the content.
//
// suppressOnce() exists because a websocket push can trigger the same refetch a click
// does, and moving focus because a *different* user acted is focus theft. Announcing is
// still right; grabbing focus is not.
export function useResultAnnouncer(loading: () => boolean, summary: () => string, onSettled?: () => void) {
  const announcement = ref('')
  let pastInitialLoad = false
  let skipNextFocus = false

  // flush: 'post' because onSettled moves DOM focus, and the loading branch remounts
  // the element being focused — pre-flush would focus a stale node.
  watch(loading, (isLoading) => {
    if (isLoading) return
    if (!pastInitialLoad) { pastInitialLoad = true; return }
    announcement.value = summary()
    if (skipNextFocus) { skipNextFocus = false; return }
    onSettled?.()
  }, { flush: 'post' })

  return Object.assign(announcement, {
    suppressOnce() { skipNextFocus = true },
  })
}
