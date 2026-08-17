/**
 * A field error is only visible if some input on the page reads that key, so a rule the
 * form does not render — or an empty map, as 429s and 5xx carry — would vanish with
 * nothing shown. Toast the response message whenever that happens; known fields still
 * render inline regardless.
 */
export function reportUnhandledErrors(err: ApiError, knownFields: string[], push: ReturnType<typeof useToast>['push']) {
  const keys = Object.keys(err.errors)
  const allHandled = keys.length > 0 && keys.every(k => knownFields.includes(k))
  if (!allHandled) push(err.message, 'error')
}
