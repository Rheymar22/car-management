import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:  null,
      token: null,

      login: async (email, password) => {
        const { data } = await api.post('/login', { email, password })
        api.defaults.headers.common['Authorization'] = 'Bearer ' + data.token
        set({ user: data.user, token: data.token })
        return data.user
      },

      register: async (payload) => {
        const { data } = await api.post('/register', payload)
        api.defaults.headers.common['Authorization'] = 'Bearer ' + data.token
        set({ user: data.user, token: data.token })
        return data.user
      },

      logout: async () => {
        try { await api.post('/logout') } catch {}
        delete api.defaults.headers.common['Authorization']
        set({ user: null, token: null })
      },

      isAdmin: () => get().user?.role === 'admin',
    }),
    { name: 'auth-storage' }
  )
)