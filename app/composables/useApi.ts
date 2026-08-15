import type { ValidationErrors } from '~/types/api'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: ValidationErrors = {},
  ) { super(message) }
}

export function useApi() {
  const config = useRuntimeConfig()
  const auth = useAuthStore()

  async function request<T>(method: string, path: string, body?: unknown, isForm = false): Promise<T> {
    try {
      return await $fetch<T>(path, {
        baseURL: config.public.apiBase,
        method: method as never,
        body: body as never,
        headers: {
          Accept: 'application/json',
          ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
          // Let the browser set multipart boundaries itself.
          ...(isForm ? {} : { 'Content-Type': 'application/json' }),
        },
      })
    } catch (e: unknown) {
      const err = e as { status?: number; data?: { message?: string; errors?: ValidationErrors } }
      const status = err.status ?? 0

      // The token is gone or expired — drop it and send them to sign in.
      if (status === 401) { auth.clear(); await navigateTo('/login'); }

      throw new ApiError(
        status,
        err.data?.message
          ?? (status === 429 ? 'Too many attempts. Wait a minute and try again.' : 'Something went wrong.'),
        err.data?.errors ?? {},
      )
    }
  }

  return {
    get:    <T>(path: string) => request<T>('GET', path),
    post:   <T>(path: string, body?: unknown) => request<T>('POST', path, body),
    patch:  <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
    upload: <T>(path: string, form: FormData) => request<T>('POST', path, form, true),
  }
}
