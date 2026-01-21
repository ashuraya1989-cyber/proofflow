import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/api/auth'

interface AuthState {
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.login(username, password)
          set({
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          })
          return true
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Login failed'
          set({
            error: message,
            isLoading: false,
            isAuthenticated: false,
            token: null,
          })
          return false
        }
      },
      
      logout: () => {
        set({
          token: null,
          isAuthenticated: false,
          error: null,
        })
      },
      
      checkAuth: () => {
        const token = get().token
        if (token) {
          // Token exists, assume authenticated
          // In production, you might want to validate the token
          set({ isAuthenticated: true })
        }
      },
    }),
    {
      name: 'gallery-auth',
      partialize: (state) => ({
        token: state.token,
      }),
    }
  )
)
