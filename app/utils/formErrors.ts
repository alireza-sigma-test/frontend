/**
 * `errors.value = err.errors` only makes a field error visible if some
 * input on the page actually reads that key. A server rule the form does
 * not render — a field this page has no input for, or the map being empty
 * entirely (429s and 5xx carry no field errors) — would otherwise vanish
 * with nothing shown anywhere. Toast the response message whenever that's
 * the case; known fields still render inline via `errors.value` regardless.
 *
 * One shared helper rather than three copies of the same conditional: all
 * three call sites (login, register, proposal submission) had the same
 * latent bug — the old check only toasted when the map was completely
 * empty — because they all grew from the same brief snippet.
 */
export function reportUnhandledErrors(err: ApiError, knownFields: string[], push: ReturnType<typeof useToast>['push']) {
  const keys = Object.keys(err.errors)
  const allHandled = keys.length > 0 && keys.every(k => knownFields.includes(k))
  if (!allHandled) push(err.message, 'error')
}
