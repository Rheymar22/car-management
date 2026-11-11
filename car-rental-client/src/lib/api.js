import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api/v1',
  headers: { 'Accept': 'application/json' },
})

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('auth-storage')
  if (raw) {
    try {
      const { state } = JSON.parse(raw)
      if (state?.token) {
        config.headers.Authorization = 'Bearer ' + state.token
      }
    } catch {}
  }
  return config
})

// Handle 401 — clear storage and redirect to login,
// but NOT when the failing request is the login/register attempt itself
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = error.config?.url?.includes('/login') || error.config?.url?.includes('/register')

    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api