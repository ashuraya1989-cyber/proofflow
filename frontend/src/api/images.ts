import apiClient from './client'
import axios from 'axios'

export interface Image {
  id: string
  album_id: string
  filename: string
  original_filename: string
  mime_type: string
  file_size: number
  width: number
  height: number
  thumbnail_url: string
  medium_url: string
  original_url: string
  created_at: string
}

export interface UploadProgress {
  filename: string
  progress: number
  status: 'pending' | 'uploading' | 'complete' | 'error'
  error?: string
}

export interface UploadResponse {
  id: string
  filename: string
  original_filename: string
  success: boolean
  message: string
}

export const imagesApi = {
  getAlbumImages: async (
    albumId: string,
    includeSubfolders = false,
    skip = 0,
    limit = 200
  ): Promise<Image[]> => {
    const response = await apiClient.get<Image[]>(`/images/album/${albumId}`, {
      params: {
        include_subfolders: includeSubfolders,
        skip,
        limit,
      },
    })
    return response.data
  },
  
  getImage: async (id: string): Promise<Image> => {
    const response = await apiClient.get<Image>(`/images/${id}`)
    return response.data
  },
  
  uploadImage: async (
    albumId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    
    // Get auth token
    const authData = localStorage.getItem('gallery-auth')
    let token = ''
    if (authData) {
      try {
        const { state } = JSON.parse(authData)
        token = state?.token || ''
      } catch {
        // Ignore
      }
    }
    
    const response = await axios.post<UploadResponse>(
      `/api/images/upload/${albumId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: token ? `Bearer ${token}` : '',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            onProgress(progress)
          }
        },
      }
    )
    return response.data
  },
  
  uploadImagesBulk: async (
    albumId: string,
    files: File[]
  ): Promise<UploadResponse[]> => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })
    
    const response = await apiClient.post<UploadResponse[]>(
      `/images/upload/${albumId}/bulk`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },
  
  deleteImage: async (id: string): Promise<void> => {
    await apiClient.delete(`/images/${id}`)
  },
  
  setCoverImage: async (id: string): Promise<void> => {
    await apiClient.post(`/images/${id}/set-cover`)
  },
  
  // Get image URL with auth token for display
  getImageUrl: (image: Image, resolution: 'thumbnail' | 'medium' | 'original'): string => {
    const authData = localStorage.getItem('gallery-auth')
    let token = ''
    if (authData) {
      try {
        const { state } = JSON.parse(authData)
        token = state?.token || ''
      } catch {
        // Ignore
      }
    }
    
    // For images, we'll use the URL directly with auth header
    // But since img tags can't use headers, we need to handle this differently
    // Option: Use blob URLs or add token as query param (less secure but simpler)
    const baseUrl = `/api/images/${image.id}/${resolution}`
    return baseUrl
  },
}

// Helper to fetch image as blob with auth
export async function fetchImageWithAuth(url: string): Promise<string> {
  const authData = localStorage.getItem('gallery-auth')
  let token = ''
  if (authData) {
    try {
      const { state } = JSON.parse(authData)
      token = state?.token || ''
    } catch {
      // Ignore
    }
  }
  
  const response = await fetch(url, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch image')
  }
  
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}
