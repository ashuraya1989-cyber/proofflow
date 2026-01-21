import apiClient from './client'

export interface Share {
  id: string
  album_id: string
  album_name: string
  token: string
  share_url: string
  include_subfolders: boolean
  custom_message?: string
  expires_at?: string
  is_active: boolean
  view_count: number
  created_at: string
  last_accessed_at?: string
}

export interface ShareCreate {
  album_id: string
  password: string
  include_subfolders?: boolean
  expires_in_days?: number
  custom_message?: string
}

export interface ClientShareInfo {
  album_name: string
  custom_message?: string
  image_count: number
  requires_password: boolean
}

export interface ShareAccessResponse {
  valid: boolean
  album_name?: string
  custom_message?: string
  access_token?: string
  error?: string
}

export const sharesApi = {
  getShares: async (albumId?: string): Promise<Share[]> => {
    const params = albumId ? { album_id: albumId } : {}
    const response = await apiClient.get<Share[]>('/shares', { params })
    return response.data
  },
  
  getShare: async (id: string): Promise<Share> => {
    const response = await apiClient.get<Share>(`/shares/${id}`)
    return response.data
  },
  
  createShare: async (data: ShareCreate): Promise<Share> => {
    const response = await apiClient.post<Share>('/shares', data)
    return response.data
  },
  
  deactivateShare: async (id: string): Promise<void> => {
    await apiClient.post(`/shares/${id}/deactivate`)
  },
  
  deleteShare: async (id: string): Promise<void> => {
    await apiClient.delete(`/shares/${id}`)
  },
}

// Client-side API (no auth required)
export const clientApi = {
  getShareInfo: async (token: string): Promise<ClientShareInfo> => {
    const response = await apiClient.get<ClientShareInfo>(`/client/share/${token}`)
    return response.data
  },
  
  accessShare: async (token: string, password: string): Promise<ShareAccessResponse> => {
    const response = await apiClient.post<ShareAccessResponse>(
      `/client/share/${token}/access`,
      { password }
    )
    return response.data
  },
  
  getGalleryImages: async (
    token: string,
    accessToken: string,
    skip = 0,
    limit = 50
  ): Promise<{ id: string; thumbnail_url: string; original_url: string }[]> => {
    const response = await apiClient.get(`/client/gallery/${token}/images`, {
      params: { skip, limit },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    return response.data
  },
  
  getGalleryImageCount: async (token: string, accessToken: string): Promise<number> => {
    const response = await apiClient.get<{ count: number }>(
      `/client/gallery/${token}/count`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
    return response.data.count
  },
}
