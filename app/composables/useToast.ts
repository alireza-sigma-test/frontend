export interface Toast { id: number; message: string; tone: 'info' | 'error' }

const toasts = ref<Toast[]>([])
let nextId = 1

export function useToast() {
  function push(message: string, tone: Toast['tone'] = 'info') {
    const id = nextId++
    toasts.value.push({ id, message, tone })
    // The design says toasts dismiss after 6s and never carry the only copy
    // of an action.
    setTimeout(() => dismiss(id), 6000)
  }
  function dismiss(id: number) { toasts.value = toasts.value.filter(t => t.id !== id) }
  return { toasts, push, dismiss }
}
