import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios'

// API Gateway base URL defaults to http://localhost:5000 per prompt specification
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 20000,
})

// Request interceptor for optional token if configured
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('crimegraph_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response error handler
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // We do NOT hide errors or silently redirect unless specifically unauthorized
    return Promise.reject(error)
  }
)

/**
 * Extracts data robustly across different backend response conventions:
 * - Direct array/object
 * - Wrapped in { data: ... }
 * - Paginated in { items: ... } or { results: ... }
 */
export function extractData<T>(res: AxiosResponse<any>, fallback: T): T {
  if (!res || res.data === undefined || res.data === null) {
    return fallback
  }

  const payload = res.data

  // If payload is already the expected array or matches fallback type
  if (Array.isArray(fallback)) {
    if (Array.isArray(payload)) return payload as unknown as T
    if (Array.isArray(payload.items)) return payload.items as unknown as T
    if (Array.isArray(payload.data)) return payload.data as unknown as T
    if (Array.isArray(payload.results)) return payload.results as unknown as T
    return fallback
  }

  // If payload has a data property (standard envelope)
  if (payload.data !== undefined && typeof payload.data === 'object' && payload.data !== null) {
    return payload.data as T
  }

  return payload as T
}

/**
 * Cleanly formats API error messages for UI display
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (typeof data === 'string') return data
    if (data?.detail) {
      if (typeof data.detail === 'string') return data.detail
      if (Array.isArray(data.detail)) {
        return data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ')
      }
    }
    if (data?.message) return String(data.message)
    if (data?.error) return String(data.error)
    if (error.code === 'ERR_NETWORK') {
      return `Cannot connect to API Gateway at ${BASE_URL}. Ensure the server is running on port 5000.`
    }
    return error.message || 'API request failed'
  }
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred'
}
