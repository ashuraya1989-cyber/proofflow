import apiClient from './client'

interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      username,
      password,
    })
    return response.data
  },
}
