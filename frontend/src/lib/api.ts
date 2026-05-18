import axios, { AxiosError } from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  withCredentials: true,
  timeout: 15000,
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status
    if (status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname
      if (!path.startsWith('/login') && path !== '/') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

interface ApiErrorPayload {
  success: false
  error: string
  code?: string
}

export function getErrorMessage(err: unknown, fallback = 'Terjadi kesalahan. Silakan coba lagi.'): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const ax = err as AxiosError<ApiErrorPayload>
    return ax.response?.data?.error ?? fallback
  }
  return fallback
}
