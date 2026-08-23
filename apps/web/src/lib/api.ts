import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'

/** Local Vite proxies `/api` → Nest. Production: set `VITE_API_URL` (e.g. https://asanop-api.onrender.com/api). */
const baseURL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api'

const api = axios.create({
  baseURL,
})

type CacheEntry = {
  expiresAt: number
  response: AxiosResponse<unknown>
}

const responseCache = new Map<string, CacheEntry>()
const inFlightGets = new Map<string, Promise<AxiosResponse<unknown>>>()
const DEFAULT_CACHE_TTL_MS = 20_000

function cacheKey(url: string, config?: AxiosRequestConfig) {
  const workspace = localStorage.getItem('asanop_workspace') ?? ''
  const params = config?.params ? JSON.stringify(config.params) : ''
  return `${workspace}|${url}|${params}`
}

/**
 * Short-lived, tab-local GET cache with request de-duplication.
 * Mutations and session changes clear it, so cached workspace data cannot
 * survive a write or leak into another signed-in session.
 */
export async function cachedGet<T>(
  url: string,
  config?: AxiosRequestConfig & { cacheTtlMs?: number; forceRefresh?: boolean },
): Promise<AxiosResponse<T>> {
  const { cacheTtlMs = DEFAULT_CACHE_TTL_MS, forceRefresh = false, ...axiosConfig } = config ?? {}
  const key = cacheKey(url, axiosConfig)
  const now = Date.now()
  const cached = responseCache.get(key)

  if (!forceRefresh && cached && cached.expiresAt > now) {
    return cached.response as AxiosResponse<T>
  }

  if (!forceRefresh) {
    const pending = inFlightGets.get(key)
    if (pending) return pending as Promise<AxiosResponse<T>>
  }

  const request = api.get<T>(url, axiosConfig).then((response) => {
    responseCache.set(key, {
      expiresAt: Date.now() + Math.max(0, cacheTtlMs),
      response: response as AxiosResponse<unknown>,
    })
    return response
  }).finally(() => {
    inFlightGets.delete(key)
  })

  inFlightGets.set(key, request as Promise<AxiosResponse<unknown>>)
  return request
}

export function clearMemoryCache() {
  responseCache.clear()
  inFlightGets.clear()
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('asanop_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    if (response.config.method?.toLowerCase() !== 'get') {
      clearMemoryCache()
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('asanop_token')
      localStorage.removeItem('asanop_user')
      const path = window.location.pathname
      if (
        !path.startsWith('/login') &&
        !path.startsWith('/register') &&
        !path.startsWith('/f/') &&
        !path.startsWith('/invite/')
      ) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api
