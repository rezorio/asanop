import axios from 'axios'

/** Local Vite proxies `/api` → Nest. Production: set `VITE_API_URL` (e.g. https://asanop-api.onrender.com/api). */
const baseURL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api'

const api = axios.create({
  baseURL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('asanop_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
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
