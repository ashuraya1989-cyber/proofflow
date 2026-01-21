import axios, { AxiosInstance, AxiosError } from 'axios'

const BASE_URL = '/api'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage (set by auth store)
    const authData = localStorage.getItem('gallery-auth')
    if (authData) {
      try {
        const { state } = JSON.parse(authData)
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`
        }
      } catch {
        // Ignore parse errors
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      localStorage.removeItem('gallery-auth')
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/gallery/')) {
        window.location.href = '/admin/login'
      }
    }
    
    // Extract error message
    const message = 
      (error.response?.data as { detail?: string })?.detail ||
      error.message ||
      'An error occurred'
    
    return Promise.reject(new Error(message))
  }
)

export default apiClient
